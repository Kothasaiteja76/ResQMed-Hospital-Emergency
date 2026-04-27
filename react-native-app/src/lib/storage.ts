/**
 * Async wrapper around AsyncStorage to replace localStorage/sessionStorage.
 * Provides both async and sync-cache patterns for compatibility.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for synchronous reads (loaded at startup)
const cache = new Map<string, string>();

export async function initStorage(keys: string[]): Promise<void> {
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [k, v] of pairs) {
    if (v !== null) cache.set(k, v);
  }
}

export function getItemSync(key: string): string | null {
  return cache.get(key) ?? null;
}

export async function getItem(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const val = await AsyncStorage.getItem(key);
  if (val !== null) cache.set(key, val);
  return val;
}

export async function setItem(key: string, value: string): Promise<void> {
  cache.set(key, value);
  await AsyncStorage.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  cache.delete(key);
  await AsyncStorage.removeItem(key);
}

// Session storage replacement (in-memory only, cleared on app restart)
const sessionCache = new Map<string, string>();

export function sessionGetItem(key: string): string | null {
  return sessionCache.get(key) ?? null;
}

export function sessionSetItem(key: string, value: string): void {
  sessionCache.set(key, value);
}

export function sessionRemoveItem(key: string): void {
  sessionCache.delete(key);
}
