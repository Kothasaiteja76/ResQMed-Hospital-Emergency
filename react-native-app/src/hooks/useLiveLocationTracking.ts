import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '../auth/AuthProvider';
import { updateUserProfile } from '../data/user';

export function useLiveLocationTracking(enabled: boolean = true) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !enabled) return;

    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted for live tracking');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (position) => {
          const { latitude, longitude } = position.coords;
          updateUserProfile(user.uid, {
            location: { lat: latitude, lon: longitude },
          });
        },
      );
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [user, enabled]);
}
