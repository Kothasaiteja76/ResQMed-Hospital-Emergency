import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { Navigation, MapPin, Clock } from 'lucide-react-native';
import { formatEta, formatDistance } from '../data/routing';

export type LatLonLite = { lat: number; lon: number };

type Props = {
  victim: LatLonLite;
  helper?: LatLonLite | null;
  routeEncoded?: string;
  etaSeconds?: number;
  distanceMeters?: number;
  viewerRole: 'victim' | 'helper';
  helperName?: string;
  height?: number;
  showOpenInMaps?: boolean;
};

/**
 * Live tracking "map" for React Native.
 *
 * Since Google Maps JS SDK is not available in React Native, this component
 * displays an ETA/distance card with a "Navigate" button that opens Google Maps.
 *
 * For a full native map with markers and polyline overlay, integrate
 * `react-native-maps` with `MapView`, `Marker`, and `Polyline` components.
 */
export const LiveTrackingMap = ({
  victim,
  helper,
  routeEncoded,
  etaSeconds,
  distanceMeters,
  viewerRole,
  helperName,
  height = 280,
  showOpenInMaps = true,
}: Props) => {
  const [localEta, setLocalEta] = useState<number | undefined>(etaSeconds);

  useEffect(() => setLocalEta(etaSeconds), [etaSeconds]);
  useEffect(() => {
    if (localEta === undefined || localEta <= 0) return;
    const t = setInterval(() => {
      setLocalEta((e) => (e === undefined ? undefined : Math.max(0, e - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [etaSeconds]);

  const openInMaps = () => {
    let url: string;
    if (helper && viewerRole === 'helper') {
      url = `https://www.google.com/maps/dir/?api=1&origin=${helper.lat},${helper.lon}&destination=${victim.lat},${victim.lon}&travelmode=driving`;
    } else {
      url = `https://maps.google.com/?q=${victim.lat},${victim.lon}`;
    }
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <MapPin size={24} color="rgba(255,255,255,0.15)" />
        <Text style={styles.placeholderText}>Live map view</Text>
        <Text style={styles.placeholderSub}>
          {viewerRole === 'helper'
            ? `Navigating to emergency location`
            : helperName ? `${helperName} is on the way` : 'Helper en route'}
        </Text>
      </View>

      {/* ETA card overlay */}
      {(helper || routeEncoded) && (
        <View style={styles.etaCard}>
          <View style={styles.etaStat}>
            <Clock size={14} color="#93c5fd" />
            <View>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaValue}>{formatEta(localEta)}</Text>
            </View>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaStat}>
            <MapPin size={14} color="#6ee7b7" />
            <View>
              <Text style={styles.etaLabel}>Distance</Text>
              <Text style={styles.etaValue}>{formatDistance(distanceMeters)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Open in Maps button */}
      {showOpenInMaps && (
        <TouchableOpacity onPress={openInMaps} style={styles.mapsBtn} activeOpacity={0.8}>
          <Navigation size={14} color="#ffffff" />
          <Text style={styles.mapsBtnText}>
            {viewerRole === 'helper' ? 'Navigate' : 'Open in Maps'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0c1420' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.3)' },
  placeholderSub: { fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  etaCard: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 8 },
  etaStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  etaLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  etaValue: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  etaDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  mapsBtn: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 8 },
  mapsBtnText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
});
