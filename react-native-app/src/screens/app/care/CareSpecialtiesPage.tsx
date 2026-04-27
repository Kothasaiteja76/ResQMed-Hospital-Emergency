import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Stethoscope, ChevronLeft, ChevronRight, Building2, Search } from 'lucide-react-native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useTheme } from '../../../app/ThemeContext';
import { DEPARTMENTS } from '../../../data/hospitals';

const { width } = Dimensions.get('window');

export const CareSpecialtiesPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>HOSPITAL & CARE</Text>
            <Text style={[styles.title, { color: colors.text }]}>Find a Doctor</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>DEPARTMENTS</Text>
        <View style={styles.grid}>
          {DEPARTMENTS.map((dept, i) => (
            <Animated.View key={dept.id} entering={FadeInDown.duration(400).delay(i * 40)}>
              <TouchableOpacity
                onPress={() => nav.navigate('CareDepartment', { departmentId: dept.id })}
                activeOpacity={0.7}
                style={styles.deptCard}
              >
                <Text style={styles.deptEmoji}>{dept.emoji}</Text>
                <Text style={styles.deptName}>{dept.name}</Text>
                <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 10 },
  grid: { gap: 6 },
  deptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  deptEmoji: { fontSize: 24 },
  deptName: { flex: 1, fontSize: 14, fontWeight: '800', color: '#ffffff' },
});
