/**
 * FixIt Now - Partner Active Job Screen
 * Single next-action button sequence:
 * Start trip → Arrived at customer location → Enter service OTP & Start service → Complete service → Payment received & Close.
 * Conforms to docs/DESIGN.md line 90 and SRS FR-P9, FR-P10, FR-P12.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  advanceJobStep,
  simulateCustomerCancel,
  getActivePartner,
} from '../../services/partnerService';
import socketService, { requestOtpPrompt } from '../../services/socketService';

export default function ActiveJobView({
  activeJob,
  onJobUpdated,
  onJobClosed,
  onNavigateToDashboard,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('showOtp=1')
  );
  const [otpInput, setOtpInput] = useState('');
  const [settlementReceipt, setSettlementReceipt] = useState(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [cancellationAlert, setCancellationAlert] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoBlobUrl, setPhotoBlobUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const rawStatus = activeJob?.status || 'accepted';
  const [waitingForReview, setWaitingForReview] = useState(
    () => rawStatus === 'payment_completed' || rawStatus === 'paid' || Boolean(activeJob?.waiting_for_review)
  );
  const [receivedReview, setReceivedReview] = useState(() => activeJob?.review || null);

  useEffect(() => {
    if (rawStatus === 'payment_completed' || rawStatus === 'paid' || activeJob?.waiting_for_review) {
      setWaitingForReview(true);
    }
    if (activeJob?.review) {
      setReceivedReview(activeJob.review);
    }
  }, [rawStatus, activeJob?.waiting_for_review, activeJob?.review]);

  const handleFinishJob = () => {
    if (onJobClosed) {
      onJobClosed(settlementReceipt);
    } else if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };


  const currentStatus =
    rawStatus === 'partner_on_way'
      ? 'on_the_way'
      : rawStatus === 'partner_arrived'
      ? 'arrived'
      : rawStatus === 'service_started'
      ? 'in_progress'
      : rawStatus === 'service_completed'
      ? 'completed'
      : rawStatus === 'payment_completed'
      ? 'paid'
      : rawStatus;

  // Progression steps ladder
  const statusLadder = [
    { key: 'accepted', label: 'Accepted', num: '1' },
    { key: 'on_the_way', label: 'En Route', num: '2' },
    { key: 'arrived', label: 'Arrived', num: '3' },
    { key: 'in_progress', label: 'Working', num: '4' },
    { key: 'completed', label: 'Done', num: '5' },
  ];

  const currentStepIndex =
    currentStatus === 'accepted'
      ? 1
      : currentStatus === 'on_the_way'
      ? 2
      : currentStatus === 'arrived'
      ? 3
      : currentStatus === 'in_progress'
      ? 4
      : 5;

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

  // Geographic coordinates for tracking map (shared with customer view)
  const currentPartner = useMemo(() => getActivePartner(), []);
  const customerReq = useMemo(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('fixit_active_request') : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const customerLat = Number(
    activeJob?.latitude ??
      activeJob?.customer_lat ??
      activeJob?.coordinates?.lat ??
      customerReq?.latitude ??
      customerReq?.customer_lat ??
      customerReq?.coordinates?.lat ??
      12.9716
  );
  const customerLng = Number(
    activeJob?.longitude ??
      activeJob?.customer_lon ??
      activeJob?.coordinates?.lng ??
      customerReq?.longitude ??
      customerReq?.customer_lon ??
      customerReq?.coordinates?.lng ??
      77.5946
  );
  const partnerLat = Number(
    activeJob?.partner?.latitude ??
      activeJob?.partner_lat ??
      customerReq?.partner?.latitude ??
      customerReq?.partner_lat ??
      currentPartner?.latitude ??
      customerLat
  );
  const partnerLng = Number(
    activeJob?.partner?.longitude ??
      activeJob?.partner_lon ??
      customerReq?.partner?.longitude ??
      customerReq?.partner_lon ??
      currentPartner?.longitude ??
      customerLng
  );

  const routeGeometry = useMemo(() => {
    let geom = activeJob?.route_geometry || customerReq?.route_geometry;
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
    return [
      { lat: partnerLat, lng: partnerLng },
      { lat: customerLat, lng: customerLng },
    ];
  }, [activeJob?.route_geometry, customerReq?.route_geometry, partnerLat, partnerLng, customerLat, customerLng]);

  const matchingRadius = activeJob?.matching_radius_km ?? customerReq?.matching_radius_km ?? 2;
  const radiusText = `${matchingRadius} KM`;
  const derivedArea = extractDispatchArea(activeJob?.address || customerReq?.address);
  const dispatchZoneLabel = derivedArea
    ? `DISPATCH ZONE: ${derivedArea.toUpperCase()} (${radiusText})`
    : `${radiusText} RADIUS`;

  const [currentPartnerPos, setCurrentPartnerPos] = useState({
    lat: currentStepIndex >= 3 ? customerLat : partnerLat,
    lng: currentStepIndex >= 3 ? customerLng : partnerLng,
  });
  const [partnerProgress, setPartnerProgress] = useState(
    currentStepIndex <= 1 ? 0 : currentStepIndex === 2 ? 0.05 : 1.0
  );
  const [remainingDistanceKm, setRemainingDistanceKm] = useState(
    currentStepIndex >= 3
      ? 0.0
      : Number(activeJob?.remaining_distance_km ?? activeJob?.route_distance_km ?? 0.8)
  );
  const [etaMinutes, setEtaMinutes] = useState(
    currentStepIndex >= 3 ? 0 : Number(activeJob?.eta_minutes ?? 4)
  );

  // Real-time cancellation and status synchronization via Socket.IO
  useEffect(() => {
    const currentId = activeJob?.id || activeJob?.requestId || activeJob?.request_id;
    if (!currentId) return;

    socketService.joinRequest(currentId);

    const unsubCancelled = socketService.onRequestCancelled((data) => {
      if (
        !data ||
        !data.requestId ||
        String(data.requestId) === String(currentId) ||
        String(data.id) === String(currentId)
      ) {
        setCancellationAlert({
          reason: data?.reason || 'Customer cancelled the work order.',
          message: data?.message || 'You are freed for new jobs.',
        });
        setTimeout(() => {
          if (onJobClosed) onJobClosed(null);
        }, 2500);
      }
    });

    const handleStatusSync = (data) => {
      if (
        data &&
        (String(data.requestId) === String(currentId) ||
          String(data.id) === String(currentId))
      ) {
        if (data.status === 'partner_arrived' || data.status === 'arrived' || data.step_index === 3) {
          setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
          setPartnerProgress(1.0);
          setRemainingDistanceKm(0.0);
          setEtaMinutes(0);
          setOtpModalOpen(true);
        }
        if (onJobUpdated) {
          onJobUpdated({
            ...data,
            id: data.id || data.requestId || currentId,
          });
        }
      }
    };

    const handleLocationUpdate = (data) => {
      if (
        data &&
        (String(data.requestId) === String(currentId) ||
          String(data.id) === String(currentId))
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

    const handlePartnerArrived = (data) => {
      if (
        data &&
        (String(data.requestId) === String(currentId) ||
          String(data.id) === String(currentId))
      ) {
        setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
        setPartnerProgress(1.0);
        setRemainingDistanceKm(0.0);
        setEtaMinutes(0);
        setOtpModalOpen(true);
      }
    };

    const handlePaymentCompleted = (data) => {
      if (!data) return;
      const incomingId = data.requestId || data.id || data.request_id;
      if (incomingId && String(incomingId) !== String(currentId)) return;
      setWaitingForReview(true);
      if (onJobUpdated) {
        onJobUpdated({
          ...(activeJob || {}),
          ...data,
          status: 'payment_completed',
          waiting_for_review: true,
        });
      }
    };

    const handleRatingSubmitted = (data) => {
      if (!data) return;
      const incomingId = data.requestId || data.id || data.request_id;
      if (incomingId && String(incomingId) !== String(currentId)) return;
      setReceivedReview(data);
      setWaitingForReview(true);
      if (onJobUpdated) {
        onJobUpdated({
          ...(activeJob || {}),
          review: data,
          status: 'payment_completed',
          waiting_for_review: true,
        });
      }
    };

    if (typeof socketService.on === 'function') {
      socketService.on('request_status_updated', handleStatusSync);
      socketService.on('partner_location', handleLocationUpdate);
      socketService.on('partner_location_update', handleLocationUpdate);
      socketService.on('partner_arrived', handlePartnerArrived);
      socketService.on('payment_completed', handlePaymentCompleted);
      socketService.on('rating_submitted', handleRatingSubmitted);
      socketService.on('review_received', handleRatingSubmitted);
      socketService.on('rating_skipped', handleRatingSubmitted);
      socketService.on('rating_status_updated', handleRatingSubmitted);
    }

    return () => {
      if (typeof unsubCancelled === 'function') unsubCancelled();
      if (typeof socketService.off === 'function') {
        socketService.off('request_status_updated', handleStatusSync);
        socketService.off('partner_location', handleLocationUpdate);
        socketService.off('partner_location_update', handleLocationUpdate);
        socketService.off('partner_arrived', handlePartnerArrived);
        socketService.off('payment_completed', handlePaymentCompleted);
        socketService.off('rating_submitted', handleRatingSubmitted);
        socketService.off('review_received', handleRatingSubmitted);
        socketService.off('rating_skipped', handleRatingSubmitted);
        socketService.off('rating_status_updated', handleRatingSubmitted);
      }
    };
  }, [activeJob?.id, activeJob?.requestId, activeJob?.request_id, customerLat, customerLng, onJobClosed, onJobUpdated, activeJob]);

  // Sync state when step reaches arrived or later
  useEffect(() => {
    if (currentStepIndex >= 3) {
      setCurrentPartnerPos({ lat: customerLat, lng: customerLng });
      setPartnerProgress(1.0);
      setRemainingDistanceKm(0.0);
      setEtaMinutes(0);
    } else if (currentStepIndex === 1) {
      setPartnerProgress(0);
      setCurrentPartnerPos({ lat: partnerLat, lng: partnerLng });
    }
  }, [currentStepIndex, customerLat, customerLng, partnerLat, partnerLng]);

  // Smooth route movement simulation along routeGeometry when partner is en-route (Step 2)
  useEffect(() => {
    if (currentStatus !== 'on_the_way' || currentStepIndex !== 2) return;
    if (!routeGeometry || routeGeometry.length < 2) return;

    const totalDist = Number(activeJob?.route_distance_km ?? 0.8) || 0.8;
    const intervalMs = 1000;
    const stepDelta = 0.04;

    const timer = setInterval(() => {
      setPartnerProgress((prev) => {
        const next = Math.min(1.0, prev + stepDelta);
        const remaining = Math.max(0, parseFloat((totalDist * (1 - next)).toFixed(1)));
        const eta = Math.ceil((remaining / 30) * 60);

        setRemainingDistanceKm(remaining);
        setEtaMinutes(eta);

        const totalPoints = routeGeometry.length;
        const scaled = next * (totalPoints - 1);
        const idx = Math.min(Math.floor(scaled), totalPoints - 2);
        const frac = scaled - idx;
        const p1 = routeGeometry[idx] || routeGeometry[0];
        const p2 = routeGeometry[idx + 1] || routeGeometry[routeGeometry.length - 1];

        const interpLat = p1.lat + (p2.lat - p1.lat) * frac;
        const interpLng = p1.lng + (p2.lng - p1.lng) * frac;

        setCurrentPartnerPos({ lat: interpLat, lng: interpLng });

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentStatus, currentStepIndex, routeGeometry, activeJob?.route_distance_km]);

  if (!activeJob) {
    return (
      <div
        className="bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-8 sm:p-12 text-center shadow-hard"
        style={{ borderRadius: 0 }}
      >
        <div className="w-12 h-12 bg-concrete border-2 border-[var(--theme-border)] mx-auto flex items-center justify-center font-bold text-xl mb-3 text-[var(--theme-text-main)]">
          0
        </div>
        <h2 className="font-display font-extrabold text-2xl text-[var(--theme-text-main)]">
          No Active Work Order In Progress
        </h2>
        <p className="font-mono text-xs sm:text-sm text-[var(--theme-text-soft)] max-w-md mx-auto mt-2 mb-6">
          Your dispatch radar is active. When a customer in your 2 km zone requests a fix, an incoming work order will appear immediately.
        </p>
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="btn-primary min-h-[48px] px-6 font-mono text-xs font-bold uppercase tracking-wider shadow-hard"
        >
          RETURN TO DISPATCH RADAR →
        </button>
      </div>
    );
  }

  const displayDistance =
    currentStepIndex >= 3
      ? '0.0'
      : remainingDistanceKm != null
      ? Number(remainingDistanceKm).toFixed(1)
      : '0.8';

  const displayEta =
    currentStepIndex >= 3
      ? 0
      : etaMinutes != null
      ? etaMinutes
      : 4;

  const targetJobId = activeJob?.id || activeJob?.requestId || activeJob?.request_id;

  // Next-action execution
  const handleNextAction = async () => {
    setError(null);

    // If at 'arrived', partner must enter service OTP provided by customer (SRS FR-P10)
    if (currentStatus === 'arrived') {
      if (targetJobId) {
        requestOtpPrompt(targetJobId);
      }
      setOtpModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const result = await advanceJobStep(targetJobId, currentStatus);
      if (result.status === 'paid' || result.status === 'completed' || result.status === 'payment_completed') {
        setSettlementReceipt(result.settlement || null);
        setWaitingForReview(true);
        if (onJobUpdated) {
          onJobUpdated({
            ...(activeJob || {}),
            ...result,
            status: 'payment_completed',
            waiting_for_review: true,
          });
        }
      } else {
        if (onJobUpdated) onJobUpdated(result);
        // Instant OTP input transition upon clicking "Arrived" (no refresh needed)
        if (
          result.status === 'partner_arrived' ||
          result.status === 'arrived' ||
          currentStatus === 'on_the_way'
        ) {
          if (targetJobId) {
            requestOtpPrompt(targetJobId);
          }
          setOtpModalOpen(true);
        }
      }
    } catch (err) {
      setError(`! ${err.message || 'Failed to update work order status.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirm Service OTP verification (SRS FR-P10, FR-T2)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await advanceJobStep(targetJobId, 'arrived', otpInput);
      setOtpModalOpen(false);
      setOtpInput('');
      if (onJobUpdated) onJobUpdated(result);
    } catch (err) {
      setError(`! ${err.message || 'OTP verification failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Simulate Customer Cancellation (SRS FR-C19, FR-T3)
  const handleSimulateCancel = async () => {
    setLoading(true);
    try {
      const result = await simulateCustomerCancel(targetJobId);
      setCancellationAlert(result);
      setTimeout(() => {
        if (onJobClosed) onJobClosed(null);
      }, 1500);
    } catch (err) {
      setError(`! ${err.message || 'Cancellation simulation failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  const hasPhoto = Boolean(activeJob?.has_photo || activeJob?.photo_url);

  const handleOpenPhotoModal = async () => {
    setPhotoModalOpen(true);
    setPhotoError(null);
    if (!photoBlobUrl && targetJobId) {
      setPhotoLoading(true);
      try {
        const token = localStorage.getItem('fixit_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/requests/${targetJobId}/photo`, { headers });
        if (!res.ok) {
          throw new Error(res.status === 403 ? 'Access denied to issue photo.' : 'Photo not found.');
        }
        const blob = await res.blob();
        setPhotoBlobUrl(URL.createObjectURL(blob));
      } catch (err) {
        setPhotoError(err.message || 'Failed to load issue photo.');
      } finally {
        setPhotoLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (photoBlobUrl) {
        URL.revokeObjectURL(photoBlobUrl);
      }
    };
  }, [photoBlobUrl]);

  useEffect(() => {
    setPhotoBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoModalOpen(false);
    setPhotoError(null);
  }, [targetJobId]);

  useEffect(() => {
    if (!photoModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPhotoModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoModalOpen]);

  if (!activeJob) {
    return (
      <div className="bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-8 text-center space-y-4">
        <h2 className="font-display font-bold text-xl text-[var(--theme-text-main)]">
          No Active Work Order
        </h2>
        <p className="font-mono text-xs text-[var(--theme-text-soft)]">
          You currently have no active work order dispatch.
        </p>
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="btn-primary min-h-[44px] px-6 text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Order Stamp */}
      <div
        className="bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-5 sm:p-6 shadow-hard"
        style={{ borderRadius: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[var(--theme-border)] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-signal inline-block animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-signal">
                ACTIVE WORK ORDER DISPATCH
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--theme-text-main)]">
              {activeJob?.order_number || 'ORD-0428'} · {activeJob?.service_name || 'Service Call'}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="border-2 border-ink bg-signal text-ink px-3 py-1 font-mono text-xs font-bold uppercase shadow-hard-sm">
              LIVE DISPATCH
            </span>
          </div>
        </div>

        {/* 5-Step Status Ladder */}
        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-5 min-w-[320px] sm:min-w-0 border-2 border-[var(--theme-border)] bg-[var(--theme-bg)] p-1 gap-1 font-mono text-center">
            {statusLadder.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStepIndex;
              const isCurrent = stepNum === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`py-1.5 sm:py-2 px-0.5 sm:px-1 text-[9px] sm:text-xs font-bold uppercase transition-colors truncate ${
                    isCurrent
                      ? 'bg-signal text-ink shadow-hard-sm'
                      : isCompleted
                      ? 'bg-done text-paper'
                      : 'text-[var(--theme-text-muted)]'
                  }`}
                  title={`${step.num}. ${step.label}`}
                >
                  <div className="block sm:inline mr-0.5 sm:mr-1">{isCompleted ? '✓' : `${step.num}.`}</div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error or Alert Notice */}
      {error && (
        <div
          role="alert"
          className="border-2 border-signal bg-paper text-ink p-3 font-mono text-xs font-bold shadow-hard-sm"
        >
          {error}
        </div>
      )}

      {cancellationAlert && (
        <div
          role="alert"
          className="border-2 border-signal bg-paper text-ink p-4 font-mono text-xs font-bold shadow-hard-sm space-y-1"
        >
          <div className="text-signal uppercase tracking-wider">! WORK ORDER CANCELLED</div>
          <div>{cancellationAlert.reason}</div>
          <div className="text-muted text-[11px]">{cancellationAlert.message}</div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WORK ORDER DETAILS & PRIMARY ACTION (Partner side - No Map)    */}
      {/* ============================================================== */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Customer Contact & Address Card */}
        <div
          className="bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-5 sm:p-6 shadow-hard space-y-4"
          style={{ borderRadius: 0 }}
        >
          <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-text-soft)]">
              CUSTOMER &amp; SITE ADDRESS
            </span>
            <span className="font-mono text-[11px] font-bold text-done">
              {displayDistance} KM AWAY
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[var(--theme-text-soft)] block text-[10px]">CUSTOMER NAME:</span>
              <span className="font-display font-bold text-lg text-[var(--theme-text-main)]">
                {activeJob?.customer_name || 'Customer'}
              </span>
            </div>

            <div>
              <span className="text-[var(--theme-text-soft)] block text-[10px]">PHONE CONTACT:</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-bold text-sm text-[var(--theme-text-main)]">
                  {activeJob?.customer_phone || '+91 98860 33412'}
                </span>
                <a
                  href={`tel:${activeJob?.customer_phone || '+919886033412'}`}
                  className="px-2.5 py-1 border border-ink bg-concrete hover:bg-signal font-bold text-[10px] uppercase text-ink"
                >
                  CALL CUSTOMER
                </a>
              </div>
            </div>

            <div>
              <span className="text-[var(--theme-text-soft)] block text-[10px]">SERVICE LOCATION:</span>
              <div className="p-2.5 bg-[var(--theme-bg)] border border-[var(--theme-border)] mt-1 font-sans text-xs text-[var(--theme-text-main)] font-medium leading-relaxed">
                {activeJob?.address || 'Site Location'}
              </div>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink bg-signal font-mono font-bold text-xs uppercase tracking-wider text-ink hover:opacity-90 shadow-hard-sm"
                >
                  <span>Open in Google Maps</span>
                  <span aria-hidden="true">↗</span>
                </a>

                {hasPhoto && (
                  <button
                    type="button"
                    onClick={handleOpenPhotoModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink bg-paper hover:bg-signal font-mono font-bold text-xs uppercase tracking-wider text-ink shadow-hard-sm"
                  >
                    <span aria-hidden="true">📷</span>
                    <span>View issue</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* Issue Description & Payment Card */}
          <div
            className="bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-5 sm:p-6 shadow-hard space-y-4"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-text-soft)]">
                WORK ORDER SPECIFICATION
              </span>
              <span className="border border-[var(--theme-border)] bg-[var(--theme-bg)] px-2 py-0.5 font-mono text-[10px] font-bold">
                100% DIRECT SETTLEMENT
              </span>
            </div>

            <div className="p-3 bg-[var(--theme-bg)] border border-[var(--theme-border)] space-y-1.5">
              <div>
                <span className="font-mono text-[10px] text-[var(--theme-text-soft)] uppercase block">
                  REPORTED ISSUE:
                </span>
              </div>
              <p className="font-sans text-sm text-[var(--theme-text-main)] leading-relaxed font-medium">
                &ldquo;{activeJob?.problem || 'Service request reported by customer'}&rdquo;
              </p>
            </div>

            <div className="p-3 bg-concrete border border-ink font-mono text-xs text-ink space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold">SERVICE OTP:</span>
                <span className="font-bold text-signal px-2 py-0.5 bg-paper border border-ink">
                  {currentStatus === 'arrived' ? 'ASK CUSTOMER FOR OTP' : 'PROTECTED UNTIL ARRIVAL'}
                </span>
              </div>
              <div className="text-[11px] text-muted leading-relaxed">
                Customer gives you the 6-digit OTP upon arrival to verify physical presence before opening tools.
              </div>
            </div>

            {/* Test Cancellation Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulateCancel}
                disabled={loading}
                className="text-[11px] font-mono text-[var(--theme-text-muted)] hover:text-signal underline"
              >
                Simulate Customer Cancellation (Testing SRS FR-C19)
              </button>
            </div>
          </div>

          {/* THE SINGLE PRIMARY NEXT-ACTION BUTTON / WAITING REVIEW CARD */}
          <div
            className="bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-5 sm:p-6 shadow-hard"
            style={{ borderRadius: 0 }}
          >
            {waitingForReview ? (
              receivedReview ? (
                receivedReview.result === 'skipped' || receivedReview.rating_status === 'skipped' ? (
                  /* Customer Skipped Rating Card (FIX 1 & FIX 2) */
                  <div className="space-y-4" data-testid="review-skipped-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[var(--theme-border)] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-muted inline-block" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
                          CUSTOMER RATING
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[var(--theme-text-soft)]">
                        Order: {activeJob?.order_number || 'ORD-0428'}
                      </span>
                    </div>

                    <div className="p-4 bg-[var(--theme-bg)] border-2 border-[var(--theme-border)] space-y-2">
                      <p className="font-display font-extrabold text-xl text-[var(--theme-text-main)]">
                        Rating skipped
                      </p>
                      <p className="font-mono text-xs text-[var(--theme-text-soft)]">
                        The customer opted to skip rating for this completed work order.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <p className="font-mono text-xs text-[var(--theme-text-soft)]">
                        Job completed &amp; settlement recorded.
                      </p>
                      <button
                        type="button"
                        onClick={handleFinishJob}
                        className="btn-primary w-full sm:w-auto min-h-[48px] px-8 text-sm uppercase tracking-wider font-bold shadow-hard cursor-pointer"
                      >
                        Return to dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Customer Review Received Card */
                  <div className="space-y-4" data-testid="review-received-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[var(--theme-border)] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-done inline-block" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-done">
                          CUSTOMER REVIEW RECEIVED
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[var(--theme-text-soft)]">
                        Order: {activeJob?.order_number || 'ORD-0428'}
                      </span>
                    </div>

                    <div className="p-4 bg-[var(--theme-bg)] border-2 border-done/40 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-[var(--theme-text-soft)] uppercase block">
                            RATING FROM {receivedReview.customer_name || activeJob?.customer_name || 'CUSTOMER'}:
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5" aria-label={`Rating: ${receivedReview.stars || 5} out of 5 stars`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-2xl ${
                                  star <= (Number(receivedReview.stars) || 5)
                                    ? 'text-signal'
                                    : 'text-[var(--theme-border)]'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="font-mono text-base font-bold ml-2 text-[var(--theme-text-main)]">
                              {receivedReview.stars || 5}.0 / 5.0
                            </span>
                          </div>
                        </div>
                        <span className="border border-done bg-done/10 text-done px-2.5 py-1 font-mono text-xs font-bold uppercase">
                          VERIFIED SERVICE
                        </span>
                      </div>

                      {(receivedReview.comment || receivedReview.feedback || receivedReview.review_line) && (
                        <div className="pt-2 border-t border-[var(--theme-border)]">
                          <span className="font-mono text-[10px] text-[var(--theme-text-soft)] uppercase block mb-1">
                            CUSTOMER FEEDBACK:
                          </span>
                          <p className="font-sans text-sm italic text-[var(--theme-text-main)] font-medium">
                            &ldquo;{receivedReview.comment || receivedReview.feedback || receivedReview.review_line}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <p className="font-mono text-xs text-[var(--theme-text-soft)]">
                        Job completed &amp; rating confirmed.
                      </p>
                      <button
                        type="button"
                        onClick={handleFinishJob}
                        className="btn-primary w-full sm:w-auto min-h-[48px] px-8 text-sm uppercase tracking-wider font-bold shadow-hard cursor-pointer"
                      >
                        Return to dashboard
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Waiting for Review Card */
                <div className="space-y-4" data-testid="waiting-review-card">
                  <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-signal inline-block animate-ping" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-signal">
                        WAITING FOR CUSTOMER REVIEW
                      </span>
                    </div>
                    <span className="border border-done bg-done/10 text-done px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                      PAYMENT SETTLED
                    </span>
                  </div>

                  <div className="p-4 bg-[var(--theme-bg)] border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-signal border-t-transparent animate-spin shrink-0" />
                      <div>
                        <p className="font-display font-extrabold text-lg text-[var(--theme-text-main)]">
                          Payment Confirmed · Awaiting Customer Feedback
                        </p>
                        <p className="font-mono text-xs text-[var(--theme-text-soft)] mt-0.5">
                          The on-site work is complete and payment is recorded. The customer is currently reviewing the service on their screen.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span className="font-mono text-xs text-[var(--theme-text-soft)]">
                      Live sync active · Screen will automatically update when review arrives
                    </span>
                    <button
                      type="button"
                      onClick={handleFinishJob}
                      className="btn-secondary w-full sm:w-auto min-h-[44px] px-6 text-xs uppercase tracking-wider font-bold"
                    >
                      RETURN TO DASHBOARD
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-xs text-[var(--theme-text-soft)] uppercase block mb-1">
                    NEXT WORK ORDER ACTION:
                  </span>
                  <div className="font-display font-extrabold text-xl text-[var(--theme-text-main)]">
                    {currentStatus === 'accepted' && 'Step 1: Commencing Journey to Customer Site'}
                    {currentStatus === 'on_the_way' && 'Step 2: Reached Customer Doorstep'}
                    {currentStatus === 'arrived' && 'Step 3: Verify 6-Digit Service OTP to Start Work'}
                    {currentStatus === 'in_progress' && 'Step 4: Repair Work in Progress'}
                    {currentStatus === 'completed' && 'Step 5: Direct On-Site Settlement & Payout'}
                  </div>
                </div>

                {/* THE SINGLE BUTTON */}
                <div className="shrink-0 w-full sm:w-auto">
                  {currentStatus === 'accepted' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleNextAction}
                      className="btn-primary w-full sm:w-auto min-h-[52px] px-10 text-base uppercase tracking-wider font-bold shadow-hard"
                    >
                      {loading ? 'STARTING...' : 'Start trip'}
                    </button>
                  )}

                  {currentStatus === 'on_the_way' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleNextAction}
                      className="btn-primary w-full sm:w-auto min-h-[52px] px-10 text-base uppercase tracking-wider font-bold shadow-hard"
                    >
                      {loading ? 'RECORDING ARRIVAL...' : 'Arrived'}
                    </button>
                  )}

                  {currentStatus === 'arrived' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        if (activeJob?.id) {
                          requestOtpPrompt(activeJob.id);
                        }
                        setOtpModalOpen(true);
                      }}
                      className="btn-primary w-full sm:w-auto min-h-[52px] px-10 text-base uppercase tracking-wider font-bold shadow-hard"
                    >
                      Start service
                    </button>
                  )}

                  {currentStatus === 'in_progress' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleNextAction}
                      className="btn-primary w-full sm:w-auto min-h-[52px] px-10 text-base uppercase tracking-wider font-bold shadow-hard"
                    >
                      {loading ? 'RECORDING COMPLETION...' : 'Complete service'}
                    </button>
                  )}

                  {currentStatus === 'completed' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleNextAction}
                      className="w-full sm:w-auto min-h-[52px] px-10 border-2 border-ink bg-done text-paper font-mono text-base uppercase tracking-wider font-bold shadow-hard hover:opacity-95"
                    >
                      {loading ? 'CONFIRMING SETTLEMENT...' : 'Payment received'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      {/* ============================================================== */}
      {/* SERVICE OTP INPUT MODAL (Step 3: Arrived -> In Progress)        */}
      {/* ============================================================== */}
      {otpModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/75 flex items-center justify-center p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-paper border-2 border-ink p-6 sm:p-7 max-w-md w-full shadow-hard relative text-ink font-mono max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-signal">
                SERVICE COMMENCEMENT VERIFICATION
              </span>
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="w-7 h-7 border border-ink bg-concrete font-bold text-ink hover:bg-signal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-ink">
                  Enter 6-Digit Service OTP
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Ask customer <strong>{activeJob?.customer_name || 'Customer'}</strong> for the 6-digit verification passcode shown on their live tracking screen to verify arrival and begin the repair.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-concrete border-2 border-signal text-signal text-xs font-mono font-bold">
                  {error}
                </div>
              )}

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full min-h-[48px] px-4 border-2 border-ink bg-paper text-ink font-mono text-2xl tracking-[0.4em] text-center focus:outline-none focus:border-signal"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full min-h-[48px] font-bold text-xs uppercase tracking-wider"
                >
                  {loading ? 'AUTHENTICATING CODE...' : 'START SERVICE WORK NOW →'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  className="btn-secondary w-full sm:w-1/3 min-h-[48px] font-bold text-xs uppercase"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FINAL SETTLEMENT RECEIPT MODAL (Step 5: Paid)                   */}
      {/* ============================================================== */}
      {showSettlementModal && settlementReceipt && (
        <div
          className="fixed inset-0 z-50 bg-ink/75 flex items-center justify-center p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-paper border-2 border-ink p-6 sm:p-8 max-w-lg w-full shadow-hard relative text-ink font-mono max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-done">
                JOB COMPLETED &amp; SETTLED
              </span>
              <span className="px-2 py-0.5 border border-done bg-done text-paper text-[10px] font-bold uppercase">
                DIRECT SETTLEMENT
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-ink">
                  Work Order Closed Successfully!
                </h3>
                <p className="text-muted mt-1">
                  Settlement ref: <span className="font-bold text-ink">{settlementReceipt.order_number}</span>
                </p>
              </div>

              <div className="p-4 bg-concrete border border-ink space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">SERVICE CATEGORY:</span>
                  <span className="font-bold text-ink">{settlementReceipt.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">CUSTOMER:</span>
                  <span className="font-bold text-ink">{settlementReceipt.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">PAYMENT MODE:</span>
                  <span className="font-bold text-ink">{settlementReceipt.payment_mode}</span>
                </div>
                <div className="border-t border-ink/20 pt-2 flex justify-between text-sm font-bold">
                  <span>PAYMENT STATUS:</span>
                  <span className="text-done">✓ Payment Received · Job Completed</span>
                </div>
              </div>

              <p className="text-[11px] text-muted leading-relaxed">
                Direct settlement confirmed with customer. You are now free and available on the dispatch radar for the next booking.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSettlementReceipt(null);
                  onNavigateToDashboard();
                }}
                className="btn-primary w-full min-h-[48px] font-bold text-xs uppercase tracking-wider"
              >
                RETURN TO LIVE RADAR →
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* CUSTOMER ISSUE PHOTO MODAL                                     */}
      {/* ============================================================== */}
      {photoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/75 flex items-center justify-center p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPhotoModalOpen(false);
          }}
        >
          <div
            className="bg-paper border-2 border-ink p-5 sm:p-7 max-w-lg w-full shadow-hard relative text-ink font-mono max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-signal">
                CUSTOMER ISSUE PHOTO
              </span>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                aria-label="Close modal"
                className="w-7 h-7 border border-ink bg-concrete font-bold text-ink hover:bg-signal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-xl text-ink">
                  Reported Issue Attachment
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Uploaded by customer for work order {activeJob?.order_number || `#${targetJobId}`}.
                </p>
              </div>

              {photoLoading && (
                <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-muted">
                  Loading secure issue photo...
                </div>
              )}

              {photoError && (
                <div className="p-3 bg-concrete border-2 border-signal text-signal text-xs font-mono font-bold">
                  ! {photoError}
                </div>
              )}

              {photoBlobUrl && (
                <div className="border-2 border-ink bg-concrete p-2 flex items-center justify-center">
                  <img
                    src={photoBlobUrl}
                    alt="Customer issue"
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  className="w-full min-h-[44px] border-2 border-ink bg-concrete hover:bg-signal font-mono font-bold text-xs uppercase tracking-wider text-ink"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
