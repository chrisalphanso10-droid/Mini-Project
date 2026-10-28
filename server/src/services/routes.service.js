/**
 * FixIt Now - Routes Service (Google Routes API v2 & Telemetry)
 * Conforms to Google Routes API requirements:
 * - Server-only calls to Google Routes API v2 computeRoutes.
 * - travelMode: TWO_WHEELER.
 * - Header X-Goog-FieldMask: routes.distanceMeters,routes.polyline.encodedPolyline.
 * - Server-side polyline decoder (no external packages).
 * - Fallback to straight line on failure (never throws / never returns 500).
 * - Pure function distance, ETA, and position interpolation along route geometry.
 * - Never logs or exposes the API key.
 */

import config from '../config/index.js';
import { calculateHaversineDistance } from './matching.service.js';

/**
 * Decodes a Google Encoded Polyline string into an array of [lat, lng] coordinates
 * Standard algorithm: 5-bit chunks with ASCII offset 63.
 *
 * @param {string} str Encoded polyline string
 * @returns {Array<[number, number]>} Decoded [latitude, longitude] pairs
 */
export function decodePolyline(str) {
  if (!str || typeof str !== 'string') return [];

  let index = 0;
  const len = str.length;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && index < len);

    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && index < len);

    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([
      parseFloat((lat * 1e-5).toFixed(6)),
      parseFloat((lng * 1e-5).toFixed(6)),
    ]);
  }

  return coordinates;
}

/**
 * Encodes an array of [lat, lng] coordinates into an encoded polyline string
 * Useful for mocking and testing.
 *
 * @param {Array<[number, number]>} coords
 * @returns {string}
 */
export function encodePolyline(coords) {
  if (!Array.isArray(coords)) return '';

  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  function encodeValue(val) {
    let num = val < 0 ? ~(val << 1) : (val << 1);
    let str = '';
    while (num >= 0x20) {
      str += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
      num >>= 5;
    }
    str += String.fromCharCode(num + 63);
    return str;
  }

  for (const [lat, lng] of coords) {
    const late5 = Math.round(lat * 1e5);
    const lnge5 = Math.round(lng * 1e5);

    output += encodeValue(late5 - prevLat);
    output += encodeValue(lnge5 - prevLng);

    prevLat = late5;
    prevLng = lnge5;
  }

  return output;
}

/**
 * Calculates the total cumulative distance along an array of [lat, lng] points in kilometers.
 *
 * @param {Array<[number, number]>} points
 * @returns {number} Distance in km
 */
export function computePolylineDistance(points) {
  if (!Array.isArray(points) || points.length < 2) return 0.0;

  let totalKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    totalKm += calculateHaversineDistance(p1[0], p1[1], p2[0], p2[1]);
  }

  return parseFloat(totalKm.toFixed(3));
}

/**
 * Resolves routing profile (Google travel mode, speed in km/h) based on partner vehicle type.
 * Conforms to Change 4 / Fix 3:
 * - bike_scooter: TWO_WHEELER, 40 km/h (TWO_WHEELER_SPEED_KMH)
 * - car: DRIVE, 35 km/h (CAR_SPEED_KMH)
 *
 * @param {string} [vehicleType]
 * @returns {{ travelMode: 'TWO_WHEELER' | 'DRIVE', speedKmh: number, vehicleType: string }}
 */
export function getVehicleRoutingProfile(vehicleType) {
  const norm = String(vehicleType || 'bike_scooter').toLowerCase().trim();
  if (norm === 'car') {
    const speed = Number(config.carSpeedKmh || process.env.CAR_SPEED_KMH || 35);
    return { travelMode: 'DRIVE', speedKmh: speed, vehicleType: 'car' };
  }
  if (norm === 'others') {
    const speed = Number(config.otherSpeedKmh || process.env.OTHER_SPEED_KMH || 30);
    return { travelMode: 'DRIVE', speedKmh: speed, vehicleType: 'others' };
  }
  // Default to bike_scooter
  const speed = Number(config.twoWheelerSpeedKmh || process.env.TWO_WHEELER_SPEED_KMH || 40);
  return { travelMode: 'TWO_WHEELER', speedKmh: speed, vehicleType: 'bike_scooter' };
}

/**
 * Computes ETA in minutes as a pure function:
 * ETA = ceil(remaining road distance / speed x 60)
 *
 * @param {number} remainingDistanceKm
 * @param {number} [speedKmh]
 * @param {string} [vehicleType]
 * @returns {number} ETA in whole minutes
 */
export function calculateEta(remainingDistanceKm, speedKmh, vehicleType) {
  let speed = Number(speedKmh);
  if (!speed || speed <= 0) {
    speed = getVehicleRoutingProfile(vehicleType).speedKmh;
  }
  const rem = Math.max(0, Number(remainingDistanceKm) || 0);
  if (rem <= 0.001) return 0;
  return Math.ceil((rem / speed) * 60);
}

/**
 * Interpolates the [lat, lng] coordinate along a polyline at a given distance covered from start.
 *
 * @param {Array<[number, number]>} points
 * @param {number} distanceCoveredKm
 * @returns {{ latitude: number, longitude: number }}
 */
