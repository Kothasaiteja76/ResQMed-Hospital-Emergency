import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { getItem, setItem, removeItem, getItemSync } from '../lib/storage';

export type LocationSource = 'gps' | 'manual' | 'hardware' | 'lastKnown';

export interface SavedLocation {
  lat: number;
  lon: number;
  displayName?: string;
  source: LocationSource;
  timestamp: number;
}

const DEFAULT_STORAGE_KEY = 'arogya_raksha_location';
export const GPS_GRANTED_KEY = 'arogya_gps_ever_granted';

export const hasGrantedGPS = () => getItemSync(GPS_GRANTED_KEY) === 'true';

export const isLocationFresh = (timestamp: number) => {
  return (Date.now() - timestamp) <= 8 * 60 * 1000;
};

export const useSharedLocation = (storageKey = DEFAULT_STORAGE_KEY) => {
  const [currentLocation, setCurrentLocation] = useState<SavedLocation | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'pending' | 'ok' | 'denied'>('idle');

  const loadLoc = useCallback(async () => {
    try {
      const stored = await getItem(storageKey);
      if (stored) {
        setCurrentLocation(JSON.parse(stored) as SavedLocation);
      } else {
        setCurrentLocation(null);
      }
    } catch {
      // Ignored
    }
  }, [storageKey]);

  useEffect(() => {
    loadLoc();
    const interval = setInterval(loadLoc, 3000);
    return () => clearInterval(interval);
  }, [loadLoc]);

  const saveLocation = useCallback(async (loc: Omit<SavedLocation, 'timestamp'>) => {
    const fullLoc: SavedLocation = { ...loc, timestamp: Date.now() };
    setCurrentLocation(fullLoc);
    await setItem(storageKey, JSON.stringify(fullLoc));
    setLocStatus('ok');
    if (loc.source === 'gps') {
      await setItem(GPS_GRANTED_KEY, 'true');
    }
    return fullLoc;
  }, [storageKey]);

  const requestGPS = useCallback(async (options?: { silent?: boolean; showAlert?: boolean }): Promise<SavedLocation | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocStatus('denied');
        if (!options?.silent) {
          // Alert is handled by the calling component in RN
        }
        return null;
      }
    } catch {
      if (!options?.silent) setLocStatus('denied');
      return null;
    }

    if (!options?.silent) setLocStatus('pending');

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 12000,
      });
      const loc = await saveLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        source: 'gps',
        displayName: 'Current Location',
      });
      return loc;
    } catch (err: any) {
      if (!options?.silent) {
        if (err.code === 'E_LOCATION_SETTINGS_UNSATISFIED') setLocStatus('denied');
        else setLocStatus('idle');
      }
      return null;
    }
  }, [saveLocation]);

  const clearLocation = useCallback(async () => {
    setCurrentLocation(null);
    setLocStatus('idle');
    await removeItem(storageKey);
  }, [storageKey]);

  return {
    currentLocation,
    locStatus,
    setLocStatus,
    saveLocation,
    requestGPS,
    clearLocation,
  };
};
