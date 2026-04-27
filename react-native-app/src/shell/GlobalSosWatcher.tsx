import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../auth/AuthProvider';
import { listenCurrentSosRequest } from '../data/sos';
import { sessionGetItem, sessionSetItem } from '../lib/storage';

/**
 * Watches the current user's SOS state and auto-navigates to the SOS screen
 * when an active request is detected. Mirrors the web version's GlobalSosWatcher.
 */
export const GlobalSosWatcher = () => {
  const { user } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!user?.uid) return;

    return listenCurrentSosRequest(user.uid, (req) => {
      if (req && (req.status === 'countdown' || req.status === 'active')) {
        if (sessionGetItem(`ignore_sos_${req.id}`)) return;

        // Get current route name
        const state = nav.getState();
        const currentRoute = state?.routes?.[state.index]?.name;
        if (currentRoute !== 'SOS' && currentRoute !== 'AdminPanel') {
          nav.navigate('SOS');
        }
      }
    });
  }, [user?.uid, nav]);

  return null;
};
