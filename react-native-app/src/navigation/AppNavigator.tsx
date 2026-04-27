import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Route, Shield, User, Siren } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import { LandingPage } from '../screens/public/LandingPage';
import { LoginPage } from '../screens/public/LoginPage';
import { SignupPage } from '../screens/public/SignupPage';
import { DashboardPage } from '../screens/app/DashboardPage';
import { SosPage } from '../screens/app/SosPage';
import { HelpPage } from '../screens/app/HelpPage';
import { ProfilePage } from '../screens/app/ProfilePage';
import { TripsPage } from '../screens/app/TripsPage';
import { SafetyHubPage } from '../screens/app/SafetyHubPage';
import { SafetyCirclePage } from '../screens/app/SafetyCirclePage';
import { MedicalIdPage } from '../screens/app/MedicalIdPage';
import { VaultPage } from '../screens/app/VaultPage';
import { AppointmentsPage } from '../screens/app/AppointmentsPage';
import { CareSpecialtiesPage } from '../screens/app/care/CareSpecialtiesPage';
import { CareBookPage } from '../screens/app/care/CareBookPage';
import { CareHospitalPage } from '../screens/app/care/CareHospitalPage';
import { CareDepartmentPage } from '../screens/app/care/CareDepartmentPage';
import { AdminPanel } from '../screens/admin/AdminPanel';
import { DoctorPortalPage } from '../screens/portals/DoctorPortalPage';
import { HospitalPortalPage } from '../screens/portals/HospitalPortalPage';
import { NotFoundPage } from '../screens/NotFoundPage';
import { CoinsPage } from '../screens/CoinsPage';
import { HelperDashboardPage } from '../screens/HelperDashboardPage';
import { SettingsPage } from '../screens/SettingsPage';
import { CareDoctorsPage } from '../screens/CareDoctorsPage';
import { CareHospitalsPage } from '../screens/CareHospitalsPage';

export type RootStackParamList = {
  Landing: undefined;
  Login: { redirect?: string };
  Signup: { phone?: string; fromLogin?: boolean; redirect?: string; uid?: string };
  MainTabs: undefined;
  SOS: { requestId?: string };
  Care: undefined;
  CareHospital: { hospitalId: string; dept?: string; deptId?: string };
  CareDepartment: { departmentId: string };
  CareBook: { hospitalId: string; doctorId: string; departmentId: string; slot?: string };
  MedicalId: undefined;
  SafetyCircle: undefined;
  Vault: undefined;
  Appointments: undefined;
  Admin: undefined;
  DoctorPortal: undefined;
  HospitalPortal: undefined;
  Help: undefined;
  Coins: undefined;
  HelperDashboard: undefined;
  Settings: undefined;
  CareDoctors: { hospitalId?: string; deptId?: string };
  CareHospitals: { deptId?: string };
  AdminPanel: undefined;
  NotFound: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Trips: undefined;
  SOSPlaceholder: undefined;
  Safety: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const handleSos = () => {
    navigation.navigate('SOS');
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabInner}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          if (route.name === 'SOSPlaceholder') {
            return (
              <View key={route.key} style={styles.tabItem}>
                <TouchableOpacity
                  onPress={handleSos}
                  activeOpacity={0.85}
                  style={styles.sosFab}
                >
                  <View style={styles.sosPing} />
                  <Siren size={24} color="#ffffff" />
                  <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>
              </View>
            );
          }

          const iconMap: Record<string, { icon: any; tint: string; label: string }> = {
            Dashboard: { icon: Home, tint: '#10b981', label: 'Home' },
            Trips: { icon: Route, tint: '#06b6d4', label: 'Trips' },
            Safety: { icon: Shield, tint: '#f59e0b', label: 'Safety' },
            Profile: { icon: User, tint: '#8b5cf6', label: 'Profile' },
          };

          const config = iconMap[route.name] ?? { icon: Home, tint: '#10b981', label: route.name };
          const IconComponent = config.icon;
          const color = isFocused ? config.tint : 'rgba(255,255,255,0.3)';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(route.name);
                }
              }}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <IconComponent size={20} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{config.label}</Text>
              {isFocused && <View style={[styles.tabDot, { backgroundColor: config.tint }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardPage} />
      <Tab.Screen name="Trips" component={TripsPage} />
      <Tab.Screen name="SOSPlaceholder" component={View as any} />
      <Tab.Screen name="Safety" component={SafetyHubPage} />
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0b0f' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Signup" component={SignupPage} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="SOS"
          component={SosPage}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="Help" component={HelpPage} />
        <Stack.Screen name="Care" component={CareSpecialtiesPage} />
        <Stack.Screen name="CareHospital" component={CareHospitalPage} />
        <Stack.Screen name="CareDepartment" component={CareDepartmentPage} />
        <Stack.Screen name="CareHospitals" component={CareHospitalsPage} />
        <Stack.Screen name="CareDoctors" component={CareDoctorsPage} />
        <Stack.Screen name="CareBook" component={CareBookPage} />
        <Stack.Screen name="MedicalId" component={MedicalIdPage} />
        <Stack.Screen name="SafetyCircle" component={SafetyCirclePage} />
        <Stack.Screen name="Vault" component={VaultPage} />
        <Stack.Screen name="Appointments" component={AppointmentsPage} />
        <Stack.Screen name="Admin" component={AdminPanel} />
        <Stack.Screen name="AdminPanel" component={AdminPanel} />
        <Stack.Screen name="Coins" component={CoinsPage} />
        <Stack.Screen name="HelperDashboard" component={HelperDashboardPage} />
        <Stack.Screen name="Settings" component={SettingsPage} />
        <Stack.Screen name="DoctorPortal" component={DoctorPortalPage} />
        <Stack.Screen name="HospitalPortal" component={HospitalPortalPage} />
        <Stack.Screen name="NotFound" component={NotFoundPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(14,15,20,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabInner: {
    flexDirection: 'row',
    height: 56,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  sosFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: '#0e0f14',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'visible',
    // Radial gradient approximation
    backgroundColor: '#dc2626',
  },
  sosPing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 36,
    backgroundColor: 'rgba(239,68,68,0.3)',
    zIndex: -1,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 1,
  },
});
