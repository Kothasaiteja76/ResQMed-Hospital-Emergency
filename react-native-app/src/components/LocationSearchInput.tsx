import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Search, MapPin, X } from 'lucide-react-native';

export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface Props {
  onSelect: (result: GeoResult) => void;
  placeholder?: string;
}

export const LocationSearchInput = ({ onSelect, placeholder = 'Search for a location…' }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setOpen(false);
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
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  const handleSelect = (r: GeoResult) => {
    setQuery(r.displayName.split(',').slice(0, 2).join(','));
    setOpen(false);
    onSelect(r);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Search size={14} color="rgba(255,255,255,0.3)" />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clear}>
            <X size={14} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}
      </View>

      {open && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <TouchableOpacity key={i} onPress={() => handleSelect(r)} style={styles.resultRow} activeOpacity={0.7}>
              <MapPin size={14} color="#60a5fa" />
              <Text style={styles.resultText} numberOfLines={2}>{r.displayName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0e0f14', paddingHorizontal: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 12 },
  dropdown: { position: 'absolute', top: 50, left: 0, right: 0, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#13141a', zIndex: 50, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  resultText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
});
