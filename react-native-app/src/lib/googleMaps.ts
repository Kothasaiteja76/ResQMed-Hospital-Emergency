/**
 * Google Maps helpers for React Native.
 *
 * In React Native we can't use the Google Maps JS SDK.
 * Instead we use Google Maps REST APIs (Places, Geocoding, Directions).
 * The API key is read from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
 */

const getApiKey = (): string | undefined =>
  (globalThis as any).process?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  undefined;

export interface PlacePrediction {
  placeId: string;
  displayName: string;
}

export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

/**
 * Autocomplete predictions via the Places API (New).
 * Falls back to Nominatim if no API key is set.
 */
export async function getPlacePredictions(input: string): Promise<PlacePrediction[]> {
  const key = getApiKey();
  if (!key) {
    // Fallback: Nominatim
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json();
    return (data as any[]).map((d: any) => ({
      placeId: String(d.place_id),
      displayName: d.display_name,
    }));
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${key}`,
  );
  const json = await res.json();
  if (json.status !== 'OK' || !json.predictions) return [];
  return json.predictions.map((p: any) => ({
    placeId: p.place_id,
    displayName: p.description,
  }));
}

/**
 * Geocode a place_id to lat/lon.
 * Falls back to Nominatim reverse.
 */
export async function geocodePlaceId(placeId: string): Promise<GeoResult | null> {
  const key = getApiKey();
  if (!key) return null;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(placeId)}&key=${key}`,
  );
  const json = await res.json();
  if (json.status !== 'OK' || !json.results?.length) return null;

  const loc = json.results[0].geometry.location;
  return {
    lat: loc.lat,
    lon: loc.lng,
    displayName: json.results[0].formatted_address ?? '',
  };
}

/**
 * Geocode a lat/lon via Nominatim (free, no API key needed).
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const json = await res.json();
    return json.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}
