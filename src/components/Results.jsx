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

function getBest(history, mode, timeOption, wordOption) {
  const filtered = history.filter((h) => {
    if (h.mode !== mode) return false;
    if (mode === 'time') return h.time === timeOption;
    if (mode === 'words') return h.wordsTotal === wordOption;
    return true;
  });
  if (!filtered.length) return null;
  return filtered.reduce((best, h) => (h.wpm > best.wpm ? h : best), filtered[0]);
}

export default function Results() {
  const { results, restart, history, clearHistory, mode, timeOption, wordOption } = useGameStore();
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

  const { wpm, rawWpm, accuracy, correct, incorrect, time, wordsCompleted } = results;
  const best = getBest(history, mode, timeOption, wordOption);
  const isNewBest = best && best.date === results.date && history.length > 1;

  const recent = history.slice(0, 10);

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
        {isNewBest && (
          <div style={{
            alignSelf: 'flex-end',
            paddingBottom: '0.3rem',
            color: 'var(--main)',
            fontSize: '0.75rem',
          }}>
            new best
          </div>
        )}
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
        {best && (
          <Stat label="best wpm" value={best.wpm} />
        )}
      </div>

      {/* Recent history */}
      {recent.length > 1 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            color: 'var(--sub)',
            fontSize: '0.7rem',
            marginBottom: '0.75rem',
            textTransform: 'lowercase',
          }}>
            last {recent.length} runs
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {recent.map((h, i) => {
              const isCurrent = i === 0;
              const maxWpm = Math.max(...recent.map((r) => r.wpm)) || 1;
              const barHeight = Math.max(4, Math.round((h.wpm / maxWpm) * 48));
              return (
                <div
                  key={h.date}
                  title={`${h.wpm} wpm  ${h.accuracy}%  ${h.mode}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
                >
                  <div style={{
                    fontSize: '0.6rem',
                    color: isCurrent ? 'var(--main)' : 'var(--sub)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {h.wpm}
                  </div>
                  <div style={{
                    width: '20px',
                    height: `${barHeight}px`,
                    borderRadius: '3px',
                    background: isCurrent ? 'var(--main)' : 'var(--sub-alt)',
                    transition: 'background var(--transition)',
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Restart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              fontSize: '0.65rem',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              transition: 'color var(--transition)',
              padding: 0,
              marginLeft: 'auto',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
          >
            clear history
          </button>
        )}
      </div>
    </motion.div>
  );
}
