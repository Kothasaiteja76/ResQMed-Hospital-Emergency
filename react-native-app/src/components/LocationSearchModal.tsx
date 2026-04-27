import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Search, MapPin, ChevronLeft, Clock, X } from 'lucide-react-native';
import { getItem, setItem } from '../lib/storage';

export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface Props {
  onSelect: (result: GeoResult) => void;
  onClose: () => void;
}

export const LocationSearchModal = ({ onSelect, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<GeoResult[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem('arogya_recent_searches');
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const handleSelectRecent = (r: GeoResult) => {
    const newRecents = [r, ...recentSearches.filter((x) => x.displayName !== r.displayName)].slice(0, 5);
    setRecentSearches(newRecents);
    setItem('arogya_recent_searches', JSON.stringify(newRecents));
    onSelect(r);
  };

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = await res.json();
        setResults(
          data.map((d: any) => ({
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
            displayName: d.display_name,
          })),
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  return (
    <Modal visible animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            {loading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
            ) : (
              <Search size={16} color="rgba(255,255,255,0.3)" />
            )}
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search for a place"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
          {query.trim().length < 3 && recentSearches.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>RECENT</Text>
              {recentSearches.map((r, i) => (
                <TouchableOpacity key={i} onPress={() => handleSelectRecent(r)} style={styles.resultRow} activeOpacity={0.7}>
                  <Clock size={14} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.resultText} numberOfLines={2}>{r.displayName}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {results.map((r, i) => (
            <TouchableOpacity key={i} onPress={() => handleSelectRecent(r)} style={styles.resultRow} activeOpacity={0.7}>
              <MapPin size={14} color="#60a5fa" />
              <Text style={styles.resultText} numberOfLines={2}>{r.displayName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { padding: 4 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14 },
  results: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginTop: 12, marginBottom: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  resultText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
});
