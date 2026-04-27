export type LatLon = { lat: number; lon: number };

export type RouteInfo = {
  etaSeconds: number;
  distanceMeters: number;
  routeEncoded: string;
};

/**
 * Compute driving route using Google Directions REST API.
 * In React Native we use the REST API directly instead of the JS SDK.
 */
export async function computeRoute(
  origin: LatLon,
  destination: LatLon,
  mode: 'driving' | 'walking' | 'bicycling' = 'driving'
): Promise<RouteInfo | null> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lon}&destination=${destination.lat},${destination.lon}&mode=${mode}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];
    const leg = route?.legs?.[0];
    if (!route || !leg) return null;

    return {
      etaSeconds: leg.duration?.value ?? 0,
      distanceMeters: leg.distance?.value ?? 0,
      routeEncoded: route.overview_polyline?.points ?? '',
    };
  } catch (e) {
    console.warn('computeRoute failed:', e);
    return null;
  }
}

/**
 * Decode an encoded polyline string into an array of lat/lng.
 * Pure JS implementation — no Google Maps SDK needed.
 */
export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  if (!encoded) return [];
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

export function haversineMeters(a: LatLon, b: LatLon): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatEta(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} h ${m} min`;
}

export function formatDistance(meters: number | undefined | null): string {
  if (!meters || meters <= 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
