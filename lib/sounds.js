'use client';

let _ctx = null;
let _muted = false;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      _ctx = new AC();
    } catch {
      return null;
    }
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

export function setMuted(value) {
  _muted = !!value;
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem('bb_muted', _muted ? '1' : '0'); } catch {}
  }
}

export function isMuted() {
  if (typeof window === 'undefined') return _muted;
  try {
    const v = window.localStorage.getItem('bb_muted');
    if (v !== null) _muted = v === '1';
  } catch {}
  return _muted;
}

/**
 * Synthesised golf-ball-into-water splash.
 * Three layers:
 *   1. Low "plop" — sine wave swooping 220Hz → 60Hz (the impact)
 *   2. Sub-thump — sine 90Hz → 35Hz (water mass moving)
 *   3. Bubble fizz — high-passed white noise, decaying (water displacement)
 */
export function playSplash() {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const t0 = ctx.currentTime;

  // 1. PLOP — initial impact
  const plop = ctx.createOscillator();
  const plopGain = ctx.createGain();
  plop.type = 'sine';
  plop.frequency.setValueAtTime(260, t0);
  plop.frequency.exponentialRampToValueAtTime(55, t0 + 0.18);
  plopGain.gain.setValueAtTime(0.0001, t0);
  plopGain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.005);
  plopGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  plop.connect(plopGain).connect(ctx.destination);
  plop.start(t0);
  plop.stop(t0 + 0.28);

  // 2. SUB-THUMP — body of water
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(95, t0);
  sub.frequency.exponentialRampToValueAtTime(38, t0 + 0.25);
  subGain.gain.setValueAtTime(0.0001, t0);
  subGain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
  sub.connect(subGain).connect(ctx.destination);
  sub.start(t0);
  sub.stop(t0 + 0.4);

  // 3. BUBBLE FIZZ — high-pass filtered white noise
  const dur = 0.45;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.pow(1 - i / data.length, 2.4);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(2200, t0 + 0.04);
  hp.frequency.exponentialRampToValueAtTime(900, t0 + 0.4);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t0);
  noiseGain.gain.linearRampToValueAtTime(0.18, t0 + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);

  noise.connect(hp).connect(noiseGain).connect(ctx.destination);
  noise.start(t0 + 0.04);
  noise.stop(t0 + 0.5);
}
