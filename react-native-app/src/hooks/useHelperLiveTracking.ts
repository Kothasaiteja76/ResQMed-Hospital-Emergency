import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { updateAssignment } from '../data/sos';
import { computeRoute, haversineMeters, type LatLon } from '../data/routing';

const LOC_WRITE_INTERVAL_MS = 4_000;
const MIN_MOVE_METERS = 12;
const ROUTE_RECOMPUTE_INTERVAL_MS = 30_000;
const ROUTE_REDRAW_DEVIATION_M = 80;
const ARRIVAL_RADIUS_M = 35;
const ARRIVAL_CONFIRMATIONS = 2;

export function useHelperLiveTracking(params: {
  assignmentId: string | null;
  victimLocation: LatLon | null;
  active: boolean;
}) {
  const { assignmentId, victimLocation, active } = params;

  const lastWriteAtRef = useRef(0);
  const lastWrittenLocRef = useRef<LatLon | null>(null);
  const lastRouteAtRef = useRef(0);
  const arrivalCountRef = useRef(0);
  const arrivedRef = useRef(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!active || !assignmentId || !victimLocation) return;

    arrivedRef.current = false;
    arrivalCountRef.current = 0;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[HelperTracking] Location permission not granted');
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 3000,
        },
        async (position) => {
          const here: LatLon = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          const now = Date.now();

          const straightMeters = haversineMeters(here, victimLocation);
          if (straightMeters <= ARRIVAL_RADIUS_M) {
            arrivalCountRef.current += 1;
            if (arrivalCountRef.current >= ARRIVAL_CONFIRMATIONS && !arrivedRef.current) {
              arrivedRef.current = true;
              try {
                await updateAssignment(assignmentId, {
                  status: 'reached',
                  arrivedAt: now,
                  helperLocation: { ...here, updatedAt: now },
                  distanceMeters: Math.round(straightMeters),
                  etaSeconds: 0,
                } as any);
              } catch (e) {
                console.warn('[HelperTracking] arrival write failed', e);
              }
              return;
            }
          } else {
            arrivalCountRef.current = 0;
          }

          const sinceLastWrite = now - lastWriteAtRef.current;
          const moved = lastWrittenLocRef.current
            ? haversineMeters(here, lastWrittenLocRef.current)
            : Infinity;

          const shouldWrite =
            sinceLastWrite >= LOC_WRITE_INTERVAL_MS && moved >= MIN_MOVE_METERS;

          if (shouldWrite) {
            lastWriteAtRef.current = now;
            lastWrittenLocRef.current = here;

            updateAssignment(assignmentId, {
              helperLocation: { ...here, updatedAt: now },
              distanceMeters: Math.round(straightMeters),
              status: 'enroute',
            } as any).catch((e) => console.warn('[HelperTracking] loc write failed', e));
          }

          const sinceLastRoute = now - lastRouteAtRef.current;
          const deviation = lastWrittenLocRef.current
            ? haversineMeters(here, lastWrittenLocRef.current)
            : 0;
          const needRoute =
            sinceLastRoute >= ROUTE_RECOMPUTE_INTERVAL_MS ||
            (lastRouteAtRef.current === 0) ||
            deviation >= ROUTE_REDRAW_DEVIATION_M;

          if (needRoute) {
            lastRouteAtRef.current = now;
            try {
              const route = await computeRoute(here, victimLocation, 'driving');
              if (route && !arrivedRef.current) {
                await updateAssignment(assignmentId, {
                  etaSeconds: route.etaSeconds,
                  distanceMeters: route.distanceMeters,
                  routeEncoded: route.routeEncoded,
                  lastRouteAt: now,
                  helperLocation: { ...here, updatedAt: now },
                } as any);
              }
            } catch (e) {
              console.warn('[HelperTracking] Directions call failed', e);
            }
          }
        },
      );
    };

    startTracking();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [active, assignmentId, victimLocation]);
}
