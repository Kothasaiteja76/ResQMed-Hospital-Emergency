// In React Native, use environment variables via a config or .env approach.
// For Expo, you can use `expo-constants` or `react-native-dotenv`.
// Fallback: hardcode or use app.json extra field.

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
const FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '';

export const isFirebaseConfigured =
  Boolean(FIREBASE_API_KEY) &&
  Boolean(FIREBASE_PROJECT_ID) &&
  Boolean(FIREBASE_APP_ID);

export const isDemoMode = !isFirebaseConfigured;

export const functionsOrigin =
  (process.env.EXPO_PUBLIC_FUNCTIONS_ORIGIN as string | undefined) || undefined;
