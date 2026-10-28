/**
 * FixIt Now - Geocoding Service (Google Geocoding API with Resilient Fallback Chain)
 * Conforms to Google Maps Platform requirements:
 * - Server-only Google Geocoding API calls.
 * - Restrict to India (components=country:IN).
 * - Maps location_type (ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE) to precision.
 * - Handles OK, ZERO_RESULTS, OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST, UNKNOWN_ERROR, timeouts.
 * - Logs warnings without leaking the API key.
 * - Fallback chain: full address -> street and area -> area name -> simulated default zone coordinates.
 * - Preserves existing demo zone fallback coordinates without calling Nominatim.
 */

import config from '../config/index.js';

// In-memory address coordinate cache to minimize billable API calls
const geocodeCache = new Map();

/**
 * Maps Google Geocoding location_type to a standardized precision string
 * @param {string} locationType
 * @returns {string}
 */
function mapPrecision(locationType) {
  switch (locationType) {
    case 'ROOFTOP':
      return 'rooftop';
    case 'RANGE_INTERPOLATED':
      return 'range_interpolated';
    case 'GEOMETRIC_CENTER':
      return 'geometric_center';
    case 'APPROXIMATE':
    default:
      return 'approximate';
  }
}

/**
 * Calls Google Geocoding API for a query string.
 * Never throws an error; returns null on any API or network issue.
 * Never logs the API key.
 *
 * @param {string} queryText
 * @returns {Promise<{ lat: number, lng: number, precision: string, source: string, formatted_address?: string } | null>}
 */
export async function queryGoogleGeocoding(queryText) {
  if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
    return null;
  }

  const apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '';
  if (!apiKey || !apiKey.trim()) {
    console.warn('[Geocoding Warning] Google Maps API key is missing. Using fallback.');
    return null;
  }

  const endpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
  const url = `${endpoint}?address=${encodeURIComponent(queryText.trim())}&components=country:IN&key=${encodeURIComponent(apiKey.trim())}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Geocoding Warning] Google Geocoding HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    switch (data.status) {
      case 'OK':
        if (Array.isArray(data.results) && data.results.length > 0) {
          const first = data.results[0];
          const loc = first.geometry?.location;
          if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
            return {
              lat: parseFloat(loc.lat.toFixed(6)),
              lng: parseFloat(loc.lng.toFixed(6)),
              precision: mapPrecision(first.geometry?.location_type),
              source: 'google_geocoding',
              formatted_address: first.formatted_address || queryText,
            };
          }
        }
        return null;

      case 'ZERO_RESULTS':
        return null;

      case 'OVER_QUERY_LIMIT':
        console.warn('[Geocoding Warning] Google Geocoding quota exceeded.');
        return null;

      case 'REQUEST_DENIED':
        console.warn('[Geocoding Warning] Google Geocoding request denied.');
        return null;

      case 'INVALID_REQUEST':
        console.warn('[Geocoding Warning] Google Geocoding invalid request.');
        return null;

      case 'UNKNOWN_ERROR':
      default:
        console.warn(`[Geocoding Warning] Google Geocoding status: ${data.status}`);
        return null;
    }
  } catch (err) {
    console.warn(`[Geocoding Warning] Google Geocoding network error: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
    return null;
  }
}

/**
 * Extracts candidate street and area from a multi-part address
 * @param {string} address
 * @returns {string | null}
 */
function extractStreetAndArea(address) {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    // Return last 3 components (e.g. "Kopar Khairane, Navi Mumbai, Maharashtra")
    return parts.slice(-3).join(', ');
  }
  return null;
}

/**
 * Extracts locality/area name from address
 * @param {string} address
 * @returns {string | null}
 */
function extractAreaName(address) {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  return null;
}

/**
 * Primary geocode function conforming to Section A specification:
 * Returns { lat, lng, precision, source } or null.
 *
 * @param {string} addressText
 * @returns {Promise<{ lat: number, lng: number, latitude: number, longitude: number, precision: string, source: string } | null>}
 */
export async function geocode(addressText) {
  if (!addressText || typeof addressText !== 'string' || !addressText.trim()) {
    return null;
  }

  const clean = addressText.trim();
  const cacheKey = clean.toLowerCase();

  // Cache hit
  if (geocodeCache.has(cacheKey)) {
    const hit = geocodeCache.get(cacheKey);
    return {
      ...hit,
      latitude: hit.lat,
      longitude: hit.lng,
      source: hit.source || 'cache',
    };
  }

  // Fallback chain Step 1: Full Address via Google Geocoding
  const fullRes = await queryGoogleGeocoding(clean);
  if (fullRes) {
    const res = {
      ...fullRes,
      latitude: fullRes.lat,
      longitude: fullRes.lng,
    };
    geocodeCache.set(cacheKey, res);
    return res;
  }

  // Fallback chain Step 2: Street and Area via Google Geocoding
  const streetArea = extractStreetAndArea(clean);
  if (streetArea && streetArea.toLowerCase() !== clean.toLowerCase()) {
    const streetAreaRes = await queryGoogleGeocoding(streetArea);
    if (streetAreaRes) {
      const res = {
        ...streetAreaRes,
        latitude: streetAreaRes.lat,
        longitude: streetAreaRes.lng,
        source: 'google_geocoding_street_area',
      };
      geocodeCache.set(cacheKey, res);
      return res;
    }
  }

  // Fallback chain Step 3: Area Name via Google Geocoding
  const areaName = extractAreaName(clean);
  if (areaName && areaName.toLowerCase() !== clean.toLowerCase() && areaName.toLowerCase() !== (streetArea || '').toLowerCase()) {
    const areaRes = await queryGoogleGeocoding(areaName);
    if (areaRes) {
      const res = {
        ...areaRes,
        latitude: areaRes.lat,
        longitude: areaRes.lng,
        source: 'google_geocoding_area',
      };
      geocodeCache.set(cacheKey, res);
      return res;
    }
  }

  // If geocoding fails, do not invent coordinates or point to any default city
  return null;
}

/**
 * Backward-compatible alias for existing codebase callers:
 * returns { latitude, longitude, lat, lng, precision, source } or null
 */
export async function geocodeAddress(address) {
  return geocode(address);
}

export default {
  geocode,
  geocodeAddress,
  queryGoogleGeocoding,
};
