'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import useGameStore from '../store/gameStore';

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getModeLabel(mode, timeOption, wordOption) {
  if (mode === 'time') return `${timeOption}s`;
  if (mode === 'words') return `${wordOption}w`;
  return mode;
}

export default function StatsPage({ onBack }) {
  const { history, clearHistory } = useGameStore();
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filtered = history.filter((h) => {
    if (filterMode === 'all') return true;
    return h.mode === filterMode;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return b.date - a.date;
    if (sortBy === 'wpm') return b.wpm - a.wpm;
    if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
    return 0;
  });

  const modes = ['time', 'words', 'quote', 'story'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ width: '100%' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sub)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--transition)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ color: 'var(--text)', fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>
          stats
        </h1>
      </div>

      {history.length === 0 ? (
        <div style={{ color: 'var(--sub)', textAlign: 'center', padding: '3rem 1rem' }}>
          no tests yet
        </div>
      ) : (
        <>
          {/* Stats summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>total tests</div>
              <div style={{ color: 'var(--text)', fontSize: '2rem', fontWeight: 700 }}>{history.length}</div>
            </div>
            <div>
              <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>avg wpm</div>
              <div style={{ color: 'var(--text)', fontSize: '2rem', fontWeight: 700 }}>
                {Math.round(history.reduce((sum, h) => sum + h.wpm, 0) / history.length)}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>avg accuracy</div>
              <div style={{ color: 'var(--text)', fontSize: '2rem', fontWeight: 700 }}>
                {Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / history.length)}%
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>best wpm</div>
              <div style={{ color: 'var(--main)', fontSize: '2rem', fontWeight: 700 }}>
                {Math.max(...history.map((h) => h.wpm), 0)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['all', ...modes].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: filterMode === mode ? 'var(--main)' : 'var(--sub-alt)',
                    border: 'none',
                    borderRadius: '4px',
                    color: filterMode === mode ? 'var(--bg)' : 'var(--text)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (filterMode !== mode) e.currentTarget.style.background = 'var(--text)';
                    if (filterMode !== mode) e.currentTarget.style.color = 'var(--bg)';
                  }}
                  onMouseLeave={(e) => {
                    if (filterMode !== mode) e.currentTarget.style.background = 'var(--sub-alt)';
                    if (filterMode !== mode) e.currentTarget.style.color = 'var(--text)';
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'var(--sub-alt)',
                border: '1px solid var(--sub-alt)',
                borderRadius: '4px',
                color: 'var(--text)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              <option value="date">newest first</option>
              <option value="wpm">highest wpm</option>
              <option value="accuracy">highest accuracy</option>
            </select>
          </div>

          {/* History table */}
          <div style={{ overflowX: 'auto', marginBottom: '2rem', border: '1px solid var(--sub-alt)', borderRadius: '8px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sub-alt)', background: 'var(--sub-alt)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--sub)', fontWeight: 400, fontSize: '0.65rem' }}>date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--sub)', fontWeight: 400, fontSize: '0.65rem' }}>mode</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--sub)', fontWeight: 400, fontSize: '0.65rem' }}>wpm</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--sub)', fontWeight: 400, fontSize: '0.65rem' }}>accuracy</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--sub)', fontWeight: 400, fontSize: '0.65rem' }}>raw</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--sub)', fontWeight: 400, fontSize: '0.65rem' }}>errors</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--sub)', fontWeight: 400, fontSize: '0.65rem' }}>time</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, idx) => (
                  <tr
                    key={`${entry.date}-${idx}`}
                    style={{
                      borderBottom: '1px solid var(--sub-alt)',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sub-alt)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '0.75rem', color: 'var(--text)' }}>{formatDate(entry.date)}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--sub)' }}>
                      {getModeLabel(entry.mode, entry.time, entry.wordsCompleted)}
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      color: 'var(--main)',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {entry.wpm}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {entry.accuracy}%
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--sub)', fontVariantNumeric: 'tabular-nums' }}>
                      {entry.rawWpm}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: entry.incorrect > 0 ? 'var(--error)' : 'var(--sub)', fontVariantNumeric: 'tabular-nums' }}>
                      {entry.incorrect}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--sub)', fontVariantNumeric: 'tabular-nums' }}>
                      {entry.time}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clear button */}
          <button
            onClick={clearHistory}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--error)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              transition: 'color var(--transition)',
              padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            clear all history
          </button>
        </>
      )}
    </motion.div>
  );
}
