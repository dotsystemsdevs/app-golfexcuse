import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const BASE_URL = 'https://excusecaddie.xyz';
const DEVICE_ID_KEY = 'excuse_caddie_device_id';

let cachedDeviceId = null;

export async function getDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = Crypto.randomUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    cachedDeviceId = id;
    return id;
  } catch {
    return Crypto.randomUUID();
  }
}

export async function fetchGeneratedTotal() {
  try {
    const res = await fetch(`${BASE_URL}/api/generated`, { cache: 'no-store' });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.total || 0;
  } catch {
    return 0;
  }
}

export async function trackGenerated() {
  try {
    const res = await fetch(`${BASE_URL}/api/generated`, { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.total;
  } catch {
    return null;
  }
}

export async function voteForExcuse(excuseId, direction) {
  const deviceId = await getDeviceId();
  if (!deviceId || !excuseId) return { error: true };
  if (direction !== 'up' && direction !== 'down') return { error: true };
  try {
    const res = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ excuseId, deviceId, direction }),
    });
    if (!res.ok) return { error: true };
    return await res.json();
  } catch {
    return { error: true };
  }
}

export async function fetchLeaderboard(range = 'all') {
  try {
    const res = await fetch(`${BASE_URL}/api/leaderboard?range=${encodeURIComponent(range)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}
