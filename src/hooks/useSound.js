'use client';
import { useCallback } from 'react';
import useGameStore from '../store/gameStore';

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!window._typingAudioCtx) {
    window._typingAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._typingAudioCtx;
}

// Cache: profile -> { click: AudioBuffer[], error: AudioBuffer[] }
const bufferCache = {};
// Round-robin counters per profile
const counters = {};

// Map profile id -> { click: ['/sounds/...'], error: ['/sounds/...'] }
const PROFILE_FILES = {
  click:      {
    click: ['/sounds/click1/click1_1.wav', '/sounds/click1/click1_2.wav', '/sounds/click1/click1_3.wav'],
    error: ['/sounds/error1/error1_1.wav'],
  },
  beep:       {
    click: ['/sounds/click2/click2_1.wav', '/sounds/click2/click2_2.wav', '/sounds/click2/click2_3.wav'],
    error: ['/sounds/error2/error2_1.wav'],
  },
  pop:        {
    click: ['/sounds/click3/click3_1.wav', '/sounds/click3/click3_2.wav', '/sounds/click3/click3_3.wav'],
    error: ['/sounds/error3/error3_1.wav'],
  },
  nkcreams:   {
    click: ['/sounds/click4/click4_1.wav', '/sounds/click4/click4_2.wav', '/sounds/click4/click4_3.wav',
            '/sounds/click4/click4_4.wav', '/sounds/click4/click4_5.wav', '/sounds/click4/click4_6.wav'],
    error: ['/sounds/error4/error4_1.wav', '/sounds/error4/error4_2.wav'],
  },
  typewriter: {
    click: ['/sounds/click5/click5_1.wav', '/sounds/click5/click5_2.wav', '/sounds/click5/click5_3.wav'],
    error: ['/sounds/error1/error1_1.wav'],
  },
};

async function loadBuffers(profile) {
  if (bufferCache[profile]) return bufferCache[profile];
  const ctx = getCtx();
  if (!ctx) return null;

  const files = PROFILE_FILES[profile];
  if (!files) return null;

  const decode = async (url) => {
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      return await ctx.decodeAudioData(arr);
    } catch {
      return null;
    }
  };

  const [clickBufs, errorBufs] = await Promise.all([
    Promise.all(files.click.map(decode)),
    Promise.all(files.error.map(decode)),
  ]);

  bufferCache[profile] = {
    click: clickBufs.filter(Boolean),
    error: errorBufs.filter(Boolean),
  };
  counters[profile] = { click: 0, error: 0 };
  return bufferCache[profile];
}

function playBuffer(buf, ctx, volume) {
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime);
}

async function trigger(profile, volume, isError) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();

  const bufs = await loadBuffers(profile);
  if (!bufs) return;

  const key = isError ? 'error' : 'click';
  const pool = bufs[key];
  if (!pool || pool.length === 0) return;

  const idx = counters[profile][key] % pool.length;
  counters[profile][key]++;

  playBuffer(pool[idx], ctx, volume);
}

// Pre-load a profile in the background (call on profile select / page load)
export function preloadProfile(profile) {
  if (typeof window === 'undefined') return;
  loadBuffers(profile);
}

// Play a single preview click for a profile at the given volume
export function previewProfile(profile, volume) {
  if (typeof window === 'undefined') return;
  trigger(profile, volume, false);
}

export default function useSound() {
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const volume       = useGameStore((s) => s.volume);
  const soundProfile = useGameStore((s) => s.soundProfile);

  const playCorrect = useCallback(() => {
    if (!soundEnabled) return;
    trigger(soundProfile, volume, false);
  }, [soundEnabled, volume, soundProfile]);

  const playIncorrect = useCallback(() => {
    if (!soundEnabled) return;
    trigger(soundProfile, volume, true);
  }, [soundEnabled, volume, soundProfile]);

  const playSpace = useCallback(() => {
    if (!soundEnabled) return;
    trigger(soundProfile, volume * 0.75, false);
  }, [soundEnabled, volume, soundProfile]);

  return { playCorrect, playIncorrect, playSpace };
}
