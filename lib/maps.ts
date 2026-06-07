// Shared Google Maps loader + helpers.
//
// The Maps JS SDK is client-only (it touches window/document), so everything
// here must run inside a 'use client' component. We use the functional loader
// API (setOptions + importLibrary) from @googlemaps/js-api-loader v2.
//
// NOTE: that package touches `window` at module-evaluation time, which would
// throw during Next.js SSR prerendering of a client page. So we *dynamically*
// import it inside the loader functions (browser-only paths) rather than at the
// top of this module.
//
// Graceful degradation is the contract: if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is
// missing, `mapsConfigured` is false and callers should fall back (plain input /
// hidden map) — never crash.

export const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const mapsConfigured = mapsApiKey.length > 0;

let configured = false;

async function getLoader() {
  const mod = await import("@googlemaps/js-api-loader");
  if (!configured) {
    mod.setOptions({ key: mapsApiKey, v: "weekly" });
    configured = true;
  }
  return mod;
}

/**
 * Loads the Maps + Marker + Geocoding libraries (used by PropertyMap). Returns
 * null if no key is configured or the SDK fails to load, so callers degrade.
 */
export async function loadMapLibs(): Promise<{
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
  geocoding: google.maps.GeocodingLibrary;
} | null> {
  if (!mapsConfigured || typeof window === "undefined") return null;
  try {
    const { importLibrary } = await getLoader();
    const [maps, marker, geocoding] = await Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("geocoding"),
    ]);
    return { maps, marker, geocoding };
  } catch {
    return null;
  }
}

/**
 * Loads the Places library (used by AddressAutocomplete). Returns null on
 * missing key / load failure.
 */
export async function loadPlacesLib(): Promise<google.maps.PlacesLibrary | null> {
  if (!mapsConfigured || typeof window === "undefined") return null;
  try {
    const { importLibrary } = await getLoader();
    return await importLibrary("places");
  } catch {
    return null;
  }
}
