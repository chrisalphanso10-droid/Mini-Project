/**
 * FixIt Now - Request Controller
 * Conforms to docs/SRS.md FR-C6, FR-C7, FR-C9, FR-C10 to FR-C12, FR-C19, FR-P7, FR-P9, FR-M1 to FR-M6.
 */

import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import { query, getClient } from '../config/db.js';
import { REQUEST_UPLOAD_DIR } from '../middleware/upload.middleware.js';
import { geocodeAddress } from '../services/geocoding.service.js';
import { findEligiblePartnersFromDb, MATCHING_RADIUS_KM } from '../services/matching.service.js';
import {
  startRequestMatching,
  handlePartnerAccept,
  handlePartnerDecline,
  handleCustomerCancel,
  startMovementSimulation,
  stopMovementSimulation,
  notifyPartnerArrived,
  notifyRequestStatusUpdate,
  getIo,
} from '../services/socket.service.js';
import {
  calculateEta,
  interpolatePositionAlongPolyline,
  getStraightLineFallbackRoute,
  computePolylineDistance,
} from '../services/routes.service.js';
import { createNotification } from './notification.controller.js';

/**
 * 1. Create a New Service Request (SRS FR-C6, FR-C9, FR-C10)
 * Immediate requests only; geocodes location, persists record, finds eligible partners within 2 km,
 * and launches sequential Socket.IO dispatch.
 */
