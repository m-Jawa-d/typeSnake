'use client';

import { useEffect, useRef } from 'react';
import createFluidSimulation from '../lib/fluidSimulation';

const THEME_ACCENTS = {
  paper: '#c0392b',
  ivory: '#8a6e3e',
  zinc: '#3f3f46',
  rose: '#c9184a',
  sky: '#0369a1',
  carbon: '#e2b714',
  mocha: '#cba6f7',
  forest: '#a3be8c',
  slate: '#38bdf8',
  graphite: '#ff9f0a',
};

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

export default function FluidBackground({ theme, colorMode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const simulation = createFluidSimulation(canvas, {
      SPLAT_COLOR: colorMode === 'theme'
        ? hexToRgb(THEME_ACCENTS[theme] || THEME_ACCENTS.paper)
        : null,
    });
    return () => simulation.destroy();
  }, [colorMode, theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
