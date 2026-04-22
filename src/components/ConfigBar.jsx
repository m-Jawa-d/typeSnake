'use client';
import useGameStore from '../store/gameStore';

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: active ? 'var(--text)' : 'var(--sub)',
        fontSize: '0.8rem',
        padding: '0.2rem 0.4rem',
        cursor: 'pointer',
        fontFamily: 'var(--font)',
        transition: 'color var(--transition)',
        fontWeight: active ? 700 : 400,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--sub)'; }}
    >
      {children}
    </button>
  );
}

export default function ConfigBar({ focused }) {
  const { mode, timeOption, wordOption, setMode, setTimeOption, setWordOption } = useGameStore();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      opacity: focused ? 0 : 1,
      pointerEvents: focused ? 'none' : 'auto',
      transition: 'opacity 0.15s ease',
      userSelect: 'none',
    }}>
      <Chip active={mode === 'time'} onClick={() => setMode('time')}>time</Chip>
      <Chip active={mode === 'words'} onClick={() => setMode('words')}>words</Chip>

      <span style={{ color: 'var(--sub)', fontSize: '0.7rem' }}>/</span>

      {mode === 'time'
        ? [15, 30, 60, 120].map((t) => (
            <Chip key={t} active={timeOption === t} onClick={() => setTimeOption(t)}>{t}</Chip>
          ))
        : [10, 25, 50, 100].map((w) => (
            <Chip key={w} active={wordOption === w} onClick={() => setWordOption(w)}>{w}</Chip>
          ))
      }
    </div>
  );
}
