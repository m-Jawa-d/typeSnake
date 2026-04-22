'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

function Stat({ label, value, large }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ color: 'var(--sub)', fontSize: '0.7rem' }}>{label}</div>
      <div style={{
        color: 'var(--text)',
        fontSize: large ? '4rem' : '1.75rem',
        fontWeight: large ? 700 : 400,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

export default function Results() {
  const { results, restart } = useGameStore();
  const restartRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [restart]);

  if (!results) return null;

  const { wpm, rawWpm, accuracy, correct, incorrect, time, wordsCompleted, mode } = results;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Primary stats */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4rem',
        marginBottom: '2.5rem',
      }}>
        <Stat label="wpm" value={wpm} large />
        <Stat label="accuracy" value={`${accuracy}%`} large />
      </div>

      {/* Secondary stats */}
      <div style={{
        display: 'flex',
        gap: '3rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--sub-alt)',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
      }}>
        <Stat label="raw" value={rawWpm} />
        <Stat label="correct / errors" value={`${correct} / ${incorrect}`} />
        <Stat label="time" value={`${time}s`} />
        <Stat label="words" value={wordsCompleted} />
      </div>

      {/* Restart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          ref={restartRef}
          onClick={restart}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sub)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            transition: 'color var(--transition)',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
        >
          try again
        </button>
        <span style={{ color: 'var(--sub)', fontSize: '0.65rem' }}>tab / enter</span>
      </div>
    </motion.div>
  );
}
