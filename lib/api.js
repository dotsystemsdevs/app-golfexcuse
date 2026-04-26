const DEVICE_ID_KEY = 'bogey_blamer_device_id';

let cachedDeviceId = null;

export function getDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    cachedDeviceId = id;
    return id;
  } catch {
    return null;
  }
}

export async function voteForExcuse(excuseId, direction) {
  const deviceId = getDeviceId();
  if (!deviceId || !excuseId) return { alreadyVoted: false, error: true };
  if (direction !== 'up' && direction !== 'down') {
    return { alreadyVoted: false, error: true };
  }
  try {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ excuseId, deviceId, direction }),
    });
    if (!res.ok) return { alreadyVoted: false, error: true };
    return await res.json();
  } catch {
    return { alreadyVoted: false, error: true };
  }
}

export async function fetchGeneratedTotal() {
  try {
    const res = await fetch('/api/generated', { cache: 'no-store' });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.total || 0;
  } catch {
    return 0;
  }
}

export async function trackGenerated() {
  try {
    const res = await fetch('/api/generated', { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.total;
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(range = 'all') {
  try {
    const res = await fetch(`/api/leaderboard?range=${encodeURIComponent(range)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}