export async function createRequest(req, res, next) {
  try {
    const customerId = req.user.id;
    const {
      service_id,
      problem,
      description,
      address,
      latitude,
      longitude,
    } = req.body;

    if (!service_id) {
      return res.status(400).json({ status: 'error', message: 'Service category is required.' });
    }
    if (!problem?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Problem headline is required.' });
    }
    if (!description?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Fault description is required.' });
    }
    if (!address?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Service street address is required.' });
    }

    // Verify service exists
    const serviceRes = await query(
      'SELECT id, name, base_price_estimate FROM services WHERE id = $1 AND active = true',
      [service_id]
    );
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Selected service category is not available.' });
    }
    const serviceObj = serviceRes.rows[0];

    // Fetch customer details
    const custRes = await query('SELECT name, phone FROM customers WHERE id = $1', [customerId]);
    const customerName = custRes.rows[0]?.name || 'Customer';
    const customerPhone = custRes.rows[0]?.phone || '';

    // Handle photo URL from Multer file or body
    let photoUrl = null;
    if (req.file) {
      photoUrl = `uploads/requests/${req.file.filename}`;
    } else if (req.body.photo_url) {
      photoUrl = req.body.photo_url;
    }

    // Geocode address if coordinates are missing, zero, or need authoritative geocoding
    let lat = latitude != null ? Number(latitude) : null;
    let lon = longitude != null ? Number(longitude) : null;
    if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon) || (lat === 0 && lon === 0)) {
      const geo = await geocodeAddress(address.trim());
      if (!geo || geo.latitude == null || geo.longitude == null) {
        return res.status(400).json({
          status: 'error',
          message: 'Address could not be found. Please add a nearby landmark or the pincode.',
        });
      }
      lat = geo.latitude;
      lon = geo.longitude;
    }

    // Generate 6-digit service OTP (SRS FR-C16)
    const serviceOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Concurrency requirement f: Customer row lock inside transaction serializes concurrent double-clicks
    const client = await getClient();
    let existing = null;
    let newRequest = null;

    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM customers WHERE id = $1 FOR UPDATE', [customerId]);

      // Check if the same customer submitted the same service within the last few seconds
      const recentRes = await client.query(
        `SELECT * FROM requests
         WHERE customer_id = $1
           AND service_id = $2
           AND status IN ('searching', 'requested')
           AND created_at > (CURRENT_TIMESTAMP - INTERVAL '5 seconds')
         ORDER BY created_at DESC
         LIMIT 1`,
        [customerId, serviceObj.id]
      );

      if (recentRes.rows.length > 0) {
        existing = recentRes.rows[0];
        await client.query('COMMIT');
      } else {
        const insertResult = await client.query(
          `INSERT INTO requests (
             customer_id, service_id, problem, description, address, latitude, longitude, photo_url, status, service_otp
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'searching', $9)
           RETURNING *`,
          [
            customerId,
            serviceObj.id,
            problem.trim(),
            description.trim(),
            address.trim(),
            lat,
            lon,
            photoUrl,
            serviceOtp,
          ]
        );
        newRequest = insertResult.rows[0];

        // Insert initial status log tick
        await client.query(
          `INSERT INTO request_status_logs (request_id, status) VALUES ($1, 'searching')`,
          [newRequest.id]
        );

        await client.query('COMMIT');
      }
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    if (existing) {
      const orderNumber = `ORD-${String(existing.id).replace(/-/g, '').slice(0, 4).toUpperCase()}`;
      return res.status(200).json({
        status: 'success',
        message: 'Request created. Scanning for nearby eligible partners...',
        data: {
          request: {
            ...existing,
            order_number: orderNumber,
            service_name: serviceObj.name,
            base_price_estimate: serviceObj.base_price_estimate,
            customer_name: customerName,
            customer_phone: customerPhone,
          },
          order_number: orderNumber,
          dispatch_status: 'searching',
        },
      });
    }

    const orderNumber = `ORD-${String(newRequest.id).replace(/-/g, '').slice(0, 4).toUpperCase()}`;

    // Query eligible partners within configured matching radius (online, KYC verified, active plan, no active job, service match)
    const eligiblePartners = await findEligiblePartnersFromDb(serviceObj.id, lat, lon, MATCHING_RADIUS_KM);

    const fullRequestRecord = {
      ...newRequest,
      order_number: orderNumber,
      service_name: serviceObj.name,
      base_price_estimate: serviceObj.base_price_estimate,
      customer_name: customerName,
      customer_phone: customerPhone,
      matching_radius_km: MATCHING_RADIUS_KM,
    };

    // Initiate Socket.IO matching broadcast offer loop
    const dispatchResult = await startRequestMatching(fullRequestRecord, eligiblePartners);

    return res.status(201).json({
      status: 'success',
      message: dispatchResult.success
        ? 'Request created. Scanning for nearby eligible partners...'
        : 'All partners busy, try again later',
      data: {
        request: fullRequestRecord,
        order_number: orderNumber,
        eligible_partners_count: eligiblePartners.length,
        dispatch_status: dispatchResult.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. Get Request Details by ID (SRS FR-C13, FR-C14)
 */
export async function getRequestById(req, res, next) {
  try {
    const requestId = req.params.id;

    const result = await query(
      `SELECT
         r.*,
         s.name AS service_name,
         s.base_price_estimate,
         c.name AS customer_name,
         c.phone AS customer_phone,
         p.name AS partner_name,
         p.phone AS partner_phone,
         (SELECT ROUND(AVG(r2.stars)::numeric, 2) FROM ratings r2 WHERE r2.partner_id = p.id) AS partner_rating,
         p.total_jobs AS partner_total_jobs,
         p.badge AS partner_badge,
         p.vehicle AS partner_vehicle,
         p.vehicle_type AS partner_vehicle_type,
         p.photo_url AS partner_photo_url,
         p.latitude AS partner_lat,
         p.longitude AS partner_lon
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN customers c ON r.customer_id = c.id
       LEFT JOIN partners p ON r.partner_id = p.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Request not found.' });
    }

    const row = result.rows[0];

    // Authorization & Ownership check (Security & Privacy)
    const user = req.user;
    if (user && user.role !== 'admin') {
      if (user.role === 'customer' && row.customer_id !== user.id) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized to view this request.' });
      }
      if (user.role === 'partner' && row.partner_id && row.partner_id !== user.id) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized to view this request.' });
      }
    }

    const orderNumber = `ORD-${String(row.id).replace(/-/g, '').slice(0, 4).toUpperCase()}`;

    // Map status to step index for tracking screen
    const stepMap = {
      requested: 0,
      accepted: 1,
      partner_on_way: 2,
      partner_arrived: 3,
      service_started: 4,
      service_completed: 5,
      payment_completed: 6,
      cancelled: -1,
    };

    const partnerData = row.partner_id
      ? {
          id: row.partner_id,
          name: row.partner_name,
          phone: row.partner_phone,
          rating: row.partner_rating != null ? parseFloat(row.partner_rating) : null,
          total_jobs: row.partner_total_jobs,
          badge: row.partner_badge,
          vehicle: row.partner_vehicle,
          vehicle_type: row.vehicle_type || row.partner_vehicle_type || 'bike_scooter',
          photo_url: row.partner_photo_url,
          latitude: row.partner_lat,
          longitude: row.partner_lon,
        }
      : null;

    // Query all status transition logs with timestamps
    const logsRes = await query(
      `SELECT id, status, created_at
       FROM request_status_logs
       WHERE request_id = $1
       ORDER BY created_at ASC`,
      [requestId]
    );

    // Compute dynamic live tracking telemetry
    let routeGeometry = row.route_geometry
      ? (typeof row.route_geometry === 'string' ? JSON.parse(row.route_geometry) : row.route_geometry)
      : null;
    let totalDistanceKm = row.route_distance_km != null ? Number(row.route_distance_km) : null;
    let speedKmh = row.speed_kmh != null ? Number(row.speed_kmh) : (config.twoWheelerSpeedKmh || 30);
    const tripStartedAt = row.trip_started_at;

    // Fallback if geometry missing but request is accepted or in active trip
    if (!routeGeometry && (row.partner_lat || row.latitude)) {
      const pLat = Number(row.partner_lat) || (Number(row.latitude) - 0.007);
      const pLon = Number(row.partner_lon) || (Number(row.longitude) - 0.005);
      const cLat = Number(row.latitude);
      const cLon = Number(row.longitude);
      const fb = getStraightLineFallbackRoute(pLat, pLon, cLat, cLon, speedKmh);
      routeGeometry = fb.geometry;
      totalDistanceKm = fb.distanceKm;
    }

    if (totalDistanceKm == null && routeGeometry) {
      totalDistanceKm = computePolylineDistance(routeGeometry);
    }

    const currentStepIndex = stepMap[row.status] ?? 0;
    let currentPosition = null;
    let remainingDistanceKm = totalDistanceKm != null ? parseFloat(Number(totalDistanceKm).toFixed(1)) : 0.0;
    let etaMinutes = calculateEta(remainingDistanceKm, speedKmh);
    let progress = 0.0;

    if (currentStepIndex <= 1) {
      // Step 0 or 1: Before start trip
      currentPosition = routeGeometry && routeGeometry.length > 0
        ? { latitude: routeGeometry[0][0], longitude: routeGeometry[0][1] }
        : { latitude: Number(row.partner_lat || row.latitude), longitude: Number(row.partner_lon || row.longitude) };
      remainingDistanceKm = totalDistanceKm != null ? parseFloat(Number(totalDistanceKm).toFixed(1)) : 0.0;
      etaMinutes = calculateEta(remainingDistanceKm, speedKmh);
      progress = 0.0;
    } else if (currentStepIndex === 2) {
      // Step 2: Partner on way - pure function of elapsed time
      const startTimeMs = tripStartedAt ? new Date(tripStartedAt).getTime() : Date.now();
      const elapsedHours = Math.max(0, (Date.now() - startTimeMs) / 3600000);
      const distCovered = Math.min(totalDistanceKm || 0, speedKmh * elapsedHours);
      remainingDistanceKm = Math.max(0, parseFloat(((totalDistanceKm || 0) - distCovered).toFixed(1)));
      etaMinutes = calculateEta(remainingDistanceKm, speedKmh);
      progress = totalDistanceKm > 0 ? Math.min(1.0, distCovered / totalDistanceKm) : 1.0;
      currentPosition = routeGeometry
        ? interpolatePositionAlongPolyline(routeGeometry, distCovered)
        : { latitude: Number(row.latitude), longitude: Number(row.longitude) };
    } else {
      // Step 3+: Arrived / In Progress / Completed
      currentPosition = { latitude: Number(row.latitude), longitude: Number(row.longitude) };
      remainingDistanceKm = 0.0;
      etaMinutes = 0;
      progress = 1.0;
    }

    const dataPayload = {
      ...row,
      order_number: orderNumber,
      has_photo: Boolean(row.photo_url),
      step_index: currentStepIndex,
      partner: partnerData,
      matching_radius_km: MATCHING_RADIUS_KM,
      status_logs: logsRes.rows,
      route_geometry: routeGeometry,
      route_distance_km: totalDistanceKm,
      total_distance_km: totalDistanceKm,
      speed_kmh: speedKmh,
      trip_started_at: tripStartedAt,
      current_position: currentPosition,
      remaining_distance_km: remainingDistanceKm,
      eta_minutes: etaMinutes,
      eta_label: `ETA: ${etaMinutes} MIN`,
      progress: parseFloat(progress.toFixed(4)),
    };

    // OTP security: strictly exclude service_otp from partner view
    if (req.user && req.user.role === 'partner') {
      delete dataPayload.service_otp;
    }

    // Customer privacy: strictly exclude vehicle, vehicle_name, registration_number, vehicle_type, speed_kmh
    if (req.user && req.user.role === 'customer') {
      delete dataPayload.vehicle_type;
      delete dataPayload.speed_kmh;
      delete dataPayload.partner_vehicle;
      delete dataPayload.partner_vehicle_type;
      if (dataPayload.partner) {
        delete dataPayload.partner.vehicle;
        delete dataPayload.partner.vehicle_name;
        delete dataPayload.partner.registration_number;
        delete dataPayload.partner.vehicle_type;
        delete dataPayload.partner.speed_kmh;
      }
    }

    return res.status(200).json({
      status: 'success',
      data: dataPayload,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Get Request History (SRS FR-C7, FR-P11)
 * Supports customer and partner roles with status filtering ('all', 'completed', 'cancelled').
 */
export async function getRequestHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const filter = (req.query.filter || req.query.status || 'all').toLowerCase();

    let condition = '';
    const params = [userId];

    if (userRole === 'partner') {
      condition = 'r.partner_id = $1';
    } else {
      condition = 'r.customer_id = $1';
    }

    if (filter === 'completed') {
      condition += " AND r.status IN ('service_completed', 'payment_completed', 'completed')";
    } else if (filter === 'cancelled') {
      condition += " AND r.status = 'cancelled'";
    }

    const result = await query(
      `SELECT
         r.*,
         s.name AS service_name,
         s.base_price_estimate,
         c.name AS customer_name,
         c.phone AS customer_phone,
         p.name AS partner_name,
         p.phone AS partner_phone,
         (SELECT ROUND(AVG(r2.stars)::numeric, 2) FROM ratings r2 WHERE r2.partner_id = p.id) AS partner_rating,
         p.vehicle AS partner_vehicle,
         p.vehicle_type AS partner_vehicle_type,
         p.latitude AS partner_lat,
         p.longitude AS partner_lon,
         rat.stars AS rating_stars,
         rat.comment AS rating_comment,
         pay.receipt_no,
         pay.payment_method,
         pay.amount AS paid_amount
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN customers c ON r.customer_id = c.id
       LEFT JOIN partners p ON r.partner_id = p.id
       LEFT JOIN LATERAL (
         SELECT stars, comment FROM ratings WHERE request_id = r.id ORDER BY created_at DESC LIMIT 1
       ) rat ON true
       LEFT JOIN LATERAL (
         SELECT receipt_no, payment_method, amount FROM payments WHERE request_id = r.id AND (status IN ('successful', 'completed', 'paid') OR status IS NULL) ORDER BY created_at DESC LIMIT 1
       ) pay ON true
       WHERE ${condition}
       ORDER BY r.created_at DESC`,
      params
    );

    const rows = result.rows;

    const mapped = rows.map((row) => {
      const normalizedStatus =
        row.status === 'cancelled'
          ? 'cancelled'
          : ['service_completed', 'payment_completed', 'completed'].includes(row.status)
          ? 'completed'
          : row.status;

      return {
        ...row,
        status: normalizedStatus,
        order_number: `ORD-${String(row.id).replace(/-/g, '').slice(0, 4).toUpperCase()}`,
        rating: row.rating_stars
          ? { stars: row.rating_stars, comment: row.rating_comment }
          : null,
        amount: parseFloat(row.paid_amount || row.base_price_estimate) || 450.0,
        payment_mode: row.payment_method || 'Direct UPI / Cash (On-site)',
        receipt_no: row.receipt_no,
        completed_at: row.updated_at || row.created_at,
        partner: row.partner_id
          ? {
              id: row.partner_id,
              name: row.partner_name,
              phone: row.partner_phone,
              rating: row.partner_rating != null ? parseFloat(row.partner_rating) : null,
              service_name: row.service_name,
              latitude: row.partner_lat,
              longitude: row.partner_lon,
              ...(req.user && req.user.role !== 'customer'
                ? {
                    vehicle: row.partner_vehicle,
                    vehicle_type: row.vehicle_type || row.partner_vehicle_type || 'bike_scooter',
                  }
                : {}),
            }
          : null,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: mapped,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. Cancel Service Request (SRS FR-C19, FR-T3)
 */
export async function cancelRequest(req, res, next) {
  try {
    const requestId = req.params.id;
    const { reason } = req.body;
    const customerId = req.user.id;

    // Verify ownership
    const check = await query('SELECT id, status, customer_id FROM requests WHERE id = $1', [
      requestId,
    ]);
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Request not found.' });
    }

    const currentReq = check.rows[0];
    if (req.user.role !== 'admin' && (req.user.role !== 'customer' || currentReq.customer_id !== customerId)) {
      return res.status(403).json({ status: 'error', message: 'You can only cancel your own requests.' });
    }

    if (currentReq.status === 'service_completed' || currentReq.status === 'payment_completed') {
      return res.status(400).json({ status: 'error', message: 'Cannot cancel a completed service.' });
    }

    const cancelReason = reason?.trim() || 'Cancelled by customer';
    await handleCustomerCancel(requestId, cancelReason);

    return res.status(200).json({
      status: 'success',
      message: 'Request cancelled successfully.',
      data: {
        id: requestId,
        status: 'cancelled',
        cancel_reason: cancelReason,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. Partner Respond to Incoming Request (Accept / Decline) (SRS FR-P9, FR-P7)
 */
export async function respondToRequest(req, res, next) {
  try {
    const requestId = req.params.id;
    const partnerId = req.user.id;
    const { decision, reason } = req.body;

    if (decision !== 'accept' && decision !== 'decline') {
      return res.status(400).json({ status: 'error', message: "Decision must be 'accept' or 'decline'." });
    }

    if (decision === 'accept') {
      const result = await handlePartnerAccept(requestId, partnerId);
      if (!result.success) {
        // Requirement: Never an error page and never an HTTP 500
        return res.status(result.reason === 'taken' ? 409 : 400).json({
          status: 'fail',
          code: result.reason,
          message: result.message,
          data: result,
        });
      }
      return res.status(200).json({
        status: 'success',
        message: 'Work order accepted.',
        data: result,
      });
    } else {
      const result = await handlePartnerDecline(requestId, partnerId, reason);
      return res.status(200).json({
        status: 'success',
        message: 'Request declined.',
        data: result,
      });
    }
  } catch (err) {
    // Graceful error fallback - never 500
    return res.status(400).json({
      status: 'fail',
      message: err.message || 'Unable to process response.',
    });
  }
}

/**
 * 6. Update Request Status (Partner advances work order lifecycle)
 * Statuses: 'on_the_way' (2), 'arrived' (3), 'completed' (5), 'paid' (6)
 */
export async function updateRequestStatus(req, res, next) {
  try {
    const requestId = req.params.id;
    const partnerId = req.user.id;
    const { status } = req.body;

    const allowedTransitions = [
      'accepted',
      'start_trip',
      'on_the_way',
      'partner_on_way',
      'arrived',
      'partner_arrived',
      'start_service',
      'service_started',
      'in_progress',
      'completed',
      'service_completed',
      'payment_received',
      'paid',
      'payment_completed',
    ];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status transition: ${status}. Must be one of: ${allowedTransitions.join(', ')}.`,
      });
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid work order ID format. Request ID must be a valid UUID.',
      });
    }

    const check = await query(
      `SELECT r.id, r.status, r.customer_id, r.partner_id, r.service_otp,
              r.latitude AS customer_lat, r.longitude AS customer_lon,
              r.route_geometry, r.route_distance_km, r.speed_kmh, r.trip_started_at,
              c.name AS customer_name, c.phone AS customer_phone,
              s.name AS service_name,
              p.latitude AS partner_lat, p.longitude AS partner_lon
       FROM requests r
       JOIN customers c ON r.customer_id = c.id
       JOIN services s ON r.service_id = s.id
       LEFT JOIN partners p ON r.partner_id = p.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Request not found.' });
    }

    const currentReq = check.rows[0];
    if (String(currentReq.partner_id) !== String(partnerId)) {
      return res.status(403).json({ status: 'error', message: 'You are not the assigned partner for this request.' });
    }

    // Idempotent double "Payment received": if already terminal, return success without double counting
    if (currentReq.status === 'completed' || currentReq.status === 'payment_completed') {
      if (['completed', 'payment_received', 'paid', 'payment_completed'].includes(status)) {
        try {
          await query(`UPDATE partners SET online = true WHERE id = $1`, [partnerId]);
        } catch {}
        stopMovementSimulation(requestId);
        return res.status(200).json({
          status: 'success',
          message: 'Work order is already completed.',
          data: {
            id: requestId,
            status: currentReq.status,
            step_index: 6,
          },
        });
      }
    }

    // Step index and DB status mapping (matches docs/SRS.md and db/schema.sql constraints)
    const statusMap = {
      accepted: { dbStatus: 'accepted', stepIndex: 1 },
      start_trip: { dbStatus: 'partner_on_way', stepIndex: 2 },
      on_the_way: { dbStatus: 'partner_on_way', stepIndex: 2 },
      partner_on_way: { dbStatus: 'partner_on_way', stepIndex: 2 },
      arrived: { dbStatus: 'partner_arrived', stepIndex: 3 },
      partner_arrived: { dbStatus: 'partner_arrived', stepIndex: 3 },
      start_service: { dbStatus: 'service_started', stepIndex: 4 },
      in_progress: { dbStatus: 'service_started', stepIndex: 4 },
      service_started: { dbStatus: 'service_started', stepIndex: 4 },
      service_completed: { dbStatus: 'service_completed', stepIndex: 5 },
      completed: { dbStatus: 'completed', stepIndex: 6 },
      payment_received: { dbStatus: 'completed', stepIndex: 6 },
      paid: { dbStatus: 'completed', stepIndex: 6 },
      payment_completed: { dbStatus: 'completed', stepIndex: 6 },
      cancelled: { dbStatus: 'cancelled', stepIndex: -1 },
    };
    const mapped = statusMap[status] || { dbStatus: status, stepIndex: 1 };
    const dbStatus = mapped.dbStatus;
    const stepIndex = mapped.stepIndex;

    // Update DB with valid enum status
    await query(
      `UPDATE requests
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [dbStatus, requestId]
    );

    await query(
      `INSERT INTO request_status_logs (request_id, status) VALUES ($1, $2)`,
      [requestId, dbStatus]
    );

    // Movement Simulation: Start when partner begins trip (SRS FR-T2, FR-C15)
    if (dbStatus === 'partner_on_way') {
      let tripStartedAt = currentReq.trip_started_at;
      if (!tripStartedAt) {
        const updateStart = await query(
          `UPDATE requests SET trip_started_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING trip_started_at`,
          [requestId]
        );
        tripStartedAt = updateStart.rows[0]?.trip_started_at || new Date().toISOString();
      }

      let routeGeometry = currentReq.route_geometry;
      let totalDistanceKm = currentReq.route_distance_km != null ? Number(currentReq.route_distance_km) : null;
      let speedKmh = currentReq.speed_kmh != null ? Number(currentReq.speed_kmh) : (config.twoWheelerSpeedKmh || 30);

      if (!routeGeometry) {
        const cLat = Number(currentReq.customer_lat);
        const cLon = Number(currentReq.customer_lon);
        const pLat = Number(currentReq.partner_lat) || cLat;
        const pLon = Number(currentReq.partner_lon) || cLon;
        const fb = getStraightLineFallbackRoute(pLat, pLon, cLat, cLon, speedKmh);
        routeGeometry = fb.geometry;
        totalDistanceKm = fb.distanceKm;

        await query(
          `UPDATE requests SET route_geometry = $1, route_distance_km = $2, speed_kmh = $3 WHERE id = $4`,
          [JSON.stringify(routeGeometry), totalDistanceKm, speedKmh, requestId]
        );
      }

      startMovementSimulation({
        requestId,
        partnerId,
        customerId: currentReq.customer_id,
        routeGeometry: typeof routeGeometry === 'string' ? JSON.parse(routeGeometry) : routeGeometry,
        totalDistanceKm,
        speedKmh,
        tripStartedAt,
        destinationLat: currentReq.customer_lat,
        destinationLon: currentReq.customer_lon,
      });
    } else if (dbStatus === 'partner_arrived') {
      let otp = currentReq.service_otp;
      if (!otp) {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        await query('UPDATE requests SET service_otp = $1 WHERE id = $2', [otp, requestId]);
      }

      notifyPartnerArrived(requestId, {
        customerId: currentReq.customer_id,
        partnerId,
        destinationLat: currentReq.customer_lat,
        destinationLon: currentReq.customer_lon,
        serviceOtp: otp,
      });
    } else if (dbStatus === 'service_completed' || dbStatus === 'completed' || dbStatus === 'payment_completed') {
      stopMovementSimulation(requestId);
    }

    // When payment is received / job completed: ensure payment record exists, count earnings once, release partner lock immediately
    if (dbStatus === 'completed' || dbStatus === 'payment_completed') {
      try {
        const payCheck = await query('SELECT id FROM payments WHERE request_id = $1', [requestId]);
        if (payCheck.rows.length === 0) {
          const receiptNo = `REC-${String(requestId).replace(/-/g, '').slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const amount = parseFloat(currentReq.base_price_estimate) || 450.0;
          await query(
            `INSERT INTO payments (request_id, amount, status, receipt_no, payment_method)
             VALUES ($1, $2, 'successful', $3, 'Direct Cash / UPI (On-site)')`,
            [requestId, amount, receiptNo]
          );
        }

        await query(
          `UPDATE partners SET total_jobs = total_jobs + 1, online = true WHERE id = $1`,
          [partnerId]
        );
      } catch (err) {
        console.warn('[Partner stats update warning]:', err.message);
      }
    }

    // Notify customer and partner rooms via Socket.IO
    if (dbStatus !== 'partner_arrived') {
      notifyRequestStatusUpdate(requestId, dbStatus, stepIndex, {
        customerId: currentReq.customer_id,
        partnerId,
        service_name: currentReq.service_name,
        customer_name: currentReq.customer_name,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Request status updated to ${dbStatus}.`,
      data: {
        id: requestId,
        status: dbStatus,
        step_index: stepIndex,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 7. Verify Service OTP (Partner arrives and customer provides 6-digit OTP to start service)
 * Transitions status to 'in_progress' (Step 4)
 */
export async function verifyRequestOtp(req, res, next) {
  try {
    const requestId = req.params.id;
    const partnerId = req.user.id;
    const { otp } = req.body;

    if (!otp || !otp.toString().trim()) {
      return res.status(400).json({
        status: 'error',
        message: '6-digit service OTP is required.',
      });
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid work order ID format. Request ID must be a valid UUID.',
      });
    }

    const check = await query(
      `SELECT r.id, r.status, r.customer_id, r.partner_id, r.service_otp,
              c.name AS customer_name, s.name AS service_name
       FROM requests r
       JOIN customers c ON r.customer_id = c.id
       JOIN services s ON r.service_id = s.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Request not found.' });
    }

    const currentReq = check.rows[0];
    if (String(currentReq.partner_id) !== String(partnerId)) {
      return res.status(403).json({ status: 'error', message: 'You are not the assigned partner for this request.' });
    }

    const cleanInputOtp = otp.toString().trim();
    const expectedOtp = String(currentReq.service_otp).trim();

    if (cleanInputOtp !== expectedOtp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid service verification OTP. Please ask the customer for the 6-digit code shown on their tracking screen.',
      });
    }

    // Advance to 'service_started' (Step 4 in db/schema.sql)
    await query(
      `UPDATE requests
       SET status = 'service_started', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [requestId]
    );

    await query(
      `INSERT INTO request_status_logs (request_id, status) VALUES ($1, 'service_started')`,
      [requestId]
    );

    notifyRequestStatusUpdate(requestId, 'service_started', 4, {
      customerId: currentReq.customer_id,
      partnerId,
      service_name: currentReq.service_name,
      customer_name: currentReq.customer_name,
      status: 'service_started',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Service OTP verified successfully. Work order is now in progress.',
      data: {
        id: requestId,
        status: 'service_started',
        step_index: 4,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. Submit Customer Rating (SRS FR-C17)
 */
export async function rateRequest(req, res, next) {
  try {
    const requestId = req.params.id;
    const { stars, rating, comment, feedback, review } = req.body;

    const rawStars = stars !== undefined ? stars : (rating !== undefined ? rating : 5);
    const parsedStars = parseInt(rawStars, 10);
    if (isNaN(parsedStars) || parsedStars < 1 || parsedStars > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating must be an integer between 1 and 5 stars.' });
    }
    const numStars = parsedStars;

    // Fixed default lines per star value (enforced on server; client value ignored)
    const STAR_REVIEW_LINES = {
      1: 'Poor service, not satisfied',
      2: 'Below expectations',
      3: 'Okay, could be better',
      4: 'Good service',
      5: 'Excellent service',
    };
    const reviewLine = STAR_REVIEW_LINES[numStars] || 'Good service';

    // Optional feedback comment (empty string becomes null)
    const rawFeedback = feedback !== undefined
      ? feedback
      : (comment !== undefined ? comment : (review !== undefined ? review : ''));
    const trimmedFeedback = typeof rawFeedback === 'string' ? rawFeedback.trim() : '';
    const cleanFeedback = trimmedFeedback.length > 0 ? trimmedFeedback : null;
    const legacyComment = cleanFeedback || reviewLine;

    const check = await query(
      `SELECT r.id, r.customer_id, r.partner_id, r.status, r.rating_status, c.name AS customer_name
       FROM requests r
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Request not found.' });
    }

    const currentReq = check.rows[0];

    // Ownership check: Customer must own this request (or admin)
    if (req.user && req.user.role !== 'admin' && String(currentReq.customer_id) !== String(req.user.id)) {
      return res.status(403).json({ status: 'error', message: 'You can only rate your own service requests.' });
    }

    // Status check: Request must be completed or paid
    if (
      currentReq.status !== 'service_completed' &&
      currentReq.status !== 'payment_completed' &&
      currentReq.status !== 'completed'
    ) {
      return res.status(400).json({ status: 'error', message: 'Cannot rate a request that has not been completed.' });
    }

    const partnerId = currentReq.partner_id;
    if (!partnerId) {
      return res.status(400).json({ status: 'error', message: 'No partner was assigned to this request.' });
    }

    // Check if rating was already skipped (submit after skip is refused cleanly)
    if (currentReq.rating_status === 'skipped') {
      return res.status(400).json({
        status: 'error',
        message: 'Rating has already been skipped for this work order.',
      });
    }

    // Check if already rated (idempotent double rating returns 200 without error)
    const existingRating = await query(
      'SELECT id, request_id, partner_id, stars, comment, review_line, feedback, created_at FROM ratings WHERE request_id = $1',
      [requestId]
    );
    if (existingRating.rows.length > 0 || currentReq.rating_status === 'submitted') {
      return res.status(200).json({
        status: 'success',
        message: 'This request has already been rated.',
        data: existingRating.rows[0] || null,
      });
    }

    const ratingRes = await query(
      `INSERT INTO ratings (request_id, partner_id, stars, comment, review_line, feedback)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, request_id, partner_id, stars, comment, review_line, feedback, created_at`,
      [requestId, partnerId, numStars, legacyComment, reviewLine, cleanFeedback]
    );

    // Update rating_status on request to 'submitted'
    try {
      await query(
        "UPDATE requests SET rating_status = 'submitted' WHERE id = $1",
        [requestId]
      );
    } catch (reqStatusErr) {
      console.warn('[Request Rating Status Update Warning]:', reqStatusErr.message);
    }

    try {
      await query(
        `UPDATE partners
         SET rating = (SELECT ROUND(AVG(stars)::numeric, 2) FROM ratings WHERE partner_id = $1)
         WHERE id = $1`,
        [partnerId]
      );
    } catch (err) {
      console.warn('[Partner Rating Update Warning]:', err.message);
    }

    try {
      const notifText = cleanFeedback
        ? `A customer gave you ${numStars}★: "${cleanFeedback.slice(0, 60)}"`
        : `A customer gave you ${numStars}★: "${reviewLine}"`;
      await createNotification({
        recipientType: 'partner',
        recipientId: partnerId,
        title: 'New Customer Review',
        message: notifText,
      });
    } catch (notifErr) {
      console.warn('[Rating notification warning]:', notifErr.message);
    }

    try {
      const io = getIo();
      if (io) {
        const orderNumber =
          currentReq.order_number ||
          `ORD-${String(requestId).replace(/-/g, '').slice(0, 4).toUpperCase()}`;
        const ratingPayload = {
          requestId,
          order_number: orderNumber,
          stars: numStars,
          comment: cleanFeedback || reviewLine,
          review_line: reviewLine,
          feedback: cleanFeedback || null,
          customer_name: currentReq.customer_name || 'Customer',
          created_at: ratingRes.rows[0].created_at,
          result: 'submitted',
          rating_status: 'submitted',
        };
        io.to(`partner:${partnerId}`).emit('rating_submitted', ratingPayload);
        io.to(`partner:${partnerId}`).emit('review_received', ratingPayload);
        io.to(`partner:${partnerId}`).emit('rating_status_updated', ratingPayload);
        io.to(`request:${requestId}`).emit('rating_submitted', ratingPayload);
        io.to(`request:${requestId}`).emit('review_received', ratingPayload);
        io.to(`request:${requestId}`).emit('rating_status_updated', ratingPayload);
      }
    } catch (socketErr) {
      console.warn('[Rating socket emission warning]:', socketErr.message);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Rating submitted successfully.',
      data: ratingRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8b. Skip Customer Rating
 * Records that customer skipped rating without creating a ratings row or modifying partner stats.
 * One decision per job: skip after submit -> 400, submit after skip -> 400, second skip -> 200 without changes.
 * Only the customer who owns a completed, payment-received job can skip; any other user is refused.
 */
export async function skipRequestRating(req, res, next) {
  try {
    const requestId = req.params.id;

    const check = await query(
      `SELECT r.id, r.customer_id, r.partner_id, r.status, r.rating_status, c.name AS customer_name
       FROM requests r
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Request not found.' });
    }

    const currentReq = check.rows[0];

    // Ownership check: Only customer who owns this request can skip (admin / non-owner refused)
    if (!req.user || req.user.role !== 'customer' || String(currentReq.customer_id) !== String(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the customer who owns this completed job can skip the rating.',
      });
    }

    // Status check: Only completed / payment-received job can skip
    const isCompletedOrPaid =
      currentReq.status === 'completed' ||
      currentReq.status === 'payment_completed' ||
      currentReq.status === 'service_completed';
    if (!isCompletedOrPaid) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot skip rating for a request that has not completed payment.',
      });
    }

    // Check if rating was already submitted (Skip after submit refused cleanly)
    const existingRating = await query(
      'SELECT id FROM ratings WHERE request_id = $1',
      [requestId]
    );
    if (currentReq.rating_status === 'submitted' || existingRating.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating has already been submitted for this work order.',
      });
    }

    // Second skip returns success without changing anything
    if (currentReq.rating_status === 'skipped') {
      return res.status(200).json({
        status: 'success',
        message: 'Rating was already skipped for this work order.',
        data: {
          requestId,
          rating_status: 'skipped',
        },
      });
    }

    // Update request rating_status to 'skipped' (NOT inserting into ratings table, NO change to partner average)
    await query(
      "UPDATE requests SET rating_status = 'skipped' WHERE id = $1",
      [requestId]
    );

    const partnerId = currentReq.partner_id;
    if (partnerId) {
      try {
        const io = getIo();
        if (io) {
          const orderNumber =
            currentReq.order_number ||
            `ORD-${String(requestId).replace(/-/g, '').slice(0, 4).toUpperCase()}`;
          const skipPayload = {
            requestId,
            order_number: orderNumber,
            result: 'skipped',
            rating_status: 'skipped',
            customer_name: currentReq.customer_name || 'Customer',
            skipped_at: new Date().toISOString(),
          };
          io.to(`partner:${partnerId}`).emit('rating_skipped', skipPayload);
          io.to(`partner:${partnerId}`).emit('rating_status_updated', skipPayload);
          io.to(`partner:${partnerId}`).emit('review_received', skipPayload);
          io.to(`request:${requestId}`).emit('rating_skipped', skipPayload);
          io.to(`request:${requestId}`).emit('rating_status_updated', skipPayload);
          io.to(`request:${requestId}`).emit('review_received', skipPayload);
        }
      } catch (socketErr) {
        console.warn('[Rating skip socket emission warning]:', socketErr.message);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Rating skipped successfully.',
      data: {
        requestId,
        rating_status: 'skipped',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 9. Get Customer Issue Photo
 * Served through an authenticated server route (accessible only to the customer who owns
 * the request, the accepted partner, or an admin; 401/403 otherwise).
 */
export async function getRequestPhoto(req, res, next) {
  try {
    const requestId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    const check = await query(
      `SELECT customer_id, partner_id, photo_url FROM requests WHERE id = $1`,
      [requestId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Request not found.' });
    }

    const row = check.rows[0];

    const isCustomer = user.role === 'customer' && String(row.customer_id) === String(user.id);
    const isAcceptedPartner = user.role === 'partner' && row.partner_id && String(row.partner_id) === String(user.id);
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isAcceptedPartner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You are not authorized to view this issue photo.',
      });
    }

    if (!row.photo_url) {
      return res.status(404).json({ status: 'error', message: 'No photo uploaded for this request.' });
    }

    const filename = path.basename(row.photo_url);
    const filePath = path.resolve(REQUEST_UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: 'error', message: 'Photo file not found on disk.' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, no-cache');

    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export default {
  createRequest,
  getRequestById,
  getRequestHistory,
  cancelRequest,
  respondToRequest,
  updateRequestStatus,
  verifyRequestOtp,
  rateRequest,
  getRequestPhoto,
};
