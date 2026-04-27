'use client';

let _muted = false;
const _audioCache = new Map();
let _lastIndex = -1;

let _files = null;
let _filesPromise = null;

function loadFiles() {
  if (_files !== null) return Promise.resolve(_files);
  if (_filesPromise) return _filesPromise;
  if (typeof window === 'undefined') return Promise.resolve([]);
  _filesPromise = fetch('/api/sounds')
    .then((r) => (r.ok ? r.json() : { files: [] }))
    .then((d) => {
      _files = Array.isArray(d.files) ? d.files : [];
      return _files;
    })
    .catch(() => {
      _files = [];
      return _files;
    });
  return _filesPromise;
}

if (typeof window !== 'undefined') {
  loadFiles();
}

function getAudio(src) {
  if (typeof window === 'undefined') return null;
  let a = _audioCache.get(src);
  if (!a) {
    a = new Audio(src);
    a.preload = 'auto';
    a.volume = 0.7;
    _audioCache.set(src, a);
  }
  return a;
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

function pickRandomSrc(files) {
  if (!files || files.length === 0) return null;
  if (files.length === 1) return files[0];
  let idx;
  do { idx = Math.floor(Math.random() * files.length); } while (idx === _lastIndex);
  _lastIndex = idx;
  return files[idx];
}

export async function playSplash() {
  if (isMuted()) return;
  const files = await loadFiles();
  const src = pickRandomSrc(files);
  if (!src) return;
  const audio = getAudio(src);
  if (!audio) return;
  try {
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {}
}
