/**
 * FixIt Now - Google Maps JavaScript API Client Loader
 * Loads the Google Maps JavaScript API with the public browser key.
 * Never throws uncaught errors; returns Promise that resolves to window.google.maps.
 */

let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!apiKey || !apiKey.trim()) {
    return Promise.reject(new Error('Google Maps browser API key is not configured'));
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('fixit-google-maps-script');
    if (existingScript) {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'fixit-google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps script loaded but window.google.maps is not available'));
      }
    };
    script.onerror = (err) => {
      loadPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export default loadGoogleMaps;
