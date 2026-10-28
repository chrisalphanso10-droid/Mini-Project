/**
 * FixIt Now - Live Tracking Screen
 * Real Google Maps JavaScript API with two-wheeler route, live telemetry (distance & ETA),
 * custom styled markers (customer ink circle, partner signal square per docs/DESIGN.md),
 * pure function monotonic movement along route, synchronized arrival event, and automatic OTP popup.
 *
 * Fallback to schematic SVG map if Google Maps is unavailable.
 * Responsive layout: side-by-side at >=768px (tracking panel left, map right sticky), stacked below 768px (map first).
 * Conforms to SRS FR-C14, FR-C15, FR-C16, FR-T1, FR-T2 and docs/DESIGN.md Section 6.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { cancelServiceRequest } from '../../services/requestService';
import socketService from '../../services/socketService';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { formatRatingWithStar } from '../../services/partnerService';
import RouteTrackingMap from '../../components/tracking/RouteTrackingMap';

/**
 * Extracts locality, area name, or postal code from request address for the dispatch zone.
 * If neither exists, returns null so caller falls back to "2 KM RADIUS" without inventing names.
 */
function extractDispatchArea(address) {
  if (!address || typeof address !== 'string') return null;
  const cleaned = address.trim();
  if (!cleaned) return null;

  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);

  const broadTokens = new Set([
    'mumbai', 'navi mumbai', 'thane', 'pune', 'delhi',
    'maharashtra', 'india', 'in'
  ]);

  const pinMatch = cleaned.match(/\b\d{6}\b/);
  const pincode = pinMatch ? pinMatch[0] : null;

  const candidateParts = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const stripped = part.replace(/\b\d{6}\b/g, '').replace(/[-–]/g, '').trim();
    const lower = stripped.toLowerCase();

    if (!stripped || broadTokens.has(lower)) continue;
    if (/^(flat|shop|plot|house|building|no\.?|near|opp|behind)\b/i.test(stripped) && i === 0) continue;
    if (/^\d+[a-zA-Z]?(\/\d+)?$/.test(stripped)) continue;

    candidateParts.push(stripped);
  }

  if (candidateParts.length > 0) {
    return candidateParts[candidateParts.length - 1];
  }

  return pincode;
}

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0.0;
  const p1Lat = Number(lat1);
  const p1Lon = Number(lon1);
  const p2Lat = Number(lat2);
  const p2Lon = Number(lon2);
  if (Number.isNaN(p1Lat) || Number.isNaN(p1Lon) || Number.isNaN(p2Lat) || Number.isNaN(p2Lon)) return 0.0;
  if (p1Lat === p2Lat && p1Lon === p2Lon) return 0.0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(p2Lat - p1Lat);
  const dLon = toRad(p2Lon - p1Lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1Lat)) * Math.cos(toRad(p2Lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((6371 * c).toFixed(1));
}

export default function LiveTrackingView({
  activeRequest,
  onNavigate,
  onCancel,
}) {
  const matchingRadius = activeRequest?.matching_radius_km ?? 2;
  const radiusText = `${matchingRadius} KM`;
  const derivedArea = extractDispatchArea(activeRequest?.address);
  const dispatchZoneLabel = derivedArea
    ? `DISPATCH ZONE: ${derivedArea.toUpperCase()} (${radiusText})`
    : `${radiusText} RADIUS`;

  // Step index: 1 to 6
  // 1: Request accepted
  // 2: Partner on the way
  // 3: Partner arrived
  // 4: Service started (OTP verified)
  // 5: Service completed
  // 6: Payment completed
  const initialStep = activeRequest?.step_index || 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [partnerProgress, setPartnerProgress] = useState(
    initialStep <= 1 ? 0 : initialStep === 2 ? (activeRequest?.progress || 0.05) : 1.0
  );

  // Coordinates
  const customerLat = Number(activeRequest?.latitude || activeRequest?.customer_lat);
  const customerLng = Number(activeRequest?.longitude || activeRequest?.customer_lon);

  const partnerStartLat =
    Number(activeRequest?.partner?.latitude || activeRequest?.partner_lat) || customerLat;
  const partnerStartLng =
    Number(activeRequest?.partner?.longitude || activeRequest?.partner_lon) || customerLng;

  const straightLineDist = calculateHaversineKm(partnerStartLat, partnerStartLng, customerLat, customerLng);
  const initialDistanceKm = activeRequest?.route_distance_km != null
    ? Number(activeRequest.route_distance_km)
    : straightLineDist;

  const [remainingDistanceKm, setRemainingDistanceKm] = useState(
    initialStep >= 3
      ? 0.0
      : activeRequest?.remaining_distance_km != null
      ? Number(activeRequest.remaining_distance_km)
      : initialDistanceKm
  );

  const [totalDistanceKm, setTotalDistanceKm] = useState(initialDistanceKm);

  const [etaMinutes, setEtaMinutes] = useState(
    initialStep >= 3
      ? 0
      : activeRequest?.eta_minutes != null
      ? Number(activeRequest.eta_minutes)
      : Math.ceil(((initialDistanceKm || 0) / (Number(activeRequest?.speed_kmh) || 30)) * 60)
  );

  const etaLabel = activeRequest?.eta_label || 'ETA: 14 MIN';

  const [isCancelled, setIsCancelled] = useState(activeRequest?.status === 'cancelled');
  const [cancelledReasonText, setCancelledReasonText] = useState(activeRequest?.cancel_reason || '');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Found another solution');

  // Doorstep OTP modal: opens automatically when partner arrives (step 3),
  // remains accessible until verified (step < 4), opens on page reload if unverified.
  const [showOtpModal, setShowOtpModal] = useState(
    (initialStep === 3 ||
      activeRequest?.status === 'partner_arrived' ||
      activeRequest?.status === 'arrived') &&
      initialStep < 4
  );

  const [showPaymentModal, setShowPaymentModal] = useState(
    (initialStep === 5 ||
      activeRequest?.status === 'service_completed' ||
      activeRequest?.status === 'completed') &&
      !(
        initialStep >= 6 ||
        activeRequest?.status === 'paid' ||
        activeRequest?.status === 'payment_completed'
      )
  );
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentConfirmed, setPaymentConfirmed] = useState(
    initialStep >= 6 ||
      activeRequest?.status === 'paid' ||
      activeRequest?.status === 'payment_completed' ||
      false
  );

  const handleConfirmPayment = () => {
    setPaymentConfirmed(true);
    setCurrentStep(6);
    setShowPaymentModal(false);
    try {
      const raw = localStorage.getItem('fixit_active_request');
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = {
          ...parsed,
          status: 'payment_completed',
          step_index: 6,
          payment_method: paymentMethod,
          payment_confirmed: true,
        };
        localStorage.setItem('fixit_active_request', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('fixit_request_status_updated', { detail: updated })
        );
      }
    } catch {}
  };

  // Immediate reactive OTP display state
  const [currentOtp, setCurrentOtp] = useState(activeRequest?.service_otp || '');
  useEffect(() => {
    if (activeRequest?.service_otp) {
      setCurrentOtp(activeRequest.service_otp);
    }
  }, [activeRequest?.service_otp]);

  // Google Maps State
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const partnerMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const travelledPolylineRef = useRef(null);
  const untravelledPolylineRef = useRef(null);

  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  // Browser Public API Key
  const browserApiKey =
    import.meta.env.VITE_MAP_PUBLIC_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    '';

  const [currentPartnerPos, setCurrentPartnerPos] = useState({
    lat: initialStep >= 3 ? customerLat : partnerStartLat,
    lng: initialStep >= 3 ? customerLng : partnerStartLng,
  });

  // Decoded Route Geometry
  const routeGeometry = useMemo(() => {
    let geom = activeRequest?.route_geometry;
    if (typeof geom === 'string') {
      try {
        geom = JSON.parse(geom);
      } catch {
        geom = null;
      }
    }
    if (Array.isArray(geom) && geom.length >= 2) {
      return geom.map((pt) => {
        if (Array.isArray(pt)) return { lat: Number(pt[0]), lng: Number(pt[1]) };
        return { lat: Number(pt?.lat ?? pt?.latitude), lng: Number(pt?.lng ?? pt?.longitude) };
      });
    }
    // Fallback straight line between partner and customer
    return [
      { lat: partnerStartLat, lng: partnerStartLng },
      { lat: customerLat, lng: customerLng },
    ];
  }, [activeRequest?.route_geometry, partnerStartLat, partnerStartLng, customerLat, customerLng]);

  // Sync state from activeRequest prop updates
  useEffect(() => {
    const step = activeRequest?.step_index ?? currentStep;
    if (activeRequest?.step_index != null) {
      setCurrentStep(step);
      if (step >= 3) {
        setPartnerProgress(1.0);
        setEtaMinutes(0);
        setRemainingDistanceKm(0.0);
        setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
      }
      if (
        (step === 3 ||
          activeRequest.status === 'partner_arrived' ||
          activeRequest.status === 'arrived') &&
        step < 4
      ) {
        setShowOtpModal(true);
      }
      if (step >= 4) {
        setShowOtpModal(false);
      }
      if (
        (step === 5 ||
          activeRequest.status === 'service_completed' ||
          activeRequest.status === 'completed') &&
        !paymentConfirmed
      ) {
        setShowPaymentModal(true);
      }
      if (
        step >= 6 ||
        activeRequest.status === 'paid' ||
        activeRequest.status === 'payment_completed'
      ) {
        setPaymentConfirmed(true);
        setShowPaymentModal(false);
      }
    }

    const pLat = Number(activeRequest?.partner?.latitude || activeRequest?.partner_lat) || customerLat;
    const pLng = Number(activeRequest?.partner?.longitude || activeRequest?.partner_lon) || customerLng;
    const dist = calculateHaversineKm(pLat, pLng, customerLat, customerLng);

    if (activeRequest?.route_distance_km != null) {
      setTotalDistanceKm(Number(activeRequest.route_distance_km));
    } else {
      setTotalDistanceKm(dist);
    }
    if (activeRequest?.remaining_distance_km != null) {
      setRemainingDistanceKm(Number(activeRequest.remaining_distance_km));
    } else if (step >= 3) {
      setRemainingDistanceKm(0.0);
    } else {
      setRemainingDistanceKm(dist);
    }
    if (activeRequest?.eta_minutes != null) {
      setEtaMinutes(Number(activeRequest.eta_minutes));
    } else if (step >= 3) {
      setEtaMinutes(0);
    } else {
      setEtaMinutes(Math.ceil((dist / (Number(activeRequest?.speed_kmh) || 30)) * 60));
    }
    if (activeRequest?.current_position?.latitude && activeRequest?.current_position?.longitude) {
      setCurrentPartnerPos({
        lat: Number(activeRequest.current_position.latitude),
        lng: Number(activeRequest.current_position.longitude),
      });
    } else if (step <= 1 && routeGeometry && routeGeometry.length > 0) {
      setCurrentPartnerPos({
        lat: Number(routeGeometry[0].lat),
        lng: Number(routeGeometry[0].lng),
      });
    } else if (step < 3 && pLat && pLng) {
      setCurrentPartnerPos({ lat: pLat, lng: pLng });
    }

    if (activeRequest?.status === 'cancelled') {
      setIsCancelled(true);
      setCancelledReasonText(activeRequest.cancel_reason || 'Cancelled by customer');
    }
  }, [
    activeRequest?.step_index,
    activeRequest?.status,
    activeRequest?.cancel_reason,
    activeRequest?.route_distance_km,
    activeRequest?.remaining_distance_km,
    activeRequest?.eta_minutes,
    activeRequest?.current_position,
    activeRequest?.partner,
    activeRequest?.partner_lat,
    activeRequest?.partner_lon,
    customerLat,
    customerLng,
  ]);

  // Load Google Maps JavaScript API
  useEffect(() => {
    let isMounted = true;

    if (!browserApiKey || !browserApiKey.trim()) {
      setMapLoadError(true);
      return;
    }

    loadGoogleMaps(browserApiKey)
      .then((maps) => {
        if (!isMounted) return;
        setGoogleMapsReady(true);
        setMapLoadError(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[Google Maps Load Warning]:', err.message);
        setMapLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [browserApiKey]);

  // Initialize and update Google Map instance
  useEffect(() => {
    if (!googleMapsReady || !mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    const google = window.google;

    // Create Map if not already initialized
    if (!mapInstanceRef.current) {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: customerLat, lng: customerLng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        // Monochromatic clean style matching DESIGN.md
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        ],
      });
      mapInstanceRef.current = map;

      // Customer marker: ink circle per docs/DESIGN.md
      customerMarkerRef.current = new google.maps.Marker({
        position: { lat: customerLat, lng: customerLng },
        map,
        title: 'Your Location (Customer)',
        zIndex: 10,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#111418',
          fillOpacity: 1.0,
          strokeColor: '#FBFAF6',
          strokeWeight: 2,
        },
      });

      // Partner marker: square signal-coloured per docs/DESIGN.md
      partnerMarkerRef.current = new google.maps.Marker({
        position: currentPartnerPos,
        map,
        title: 'Partner Location',
        zIndex: 20,
        icon: {
          path: 'M -9 -9 L 9 -9 L 9 9 L -9 9 Z',
          fillColor: '#FF5B14',
          fillOpacity: 1.0,
          strokeColor: '#111418',
          strokeWeight: 2,
          scale: 1,
        },
      });

      // Polylines: travelled (signal #FF5B14) and untravelled (ink #111418)
      untravelledPolylineRef.current = new google.maps.Polyline({
        path: routeGeometry,
        geodesic: true,
        strokeColor: '#111418',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      });

      travelledPolylineRef.current = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#FF5B14',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        map,
      });
    }

    // Update customer marker position if changed
    if (customerMarkerRef.current && customerLat && customerLng) {
      customerMarkerRef.current.setPosition({ lat: customerLat, lng: customerLng });
    }

    // Update partner marker position if changed
    if (partnerMarkerRef.current && currentPartnerPos?.lat && currentPartnerPos?.lng) {
      partnerMarkerRef.current.setPosition(currentPartnerPos);
    }

    // Update untravelled polyline path if route geometry changed
    if (untravelledPolylineRef.current) {
      untravelledPolylineRef.current.setPath(routeGeometry);
    }

    // Fit bounds to full route or both customer and partner coordinates
    if (mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;
      if (routeGeometry.length > 0) {
        routeGeometry.forEach((pt) => {
          bounds.extend(pt);
          hasPoints = true;
        });
      } else {
        if (customerLat && customerLng) {
          bounds.extend({ lat: customerLat, lng: customerLng });
          hasPoints = true;
        }
        if (currentPartnerPos?.lat && currentPartnerPos?.lng) {
          bounds.extend(currentPartnerPos);
          hasPoints = true;
        }
      }
      if (hasPoints) {
        mapInstanceRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      } else if (customerLat && customerLng) {
        mapInstanceRef.current.setCenter({ lat: customerLat, lng: customerLng });
      }
    }
  }, [googleMapsReady, routeGeometry, customerLat, customerLng, currentPartnerPos]);

  // Update Partner Marker Position & Polyline Segments on Movement
  useEffect(() => {
    if (!mapInstanceRef.current || !partnerMarkerRef.current || !window.google) return;

    partnerMarkerRef.current.setPosition(currentPartnerPos);

    if (routeGeometry.length >= 2 && travelledPolylineRef.current && untravelledPolylineRef.current) {
      if (currentStep >= 3) {
        // Full route travelled
        travelledPolylineRef.current.setPath(routeGeometry);
        untravelledPolylineRef.current.setPath([]);
      } else {
        const splitIndex = Math.min(
          routeGeometry.length - 1,
          Math.max(1, Math.floor(partnerProgress * routeGeometry.length))
        );
        const travelled = routeGeometry.slice(0, splitIndex);
        travelled.push(currentPartnerPos);

        const untravelled = [currentPartnerPos, ...routeGeometry.slice(splitIndex)];

        travelledPolylineRef.current.setPath(travelled);
        untravelledPolylineRef.current.setPath(untravelled);
      }
    }
  }, [currentPartnerPos, partnerProgress, currentStep, routeGeometry]);

  // Real-time Socket.IO listener: updates tracking status, movement, arrival, and OTP
  useEffect(() => {
    if (!activeRequest?.id) return;

    socketService.joinRequest(activeRequest.id);
    if (activeRequest.customer_id) {
      socketService.registerCustomer(activeRequest.customer_id);
    }

    const handleOtpPrompt = (data) => {
      if (
        !data ||
        !data.requestId ||
        String(data.requestId) === String(activeRequest.id)
      ) {
        if (data?.service_otp) {
          setCurrentOtp(data.service_otp);
        }
        setCurrentStep(3);
        setShowOtpModal(true);
      }
    };

    const handlePartnerArrived = (data) => {
      if (
        data &&
        (String(data.requestId) === String(activeRequest.id) ||
          String(data.id) === String(activeRequest.id))
      ) {
        if (data?.service_otp) {
          setCurrentOtp(data.service_otp);
        }
        setCurrentStep(3);
        setPartnerProgress(1.0);
        setRemainingDistanceKm(0.0);
        setEtaMinutes(0);
        setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
        setShowOtpModal(true);
      }
    };

    const handleStatusUpdate = (data) => {
      if (
        data &&
        (String(data.requestId) === String(activeRequest.id) ||
          String(data.id) === String(activeRequest.id))
      ) {
        if (data.service_otp) {
          setCurrentOtp(data.service_otp);
        }
        if (data.step_index != null) {
          const step = data.step_index;
          setCurrentStep(step);

          // If partner arrived (step 3), snap to destination & open OTP modal
          if (
            step === 3 ||
            data.status === 'arrived' ||
            data.status === 'partner_arrived'
          ) {
            setPartnerProgress(1.0);
            setRemainingDistanceKm(0.0);
            setEtaMinutes(0);
            setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
            setShowOtpModal(true);
          }
          // If service started (step 4+), automatically close OTP modal as it is verified!
          if (
            step >= 4 ||
            data.status === 'service_started' ||
            data.status === 'in_progress'
          ) {
            setPartnerProgress(1.0);
            setRemainingDistanceKm(0.0);
            setEtaMinutes(0);
            setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
            setShowOtpModal(false);
          }
          // If service completed (step 5), automatically show payment & settlement options!
          if (
            step === 5 ||
            data.status === 'service_completed' ||
            data.status === 'completed'
          ) {
            setPartnerProgress(1.0);
            setRemainingDistanceKm(0.0);
            setEtaMinutes(0);
            setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
            setShowOtpModal(false);
            setShowPaymentModal(true);
          }
          // If payment completed (step 6), confirm payment on customer screen!
          if (
            step >= 6 ||
            data.status === 'paid' ||
            data.status === 'payment_completed'
          ) {
            setPaymentConfirmed(true);
            setShowPaymentModal(false);
          }
        }
      }
    };

    // Live movement position updates from server (pure function of elapsed time)
    const handleLocationUpdate = (data) => {
      if (
        data &&
        (String(data.requestId) === String(activeRequest.id) ||
          String(data.id) === String(activeRequest.id))
      ) {
        if (typeof data.progress === 'number') {
          setPartnerProgress(Math.min(1.0, Math.max(0, data.progress)));
        }
        if (typeof data.remaining_distance_km === 'number') {
          setRemainingDistanceKm(data.remaining_distance_km);
        }
        if (typeof data.eta_minutes === 'number') {
          setEtaMinutes(data.eta_minutes);
        }
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setCurrentPartnerPos({
            lat: data.latitude,
            lng: data.longitude,
          });
        }
      }
    };

    // Immediate cancellation notification
    const handleCancel = (data) => {
      if (
        data &&
        (String(data.requestId) === String(activeRequest.id) ||
          String(data.id) === String(activeRequest.id))
      ) {
        setIsCancelled(true);
        setCancelledReasonText(data.reason || 'Cancelled by customer');
      }
    };

    const handleLocalCustomStatus = (e) => {
      if (e?.detail) {
        handleStatusUpdate(e.detail);
      }
    };
    const handleStorageEvent = (e) => {
      if (e.key === 'fixit_active_request' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleStatusUpdate(parsed);
        } catch {}
      }
    };

    window.addEventListener('fixit_request_status_updated', handleLocalCustomStatus);
    window.addEventListener('storage', handleStorageEvent);

    try {
      if (typeof socketService.on === 'function') {
        socketService.on('request_status_updated', handleStatusUpdate);
        socketService.on('partner_location', handleLocationUpdate);
        socketService.on('partner_location_update', handleLocationUpdate);
        socketService.on('partner_arrived', handlePartnerArrived);
        socketService.on('otp_prompt_customer', handleOtpPrompt);
        socketService.on('request_cancelled', handleCancel);
      }
    } catch (err) {
      console.warn('[LiveTrackingView] socket subscription warning:', err);
    }

    return () => {
      window.removeEventListener('fixit_request_status_updated', handleLocalCustomStatus);
      window.removeEventListener('storage', handleStorageEvent);
      try {
        if (typeof socketService.off === 'function') {
          socketService.off('request_status_updated', handleStatusUpdate);
          socketService.off('partner_location', handleLocationUpdate);
          socketService.off('partner_location_update', handleLocationUpdate);
          socketService.off('partner_arrived', handlePartnerArrived);
          socketService.off('otp_prompt_customer', handleOtpPrompt);
          socketService.off('request_cancelled', handleCancel);
        }
      } catch {
        // ignore cleanup warning
      }
    };
  }, [activeRequest?.id, activeRequest?.customer_id, customerLat, customerLng]);

  // Steps definition matching SRS FR-C14
  const steps = [
    { id: 1, title: 'Request accepted', detail: 'Nearest partner confirmed job ticket.' },
    { id: 2, title: 'Partner on the way', detail: 'Travelling towards your street address.' },
    { id: 3, title: 'Partner arrived', detail: 'Partner is at your door. Verify service OTP.' },
    { id: 4, title: 'Service started', detail: 'Work order executed. Tools in action.' },
    { id: 5, title: 'Service completed', detail: 'Repair inspection complete and tested.' },
    { id: 6, title: 'Payment completed', detail: 'Settled directly with partner. Confirmed.' },
  ];

  // SVG Fallback waypoints
  const waypoints = [
    { x: 100, y: 70 },
    { x: 220, y: 70 },
    { x: 220, y: 150 },
    { x: 380, y: 150 },
    { x: 380, y: 220 },
    { x: 490, y: 220 },
  ];

  const getPartnerSvgCoords = (progress) => {
    const validProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0;
    const totalSegments = waypoints.length - 1;
    const scaled = Math.max(0, Math.min(1, validProgress)) * totalSegments;
    const segIndex = Math.min(Math.floor(scaled), totalSegments - 1);
    const segT = scaled - segIndex;

    const p1 = waypoints[segIndex] || waypoints[0];
    const p2 = waypoints[segIndex + 1] || waypoints[waypoints.length - 1];

    return {
      x: p1.x + (p2.x - p1.x) * segT,
      y: p1.y + (p2.y - p1.y) * segT,
    };
  };

  const partnerSvgPos = getPartnerSvgCoords(partnerProgress);

  const handleCancelSubmit = async () => {
    setShowCancelModal(false);
    setIsCancelled(true);
    setCancelledReasonText(cancelReason);
    if (activeRequest && activeRequest.id) {
      await cancelServiceRequest(activeRequest.id, cancelReason);
    }
  };

  const rawPartner = activeRequest?.partner || {};
  const partner = {
    name: rawPartner.name || activeRequest?.partner_name || 'Rajesh Kumar',
    phone: rawPartner.phone || activeRequest?.partner_phone || '+91 98450 11223',
    rating:
      rawPartner.rating != null
        ? rawPartner.rating
        : activeRequest?.partner_rating != null
        ? activeRequest.partner_rating
        : null,
    service_name: rawPartner.service_name || activeRequest?.service_name || 'Plumbing Repairs',
    badge: rawPartner.badge || activeRequest?.partner_badge || 'Certified Master Plumber',
  };
  const partnerInitial =
    partner.name && typeof partner.name === 'string' ? partner.name.charAt(0) : 'P';

  if (!activeRequest && !isCancelled) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-8 sm:p-12 text-center shadow-hard space-y-4">
          <div className="w-12 h-12 bg-concrete border-2 border-[var(--theme-border)] mx-auto flex items-center justify-center font-bold text-xl text-signal">
            !
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--theme-text-main)]">
            No Active Service Request
          </h2>
          <p className="font-mono text-xs sm:text-sm text-[var(--theme-text-soft)] max-w-md mx-auto">
            You do not currently have any service requests in transit. When you book a trade partner, you can track their real-time arrival here.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="btn-primary min-h-[44px] px-6 text-xs font-mono font-bold uppercase tracking-wider shadow-hard"
            >
              Book a Service →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display distance: real remaining distance formatted to 1 decimal place
  const displayDistance =
    currentStep >= 3
      ? '0.0'
      : remainingDistanceKm != null
      ? Number(remainingDistanceKm).toFixed(1)
      : totalDistanceKm != null
      ? Number(totalDistanceKm).toFixed(1)
      : '0.0';

  // Display ETA: real ETA in minutes
  const displayEta = currentStep >= 3 ? 0 : etaMinutes != null ? etaMinutes : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ============================================================== */}
      {/* CANCELLATION NOTICE & GO TO DASHBOARD BUTTON (SRS FR-C19)       */}
      {/* ============================================================== */}
      {isCancelled && (
        <div className="bg-paper border-2 border-ink p-6 sm:p-8 shadow-hard text-ink space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <span className="stamp-badge bg-signal text-ink border-ink font-bold text-xs">
              ! WORK ORDER CANCELLED
            </span>
            <span className="font-mono text-xs text-soft font-bold uppercase">
              STATUS: CANCELLED
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink">
              Request Cancelled
            </h2>
            <p className="text-sm sm:text-base text-soft font-sans">
              Your service request ({activeRequest?.order_number || 'Work Order'}) has been cancelled.
              {cancelledReasonText ? ` Reason: "${cancelledReasonText}". ` : ' '}
              The partner has been notified instantly and released for new dispatches.
            </p>
          </div>

          <div className="p-3.5 bg-concrete border-2 border-ink font-mono text-xs space-y-1">
            <div>• ORDER NUMBER: <span className="font-bold text-ink">{activeRequest?.order_number || 'ORD-0428'}</span></div>
            <div>• SERVICE: <span className="font-bold text-ink">{activeRequest?.service_name || 'Home Service'}</span></div>
            <div>• RECORD: Archived in your permanent customer history.</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onCancel) onCancel();
                onNavigate('dashboard');
              }}
              className="btn-primary min-h-[48px] px-8 text-sm font-mono font-bold uppercase tracking-wider shadow-hard"
            >
              Go to dashboard →
            </button>
            <button
              type="button"
              onClick={() => {
                if (onCancel) onCancel();
                onNavigate('history');
              }}
              className="btn-secondary min-h-[48px] px-6 text-xs font-mono font-bold uppercase tracking-wider"
            >
              View in history
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RESPONSIVE LAYOUT (Requirement E):                              */}
      {/* >= 768px: side-by-side (tracking panel left, map right sticky)  */}
      {/* < 768px: stacked with map first                                */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: TRACKING PANEL (order-2 on mobile, order-1 on md)*/}
        {/* Steps, Partner Card, OTP Area, Settlement Actions            */}
        {/* ============================================================ */}
        <div className="w-full md:flex-1 space-y-6 order-2 md:order-1">
          {/* ============================================================ */}
          {/* 2. PROMINENT 6-DIGIT SERVICE OTP (SRS FR-C16)                 */}
          {/* ============================================================ */}
          {currentStep < 4 ? (
            <div className="p-5 sm:p-6 bg-paper border-2 border-signal shadow-hard space-y-2 text-ink">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                <span className="font-mono text-xs text-signal font-bold uppercase tracking-wider">
                  YOUR 6-DIGIT SERVICE VERIFICATION OTP
                </span>
                <span className="stamp-badge bg-signal text-ink border-ink text-[11px]">
                  SHARE UPON ARRIVAL
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="font-mono text-4xl sm:text-5xl font-black text-ink tracking-[0.25em]">
                  {currentOtp || activeRequest?.service_otp || '------'}
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <p className="font-mono text-xs text-soft max-w-sm">
                    When the fixer arrives at your door, share this 6-digit code. They will verify it on their screen to authenticate and commence repair work.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="btn-primary min-h-[38px] px-4 text-xs font-mono font-bold uppercase tracking-wider self-start sm:self-auto"
                  >
                    POP UP OTP SCREEN ↗
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-concrete border-2 border-done flex flex-wrap items-center justify-between gap-2 text-ink">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 bg-done rounded-full flex items-center justify-center text-paper font-bold text-[10px]">
                  ✓
                </span>
                <span className="font-mono text-xs text-done font-bold uppercase tracking-wider">
                  SERVICE OTP VERIFIED ({currentOtp || activeRequest?.service_otp})
                </span>
              </div>
              <span className="font-mono text-xs text-soft uppercase">
                WORK ORDER IN PROGRESS · CANCEL LOCKED
              </span>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2.5 PROCEED TO PAYMENT & SETTLEMENT ACTION (SRS FR-C18)       */}
          {/* ============================================================ */}
          {currentStep === 5 && !paymentConfirmed && (
            <div className="p-5 sm:p-6 bg-paper border-2 border-signal shadow-hard space-y-4 text-ink">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                <span className="font-mono text-xs text-signal font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-signal animate-ping inline-block" />
                  SERVICE COMPLETED · PAYMENT &amp; SETTLEMENT OPTIONS
                </span>
                <span className="stamp-badge bg-signal text-ink border-ink text-[11px]">
                  STEP 5 OF 6
                </span>
              </div>
              <div className="pt-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-ink">
                      Work Finished by {partner.name || 'Partner'}
                    </h3>
                    <p className="font-mono text-xs text-soft mt-1 max-w-lg">
                      The partner has completed the service. FixIt Now operates on direct on-site settlement with zero platform commissions. Select your settlement option below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="btn-primary min-h-[44px] px-6 text-xs uppercase font-mono font-bold tracking-wider shadow-hard shrink-0 cursor-pointer"
                  >
                    POP UP SETTLEMENT MODAL ↗
                  </button>
                </div>

                {/* Inline Payment & Settlement Options Card */}
                <div className="p-4 bg-concrete border-2 border-ink space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-ink">
                      Select Settlement Option:
                    </span>
                    <span className="font-mono text-[11px] text-signal font-bold uppercase">
                      Direct On-Site
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3.5 border-2 font-mono text-xs font-bold uppercase flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'bg-signal text-ink border-ink shadow-hard-sm'
                          : 'bg-paper text-ink border-ink/40 hover:border-ink'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none shrink-0" strokeWidth="2" aria-hidden="true">
                        <rect x="2" y="6" width="20" height="12" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M6 12h.01M18 12h.01" />
                      </svg>
                      <div className="text-left">
                        <div className="font-bold">Cash on Delivery</div>
                        <div className="text-[10px] font-normal lowercase text-soft">Pay cash directly to fixer</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3.5 border-2 font-mono text-xs font-bold uppercase flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'bg-signal text-ink border-ink shadow-hard-sm'
                          : 'bg-paper text-ink border-ink/40 hover:border-ink'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none shrink-0" strokeWidth="2" aria-hidden="true">
                        <rect x="5" y="2" width="14" height="20" />
                        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                      </svg>
                      <div className="text-left">
                        <div className="font-bold">UPI / QR Code</div>
                        <div className="text-[10px] font-normal lowercase text-soft">Scan partner UPI QR code</div>
                      </div>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-ink/20">
                    <span className="font-mono text-xs text-soft">
                      Selected: <strong className="text-ink uppercase">{paymentMethod === 'cash' ? 'Cash on Delivery' : 'Direct UPI / QR Code'}</strong>
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleConfirmPayment}
                        className="btn-primary min-h-[42px] px-6 text-xs uppercase font-mono font-bold tracking-wider shadow-hard w-full sm:w-auto cursor-pointer"
                      >
                        CONFIRM SETTLEMENT COMPLETED ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('rate-receipt')}
                        className="btn-secondary min-h-[42px] px-4 text-xs uppercase font-mono font-bold tracking-wider shadow-hard w-full sm:w-auto cursor-pointer"
                      >
                        RATE &amp; RECEIPT →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2.6 PAYMENT CONFIRMATION BANNER                               */}
          {/* ============================================================ */}
          {(currentStep >= 6 || paymentConfirmed) && (
            <div className="p-5 sm:p-6 bg-paper border-2 border-done shadow-hard space-y-3 text-ink">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                <span className="font-mono text-xs text-done font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-done inline-block" />
                  PAYMENT CONFIRMATION
                </span>
                <span className="stamp-badge bg-done text-paper border-done text-[11px]">
                  ✓ STEP 6 COMPLETE
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-done text-paper font-bold text-xs flex items-center justify-center rounded-full">✓</span>
                    <h3 className="font-display font-extrabold text-xl text-ink">
                      Payment Confirmed
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-soft mt-1 max-w-lg">
                    Your direct payment with {partner.name || 'Partner'} has been confirmed. Work order is successfully closed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('rate-receipt')}
                  className="btn-primary min-h-[46px] px-6 text-xs uppercase font-mono font-bold tracking-wider shadow-hard shrink-0"
                >
                  RATE PARTNER &amp; VIEW RECEIPT →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. CUSTOMER COPY WORK-ORDER TICKET (DESIGN.md Section 6)      */}
          {/* ============================================================ */}
          <div className="bg-paper border-2 border-ink p-6 sm:p-8 shadow-hard text-ink space-y-6">
            {/* Ticket Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-4">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 bg-paper border-2 border-ink inline-block" />
                <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-ink">
                  CUSTOMER COPY · No. {String(activeRequest?.order_number || '0427').replace('ORD-', '')}
                </span>
              </div>

              <span className="stamp-badge bg-concrete text-ink border-ink text-[10px]">
                DIRECT ON-SITE SETTLEMENT
              </span>
            </div>

            {/* Partner Details Card */}
            <div className="p-4 bg-concrete border-2 border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-signal border-2 border-ink flex items-center justify-center shrink-0 font-display font-black text-xl text-ink">
                  {partnerInitial}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-xl text-ink">{partner.name || 'Partner'}</span>
                    <span className="stamp-badge bg-paper text-ink border-ink text-[10px] py-0 px-1.5">
                      KYC VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-soft font-mono mt-0.5">
                    {partner.badge || partner.service_name || 'Certified Fixer'} · {formatRatingWithStar(partner.rating)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <a
                  href={partner.phone ? `tel:${partner.phone}` : '#'}
                  className="btn-secondary py-1.5 px-3 text-xs min-h-[38px] flex items-center gap-2 bg-paper"
                >
                  <span>CALL FIXER</span>
                  <span className="font-bold">{partner.phone || '+91 98450 11223'}</span>
                </a>
              </div>
            </div>

            {/* Dashed Tear Line */}
            <div className="tear-line my-4" />

            {/* ========================================================== */}
            {/* THE SIX STATUS STEP TICKS (SRS FR-C14 & DESIGN.md Section 6)*/}
            {/* ========================================================== */}
            <div className="space-y-4" aria-live="polite">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-soft block">
                LIVE JOB PROGRESSION (6 STEPS)
              </span>

              <div className="space-y-3">
                {steps.map((st) => {
                  const isCompleted = currentStep >= st.id;
                  const isCurrent = currentStep === st.id;

                  return (
                    <div
                      key={st.id}
                      className={`flex items-start gap-4 p-3 border-2 transition-all ${
                        isCurrent
                          ? 'bg-paper border-ink shadow-hard-sm'
                          : isCompleted
                          ? 'bg-concrete/60 border-ink/40'
                          : 'bg-transparent border-dashed border-ink/30 opacity-60'
                      }`}
                    >
                      {/* 22px circle tick mark with stamp-in animation */}
                      <div className="shrink-0 mt-0.5">
                        {isCompleted ? (
                          <span
                            key={`tick-${st.id}-${isCompleted}`}
                            className="w-[22px] h-[22px] rounded-full bg-done flex items-center justify-center animate-stamp-in shadow-sm"
                          >
                            <svg viewBox="0 0 16 16" className="w-3 h-3 fill-paper" aria-hidden="true">
                              <polygon points="14,3 6,11 2,7 0,9 6,15 16,5" />
                            </svg>
                          </span>
                        ) : (
                          <span
                            key={`untick-${st.id}`}
                            className="w-[22px] h-[22px] rounded-full border-2 border-muted flex items-center justify-center bg-transparent"
                          />
                        )}
                      </div>

                      {/* Step Title & Detail */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-display font-extrabold text-base sm:text-lg leading-tight ${
                              isCompleted ? 'text-ink' : 'text-muted'
                            }`}
                          >
                            {st.title}
                          </span>
                          {isCurrent && (
                            <span className="font-mono text-[10px] font-bold uppercase bg-signal text-ink px-1.5 py-0.2 shrink-0">
                              NOW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-soft font-mono mt-0.5">{st.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket Bottom Actions */}
            <div className="pt-4 border-t-2 border-dashed border-ink flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Cancel button (allowed before service starts, per FR-C19) */}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-mono font-bold uppercase underline text-soft hover:text-signal"
                >
                  ✕ Cancel Request
                </button>
              ) : (
                <span className="font-mono text-xs text-muted uppercase">
                  JOB IN PROGRESS · CANCEL LOCKED
                </span>
              )}

              {/* Action to proceed when work is complete */}
              {currentStep === 5 && !paymentConfirmed ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-primary min-h-[44px] w-full sm:w-auto px-6 font-mono text-xs font-bold uppercase tracking-wider"
                >
                  PROCEED TO PAYMENT →
                </button>
              ) : currentStep >= 6 || paymentConfirmed ? (
                <button
                  type="button"
                  onClick={() => onNavigate('rate-receipt')}
                  className="btn-primary min-h-[44px] w-full sm:w-auto px-6 font-mono text-xs font-bold uppercase tracking-wider"
                >
                  RATE PARTNER &amp; VIEW DIGITAL RECEIPT →
                </button>
              ) : (
                <span className="font-mono text-xs font-bold text-soft uppercase">
                  WAITING FOR PARTNER STATUS UPDATES...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: MAP & TELEMETRY                                */}
        {/* Sticky on md+, sits first (order-1) on mobile                */}
        {/* ============================================================ */}
        <div className="w-full md:w-[460px] lg:w-[500px] shrink-0 order-1 md:order-2 md:sticky md:top-6">
          <RouteTrackingMap
            partnerPos={currentPartnerPos}
            customerPos={{ lat: customerLat, lng: customerLng }}
            routeGeometry={routeGeometry}
            distanceKm={displayDistance}
            etaMinutes={displayEta}
            stepIndex={currentStep}
            dispatchZoneLabel={dispatchZoneLabel}
            progress={partnerProgress}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* CANCELLATION MODAL (SRS FR-C19)                                */}
      {/* ============================================================== */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-paper border-2 border-ink p-6 max-w-md w-full shadow-hard text-ink space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <span className="font-mono text-xs font-bold uppercase text-signal">
                CANCEL WORK ORDER
              </span>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-soft">
              Are you sure you want to cancel this booking? The nearest partner has already been
              dispatched.
            </p>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase">
                Select Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-sm"
              >
                <option value="Found another solution">Found another solution</option>
                <option value="Partner taking too long">Partner taking too long to arrive</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Issue resolved itself">Issue resolved itself</option>
                <option value="Other emergency">Other emergency</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelSubmit}
                className="btn-primary flex-1 min-h-[44px]"
              >
                Confirm Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary flex-1 min-h-[44px]"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SERVICE VERIFICATION OTP POPUP MODAL (SRS FR-C16)           */}
      {/* Pops up automatically when partner arrives or reloads at step 3 */}
      {/* ============================================================== */}
      {showOtpModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-paper border-2 border-ink p-6 sm:p-8 max-w-lg w-full shadow-hard text-ink space-y-6 relative">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-signal inline-block border-2 border-ink" />
                <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">
                  DOORSTEP VERIFICATION · FIXIT NOW
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="font-bold text-lg hover:text-signal transition-colors p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="stamp-badge bg-signal text-ink border-ink text-xs inline-block">
                PARTNER ARRIVED · ACTION REQUIRED
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink">
                Share this OTP with {partner.name || 'Partner'}
              </h2>
              <p className="text-sm text-soft font-sans max-w-md mx-auto">
                Your partner has arrived at your doorstep to begin service. Please provide this 6-digit verification code to start the repair work.
              </p>
            </div>

            {/* Giant Monospace 6-Digit OTP Box */}
            <div className="bg-ink text-signal border-2 border-ink p-6 shadow-hard-signal text-center space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-on-dark block">
                6-DIGIT VERIFICATION CODE
              </span>
              <div className="font-mono text-4xl sm:text-6xl font-black tracking-[0.25em] sm:tracking-[0.35em] text-signal select-all py-1">
                {currentOtp || activeRequest?.service_otp || '------'}
              </div>
              <span className="font-mono text-[11px] text-on-dark block">
                The partner enters this code on their terminal to verify and start work
              </span>
            </div>

            <div className="p-3.5 bg-concrete border-2 border-ink text-xs text-soft font-mono space-y-1">
              <div>• ORDER REF: <span className="font-bold text-ink">{activeRequest?.order_number || 'ORD-0428'}</span></div>
              <div>• PARTNER: <span className="font-bold text-ink">{partner.name || 'Partner'}</span></div>
              <div>• DIRECT PAYMENT: Cash or UPI settled directly between you and partner after work is complete.</div>
            </div>

            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="btn-primary w-full min-h-[48px] uppercase font-mono tracking-wider text-sm font-bold shadow-hard"
            >
              I have shared the code with partner →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. PROCEED TO PAYMENT MODAL (SRS FR-C18)                       */}
      {/* ============================================================== */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-paper border-2 border-ink p-6 sm:p-8 max-w-lg w-full shadow-hard text-ink space-y-6 relative">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-signal inline-block border-2 border-ink" />
                <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">
                  DIRECT ON-SITE PAYMENT · FIXIT NOW
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="font-bold text-lg hover:text-signal transition-colors p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="stamp-badge bg-signal text-ink border-ink text-xs inline-block">
                STEP 5: SERVICE COMPLETED
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink">
                Settle with {partner.name || 'Partner'}
              </h2>
              <p className="text-sm text-soft font-sans max-w-md mx-auto">
                Payment is settled directly between you and your service partner. FixIt Now does not deduct commission or hold your funds.
              </p>
            </div>

            {/* Work order summary */}
            <div className="p-4 bg-concrete border-2 border-ink font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted uppercase">WORK ORDER:</span>
                <span className="font-bold text-ink">{activeRequest?.order_number || 'ORD-0428'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted uppercase">SERVICE:</span>
                <span className="font-bold text-ink">{activeRequest?.service_name || 'Home Repair'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted uppercase">FIXER:</span>
                <span className="font-bold text-ink">{partner.name || 'Partner'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-ink/20 pt-2">
                <span className="text-muted uppercase">SETTLEMENT:</span>
                <span className="font-bold text-signal uppercase">Direct On-Site Settle</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="font-mono text-xs font-bold uppercase text-ink block">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3.5 border-2 font-mono text-xs font-bold uppercase flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-signal text-ink border-ink shadow-hard-sm'
                      : 'bg-paper text-ink border-ink/40 hover:border-ink'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="6" width="20" height="12" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                  <span>Cash on Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3.5 border-2 font-mono text-xs font-bold uppercase flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'upi'
                      ? 'bg-signal text-ink border-ink shadow-hard-sm'
                      : 'bg-paper text-ink border-ink/40 hover:border-ink'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2" aria-hidden="true">
                    <rect x="5" y="2" width="14" height="20" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                  </svg>
                  <span>UPI / QR Code</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              className="btn-primary w-full min-h-[50px] uppercase font-mono tracking-wider text-sm font-bold shadow-hard cursor-pointer"
            >
              Confirm Payment Completed ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
