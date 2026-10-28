/**
 * FixIt Now - Shared Route Tracking Map Component
 * Reusable between Customer Live Tracking and Partner En-Route Screens.
 * Features:
 * - Google Maps JavaScript API with two-wheeler route polylines
 * - Fallback schematic SVG map when Google Maps is offline or key is missing
 * - Custom markers: Ink circle (Customer) & Signal square (Partner) per docs/DESIGN.md
 * - Live telemetry header (ETA, remaining distance, zone badge)
 * - Two-wheeler route beta notice
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';

const SVG_WAYPOINTS = [
  { x: 100, y: 70 },
  { x: 220, y: 70 },
  { x: 220, y: 150 },
  { x: 380, y: 150 },
  { x: 380, y: 220 },
  { x: 490, y: 220 },
];

function getSvgCoords(progress) {
  const validProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0;
  const totalSegments = SVG_WAYPOINTS.length - 1;
  const scaled = Math.max(0, Math.min(1, validProgress)) * totalSegments;
  const segIndex = Math.min(Math.floor(scaled), totalSegments - 1);
  const segT = scaled - segIndex;

  const p1 = SVG_WAYPOINTS[segIndex] || SVG_WAYPOINTS[0];
  const p2 = SVG_WAYPOINTS[segIndex + 1] || SVG_WAYPOINTS[SVG_WAYPOINTS.length - 1];

  return {
    x: p1.x + (p2.x - p1.x) * segT,
    y: p1.y + (p2.y - p1.y) * segT,
  };
}

export default function RouteTrackingMap({
  partnerPos,
  customerPos,
  routeGeometry = [],
  distanceKm = 0,
  etaMinutes = 0,
  stepIndex = 2,
  isPartnerView = false,
  dispatchZoneLabel = 'DISPATCH ZONE: 2.0 KM RADIUS',
  progress = 0,
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const partnerMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const travelledPolylineRef = useRef(null);
  const untravelledPolylineRef = useRef(null);

  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  const browserApiKey =
    import.meta.env.VITE_MAP_PUBLIC_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    '';

  const customerLat = Number(customerPos?.lat) || 12.9716;
  const customerLng = Number(customerPos?.lng) || 77.5946;
  const partnerLat = Number(partnerPos?.lat) || customerLat;
  const partnerLng = Number(partnerPos?.lng) || customerLng;

  // Normalized route points
  const normalizedRoute = useMemo(() => {
    if (Array.isArray(routeGeometry) && routeGeometry.length >= 2) {
      return routeGeometry.map((pt) => {
        if (Array.isArray(pt)) return { lat: Number(pt[0]), lng: Number(pt[1]) };
        return { lat: Number(pt.lat ?? pt.latitude), lng: Number(pt.lng ?? pt.longitude) };
      });
    }
    return [
      { lat: partnerLat, lng: partnerLng },
      { lat: customerLat, lng: customerLng },
    ];
  }, [routeGeometry, partnerLat, partnerLng, customerLat, customerLng]);

  // Compute effective partner position:
  // Before trip starts (stepIndex <= 1): sits at the START of the stored route.
  // After trip starts (stepIndex === 2): moves along the route using server-computed position.
  // At arrival (stepIndex >= 3): reaches the customer destination pin.
  const effectivePartnerPos = useMemo(() => {
    if (stepIndex >= 3) {
      return { lat: customerLat, lng: customerLng };
    }
    if (stepIndex <= 1 && normalizedRoute && normalizedRoute.length >= 2) {
      return { lat: normalizedRoute[0].lat, lng: normalizedRoute[0].lng };
    }
    return { lat: partnerLat, lng: partnerLng };
  }, [stepIndex, customerLat, customerLng, normalizedRoute, partnerLat, partnerLng]);

  // Load Google Maps JavaScript API
  useEffect(() => {
    let isMounted = true;
    if (!browserApiKey || !browserApiKey.trim()) {
      setMapLoadError(true);
      return;
    }

    loadGoogleMaps(browserApiKey)
      .then(() => {
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

  // Initialize Map
  useEffect(() => {
    if (!googleMapsReady || !mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    const google = window.google;

    if (!mapInstanceRef.current) {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: customerLat, lng: customerLng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        ],
      });
      mapInstanceRef.current = map;

      const RED_PIN_SVG_PATH =
        'M 12 2 C 8.13 2 5 5.13 5 9 c 0 5.25 7 13 7 13 s 7 -7.75 7 -13 c 0 -3.87 -3.13 -7 -7 -7 z M 12 11.5 c -1.38 0 -2.5 -1.12 -2.5 -2.5 s 1.12 -2.5 2.5 -2.5 2.5 1.12 2.5 2.5 -1.12 2.5 -2.5 2.5 z';

      // Customer destination marker: Red Pin
      customerMarkerRef.current = new google.maps.Marker({
        position: { lat: customerLat, lng: customerLng },
        map,
        title: 'Destination (Customer Location)',
        zIndex: 30,
        icon: {
          path: RED_PIN_SVG_PATH,
          scale: 1.6,
          fillColor: '#EF4444',
          fillOpacity: 1.0,
          strokeColor: '#B91C1C',
          strokeWeight: 1.5,
          anchor: new google.maps.Point(12, 22),
        },
      });

      // Google-Maps-style blue location circle: solid blue dot (#4285F4) with white border & soft translucent blue halo
      const BLUE_CIRCLE_SVG =
        '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="20" cy="20" r="16" fill="#4285F4" fill-opacity="0.25"/>' +
        '<circle cx="20" cy="20" r="8" fill="#FFFFFF"/>' +
        '<circle cx="20" cy="20" r="6" fill="#4285F4"/>' +
        '</svg>';
      const BLUE_CIRCLE_ICON_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(BLUE_CIRCLE_SVG)}`;

      // Partner marker: Google-Maps-style blue location circle
      partnerMarkerRef.current = new google.maps.Marker({
        position: effectivePartnerPos,
        map,
        title: 'Partner Location',
        zIndex: 20,
        icon: {
          url: BLUE_CIRCLE_ICON_URL,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
      });

      // Polylines: Route marked in blue color (#2563EB)
      untravelledPolylineRef.current = new google.maps.Polyline({
        path: normalizedRoute,
        geodesic: true,
        strokeColor: '#2563EB',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map,
      });

      travelledPolylineRef.current = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#1D4ED8',
        strokeOpacity: 1.0,
        strokeWeight: 6,
        map,
      });
    }

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setPosition({ lat: customerLat, lng: customerLng });
    }
    if (partnerMarkerRef.current) {
      partnerMarkerRef.current.setPosition(effectivePartnerPos);
    }
    if (untravelledPolylineRef.current) {
      untravelledPolylineRef.current.setPath(normalizedRoute);
    }

    // Fit bounds
    if (mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;
      if (normalizedRoute.length > 0) {
        normalizedRoute.forEach((pt) => {
          bounds.extend(pt);
          hasPoints = true;
        });
      } else {
        bounds.extend({ lat: customerLat, lng: customerLng });
        bounds.extend(effectivePartnerPos);
        hasPoints = true;
      }
      if (hasPoints) {
        mapInstanceRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      }
    }
  }, [googleMapsReady, normalizedRoute, customerLat, customerLng, effectivePartnerPos]);

  // Update dynamic position & travelled polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !partnerMarkerRef.current || !window.google) return;

    partnerMarkerRef.current.setPosition(effectivePartnerPos);

    if (normalizedRoute.length >= 2 && travelledPolylineRef.current && untravelledPolylineRef.current) {
      if (stepIndex >= 3) {
        travelledPolylineRef.current.setPath(normalizedRoute);
        untravelledPolylineRef.current.setPath([]);
      } else if (progress > 0 && progress < 1) {
        const totalPoints = normalizedRoute.length;
        const currentIdx = Math.floor(progress * (totalPoints - 1));
        const travelled = normalizedRoute.slice(0, currentIdx + 1);
        travelled.push(effectivePartnerPos);
        travelledPolylineRef.current.setPath(travelled);

        const untravelled = [effectivePartnerPos, ...normalizedRoute.slice(currentIdx + 1)];
        untravelledPolylineRef.current.setPath(untravelled);
      } else {
        travelledPolylineRef.current.setPath([]);
        untravelledPolylineRef.current.setPath(normalizedRoute);
      }
    }
  }, [effectivePartnerPos, normalizedRoute, stepIndex, progress]);

  const svgPos = getSvgCoords(progress);
  const displayDistance = stepIndex >= 3 ? '0.0' : Number(distanceKm || 0).toFixed(1);
  const displayEta = stepIndex >= 3 ? 0 : Math.max(0, Math.round(etaMinutes || 0));

  return (
    <div className={`bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] shadow-hard overflow-hidden ${className}`}>
      {/* Top ETA & Telemetry Bar */}
      <div className="bg-ink text-paper px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs border-b-2 border-ink">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-signal border border-paper inline-block" />
          <span className="font-bold text-signal tracking-wider">
            {stepIndex < 3
              ? `ETA: ${displayEta} MIN · DISTANCE: ${displayDistance} KM`
              : stepIndex === 3
              ? 'PARTNER ARRIVED AT DESTINATION'
              : stepIndex === 4
              ? 'SERVICE IN PROGRESS'
              : stepIndex === 5
              ? 'SERVICE COMPLETED'
              : 'PAYMENT CONFIRMED'}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-on-dark">
          <span className="hidden sm:inline">{dispatchZoneLabel}</span>
          <span className="uppercase bg-[#242931] px-2 py-0.5 border border-[#3A3F47] text-signal font-bold">
            STEP {stepIndex}/6
          </span>
        </div>
      </div>

      {/* Map View: Google Map or Fallback SVG */}
      {googleMapsReady && !mapLoadError ? (
        <div
          ref={mapContainerRef}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[var(--theme-surface-sub)] border-b-2 border-[var(--theme-border)]"
          aria-label="Google Maps live route tracking"
        />
      ) : (
        /* Fallback Schematic SVG Map */
        <div className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] bg-[var(--theme-surface-sub)] border-b-2 border-[var(--theme-border)]">
          <svg
            viewBox="0 0 600 300"
            className="w-full h-full select-none"
            aria-label="Schematic transit route map"
          >
            {/* Street Grid background lines */}
            <g stroke="var(--theme-border)" strokeWidth="1.5" opacity="0.35">
              <line x1="0" y1="70" x2="600" y2="70" />
              <line x1="0" y1="150" x2="600" y2="150" />
              <line x1="0" y1="220" x2="600" y2="220" />
              <line x1="0" y1="280" x2="600" y2="280" />
              <line x1="100" y1="0" x2="100" y2="300" />
              <line x1="220" y1="0" x2="220" y2="300" />
              <line x1="380" y1="0" x2="380" y2="300" />
              <line x1="490" y1="0" x2="490" y2="300" />
            </g>

            {/* Transit Route marked in blue color */}
            <polyline
              points="100,70 220,70 220,150 380,150 380,220 490,220"
              fill="none"
              stroke="#2563EB"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Destination Marker: Red Pin */}
            <g transform="translate(490, 220)">
              <ellipse cx="0" cy="0" rx="7" ry="3.5" fill="#000000" opacity="0.3" />
              <path
                d="M 0,-32 C -7.5,-32 -13,-26.5 -13,-19 C -13,-10 0,0 0,0 C 0,0 13,-10 13,-19 C 13,-26.5 7.5,-32 0,-32 Z"
                fill="#EF4444"
                stroke="#B91C1C"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="-19" r="4.5" fill="#FFFFFF" />
              <text
                x="0"
                y="16"
                textAnchor="middle"
                fontFamily="DM Mono, monospace"
                fontSize="10"
                fontWeight="700"
                fill="#EF4444"
              >
                DESTINATION
              </text>
            </g>

            {/* Partner Location Marker: Google-Maps-style blue location circle */}
            <g
              transform={`translate(${svgPos.x}, ${svgPos.y})`}
              className="transition-transform duration-150"
            >
              {/* Soft translucent blue halo */}
              <circle cx="0" cy="0" r="16" fill="#4285F4" fillOpacity="0.25" />
              {/* White border */}
              <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
              {/* Solid blue dot */}
              <circle cx="0" cy="0" r="6" fill="#4285F4" />
              <text
                x="0"
                y="-20"
                textAnchor="middle"
                fontFamily="DM Mono, monospace"
                fontSize="10"
                fontWeight="700"
                fill="#4285F4"
              >
                PARTNER
              </text>
            </g>
          </svg>
        </div>
      )}

      {/* Two-Wheeler Beta Notice */}
      <div className="px-3 py-1.5 bg-paper text-[10px] text-[var(--theme-text-muted)] font-mono border-b border-[var(--theme-border)] flex items-center justify-between">
        <span>Notice: Two-wheeler routes in Google Maps are in beta and may not reflect current road conditions.</span>
      </div>

      {/* Live Status Sub-Bar */}
      <div className="p-3 bg-[var(--theme-surface)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs border-t border-[var(--theme-border)]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-ping" />
          <span className="font-bold text-[var(--theme-text-main)] uppercase tracking-wider">
            {stepIndex === 1
              ? 'REQUEST ACCEPTED · READY TO COMMENCE TRIP'
              : stepIndex === 2
              ? 'PARTNER EN ROUTE TO DESTINATION'
              : stepIndex === 3
              ? 'PARTNER ARRIVED AT DESTINATION · VERIFY OTP'
              : stepIndex === 4
              ? 'SERVICE WORK ORDER IN PROGRESS'
              : stepIndex === 5
              ? 'SERVICE COMPLETED · READY FOR SETTLEMENT'
              : 'PAYMENT COMPLETED · SERVICE CLOSED'}
          </span>
        </div>
        <span className="text-[10px] text-[var(--theme-text-soft)] uppercase font-bold">
          LIVE GPS TELEMETRY
        </span>
      </div>
    </div>
  );
}