export function interpolatePositionAlongPolyline(points, distanceCoveredKm) {
  if (!Array.isArray(points) || points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  if (points.length === 1 || distanceCoveredKm <= 0) {
    return { latitude: points[0][0], longitude: points[0][1] };
  }

  let accumulated = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segDist = calculateHaversineDistance(p1[0], p1[1], p2[0], p2[1]);

    if (accumulated + segDist >= distanceCoveredKm) {
      const remainingInSeg = distanceCoveredKm - accumulated;
      const t = segDist > 0 ? remainingInSeg / segDist : 0;
      const lat = p1[0] + (p2[0] - p1[0]) * t;
      const lng = p1[1] + (p2[1] - p1[1]) * t;
      return {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
      };
    }
    accumulated += segDist;
  }

  // If distance covered exceeds total length, snap to last point
  const last = points[points.length - 1];
  return { latitude: last[0], longitude: last[1] };
}

/**
 * Straight-line fallback route when Google Routes API call is unavailable.
 *
 * @param {number} startLat
 * @param {number} startLon
 * @param {number} endLat
 * @param {number} endLon
 * @param {number} [speedKmh]
 * @param {string} [vehicleType]
 * @returns {{ geometry: Array<[number, number]>, distanceKm: number, speedKmh: number, travelMode: string, vehicleType: string, source: string }}
 */
export function getStraightLineFallbackRoute(startLat, startLon, endLat, endLon, speedKmh, vehicleType) {
  const profile = getVehicleRoutingProfile(vehicleType);
  const speed = Number(speedKmh) > 0 ? Number(speedKmh) : profile.speedKmh;
  const dist = calculateHaversineDistance(startLat, startLon, endLat, endLon);
  const distanceKm = Math.max(0.1, parseFloat(dist.toFixed(2)));
  const geometry = [
    [parseFloat(Number(startLat).toFixed(6)), parseFloat(Number(startLon).toFixed(6))],
    [parseFloat(Number(endLat).toFixed(6)), parseFloat(Number(endLon).toFixed(6))],
  ];

  return {
    geometry,
    distanceKm,
    speedKmh: speed,
    travelMode: profile.travelMode,
    vehicleType: profile.vehicleType,
    source: 'straight_line_fallback',
  };
}

/**
 * Calls Google Routes API v2 computeRoutes for partner navigation.
 * Uses travelMode and speed configured per partner vehicle type.
 * Never throws an error; returns fallback straight-line route on any failure.
 * Never logs or exposes the API key.
 *
 * @param {object} params
 * @param {number} params.startLat
 * @param {number} params.startLon
 * @param {number} params.endLat
 * @param {number} params.endLon
 * @param {number} [params.speedKmh]
 * @param {string} [params.vehicleType]
 * @param {string} [params.travelMode]
 * @returns {Promise<{ geometry: Array<[number, number]>, distanceKm: number, speedKmh: number, travelMode: string, vehicleType: string, source: string }>}
 */
export async function computeTwoWheelerRoute({
  startLat,
  startLon,
  endLat,
  endLon,
  speedKmh,
  vehicleType,
  travelMode,
}) {
  const profile = getVehicleRoutingProfile(vehicleType);
  const speed = Number(speedKmh) > 0 ? Number(speedKmh) : profile.speedKmh;
  const mode = travelMode || profile.travelMode;

  const fallback = getStraightLineFallbackRoute(startLat, startLon, endLat, endLon, speed, profile.vehicleType);

  const apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '';
  if (!apiKey || !apiKey.trim()) {
    console.warn('[Routes Warning] Google Maps API key missing. Using straight-line route.');
    return fallback;
  }

  const endpoint = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: Number(startLat),
          longitude: Number(startLon),
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: Number(endLat),
          longitude: Number(endLon),
        },
      },
    },
    travelMode: mode,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey.trim(),
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Routes Warning] Google Routes API returned HTTP ${response.status}. Using fallback.`);
      return fallback;
    }

    const data = await response.json();
    if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
      console.warn('[Routes Warning] Google Routes returned no routes. Using fallback.');
      return fallback;
    }

    const primaryRoute = data.routes[0];
    const encoded = primaryRoute.polyline?.encodedPolyline;
    if (!encoded) {
      console.warn('[Routes Warning] Google Routes missing encoded polyline. Using fallback.');
      return fallback;
    }

    const decoded = decodePolyline(encoded);
    if (decoded.length < 2) {
      console.warn('[Routes Warning] Decoded polyline has fewer than 2 points. Using fallback.');
      return fallback;
    }

    // Road distance in km
    let distanceKm = 0;
    if (typeof primaryRoute.distanceMeters === 'number') {
      distanceKm = parseFloat((primaryRoute.distanceMeters / 1000).toFixed(2));
    } else {
      distanceKm = parseFloat(computePolylineDistance(decoded).toFixed(2));
    }
    distanceKm = Math.max(0.1, distanceKm);

    return {
      geometry: decoded,
      distanceKm,
      speedKmh: speed,
      travelMode: mode,
      vehicleType: profile.vehicleType,
      source: 'google_routes_api',
    };
  } catch (err) {
    console.warn(`[Routes Warning] Google Routes API request error: ${err.name === 'AbortError' ? 'timeout' : err.message}. Using fallback.`);
    return fallback;
  }
}

export default {
  decodePolyline,
  encodePolyline,
  computePolylineDistance,
  getVehicleRoutingProfile,
  calculateEta,
  interpolatePositionAlongPolyline,
  getStraightLineFallbackRoute,
  computeTwoWheelerRoute,
};
