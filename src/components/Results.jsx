'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import WpmGraph from './WpmGraph';
import KeyboardHeatmap from './KeyboardHeatmap';

function Stat({ label, value, large }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ color: 'var(--sub)', fontSize: '0.7rem', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{
        color: 'var(--text)',
        fontSize: large ? '4.5rem' : '2rem',
        fontWeight: large ? 700 : 400,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      height: '1px',
      background: 'var(--sub-alt)',
      margin: '2.5rem 0',
    }} />
  );
}

export default function Results() {
  const {
    results, restart, history, clearHistory,
    mode, timeOption, wordOption,
    words, wordStates, language,
    streak, personalBests,
  } = useGameStore();
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

  const { wpm, rawWpm, accuracy, correct, incorrect, time, wordsCompleted, isNewPB, wpmTimeline } = results;

  const key = mode === 'time' ? `time_${timeOption}` : mode === 'words' ? `words_${wordOption}` : mode;
  const pb = personalBests[key];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Primary stats row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '5rem',
        flexWrap: 'wrap',
      }}>
        <Stat label="wpm" value={wpm} large />
        <Stat label="accuracy" value={`${accuracy}%`} large />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignSelf: 'flex-end',
          paddingBottom: '0.5rem',
        }}>
          {isNewPB && (
            <div style={{ color: 'var(--main)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              new best
            </div>
          )}
          {streak > 1 && (
            <div style={{ color: 'var(--sub)', fontSize: '0.72rem' }}>
              {streak} day streak
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* Secondary stats row */}
      <div style={{
        display: 'flex',
        gap: '4rem',
        flexWrap: 'wrap',
      }}>
        <Stat label="raw" value={rawWpm} />
        <Stat label="correct / errors" value={`${correct} / ${incorrect}`} />
        <Stat label="time" value={`${time}s`} />
        <Stat label="words" value={wordsCompleted} />
        {pb && <Stat label="best" value={pb.wpm} />}
      </div>

      <Divider />

      {/* Graph + Heatmap side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: wpmTimeline && wpmTimeline.length >= 2 ? '1fr 1fr' : '1fr',
        gap: '4rem',
        alignItems: 'start',
      }}>
        <WpmGraph timeline={wpmTimeline} />
        <KeyboardHeatmap words={words} wordStates={wordStates} language={language} />
      </div>

      <Divider />

      {/* Restart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button
          ref={restartRef}
          onClick={restart}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sub)',
            fontSize: '0.8rem',
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
        <span style={{ color: 'var(--sub)', fontSize: '0.68rem' }}>tab / enter</span>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              fontSize: '0.68rem',
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
