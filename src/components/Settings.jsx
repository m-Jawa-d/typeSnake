'use client';
import { X, Smile, Frown, Flame, Zap, Wind, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { previewProfile } from '../hooks/useSound';

const MOODS = [
  { id: 'happy', label: 'happy', Icon: Smile },
  { id: 'sad',   label: 'sad',   Icon: Frown },
  { id: 'anger', label: 'anger', Icon: Flame },
  { id: 'joy',   label: 'joy',   Icon: Zap   },
  { id: 'calm',  label: 'calm',  Icon: Wind  },
];

const LIGHT_THEMES = [
  { id: 'paper',  label: 'paper',  bg: '#f5f0eb', main: '#c0392b', text: '#2c2c2c', sub: '#b0a89e' },
  { id: 'ivory',  label: 'ivory',  bg: '#faf7f2', main: '#9b7d4a', text: '#3a3228', sub: '#9a8f78' },
  { id: 'zinc',   label: 'zinc',   bg: '#f4f4f5', main: '#3f3f46', text: '#18181b', sub: '#a1a1aa' },
  { id: 'rose',   label: 'rose',   bg: '#fff5f5', main: '#e11d48', text: '#1c0a0a', sub: '#d07070' },
  { id: 'sky',    label: 'sky',    bg: '#f0f7ff', main: '#0369a1', text: '#0c1a2e', sub: '#5a9fd4' },
];

const DARK_THEMES = [
  { id: 'carbon',   label: 'carbon',   bg: '#111111', main: '#e2b714', text: '#d1d0c5', sub: '#7e8185' },
  { id: 'mocha',    label: 'mocha',    bg: '#1e1e2e', main: '#cba6f7', text: '#cdd6f4', sub: '#7c7f93' },
  { id: 'forest',   label: 'forest',   bg: '#1a2318', main: '#a3be8c', text: '#d8e4d0', sub: '#6e8a67' },
  { id: 'slate',    label: 'slate',    bg: '#0f172a', main: '#38bdf8', text: '#cbd5e1', sub: '#64748b' },
  { id: 'graphite', label: 'graphite', bg: '#1c1c1e', main: '#ff9f0a', text: '#e5e5ea', sub: '#8e8e93' },
];

function ThemeCard({ t, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={t.label}
      style={{
        background: t.bg,
        border: `2px solid ${active ? t.main : 'transparent'}`,
        borderRadius: '6px',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        outline: 'none',
        transition: 'border-color 0.12s ease',
        width: '100%',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = t.sub; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'transparent'; }}
    >
      {/* accent bar */}
      <div style={{ height: '4px', background: t.main, width: '100%' }} />

      {/* preview body */}
      <div style={{ padding: '0.5rem 0.5rem 0.45rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {/* simulated word lines */}
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          <div style={{ width: '16px', height: '3px', borderRadius: '2px', background: t.text, opacity: 0.9 }} />
          <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: t.sub, opacity: 0.6 }} />
          <div style={{ width: '13px', height: '3px', borderRadius: '2px', background: t.sub, opacity: 0.4 }} />
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: t.sub, opacity: 0.4 }} />
          <div style={{ width: '18px', height: '3px', borderRadius: '2px', background: t.sub, opacity: 0.4 }} />
          <div style={{ width: '8px',  height: '3px', borderRadius: '2px', background: t.sub, opacity: 0.4 }} />
        </div>
        {/* name */}
        <span style={{
          color: t.text,
          fontSize: '0.55rem',
          fontFamily: 'var(--font)',
          letterSpacing: '0.04em',
          marginTop: '0.1rem',
          lineHeight: 1,
        }}>
          {t.label}
        </span>
      </div>
    </button>
  );
}

function ThemeGroup({ label, themes, activeTheme, onSelect }) {
  return (
    <div>
      <p style={{
        color: 'var(--text)',
        opacity: 0.65,
        fontSize: '0.65rem',
        fontFamily: 'var(--font)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
      }}>
        {label}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
        {themes.map((t) => (
          <ThemeCard
            key={t.id}
            t={t}
            active={activeTheme === t.id}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

const LANGUAGES = [
  { id: 'english', label: 'english' },
  { id: 'urdu',    label: 'اردو' },
];

const DIFFICULTIES = [
  { id: 'easy',   label: 'easy' },
  { id: 'normal', label: 'normal' },
  { id: 'hard',   label: 'hard' },
];

const SOUND_PROFILES = [
  { id: 'nkcreams',   label: 'mechanical' },
  { id: 'typewriter', label: 'typewriter' },
  { id: 'click',      label: 'click'      },
  { id: 'beep',       label: 'beep'       },
  { id: 'pop',        label: 'pop'        },
];

export default function Settings({ isOpen, onClose }) {
  const { theme, setTheme, language, setLanguage, mood, setMood, difficulty, setDifficulty, soundEnabled, setSoundEnabled, volume, setVolume, soundProfile, setSoundProfile } = useGameStore();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '480px',
          width: '92%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          border: '1px solid var(--sub-alt)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            color: 'var(--text)',
            fontSize: '0.9rem',
            fontWeight: 700,
            fontFamily: 'var(--font)',
          }}>
            settings
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* divider */}
        <div style={{ height: '1px', background: 'var(--sub-alt)' }} />

        {/* language */}
        <div>
          <p style={{
            color: 'var(--text)',
            opacity: 0.65,
            fontSize: '0.65rem',
            fontFamily: 'var(--font)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            language
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {LANGUAGES.map((lang) => {
              const active = language === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  style={{
                    background: active ? 'var(--main)' : 'var(--sub-alt)',
                    color: active ? 'var(--bg)' : 'var(--text)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease, color 0.12s ease',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.opacity = '1'; }}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* divider */}
        <div style={{ height: '1px', background: 'var(--sub-alt)' }} />

        {/* mood */}
        <div>
          <p style={{
            color: 'var(--text)',
            opacity: 0.65,
            fontSize: '0.65rem',
            fontFamily: 'var(--font)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            mood
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {MOODS.map(({ id, label, Icon }) => {
              const active = mood === id;
              return (
                <button
                  key={id}
                  onClick={() => setMood(id)}
                  title={label}
                  style={{
                    background: active ? 'var(--main)' : 'var(--sub-alt)',
                    color: active ? 'var(--bg)' : 'var(--text)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.7rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'background 0.12s ease, color 0.12s ease',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.opacity = '1'; }}
                >
                  <Icon size={13} strokeWidth={1.5} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* divider */}
        <div style={{ height: '1px', background: 'var(--sub-alt)' }} />

        {/* difficulty */}
        <div>
          <p style={{
            color: 'var(--text)',
            opacity: 0.65,
            fontSize: '0.65rem',
            fontFamily: 'var(--font)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            difficulty
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {DIFFICULTIES.map((diff) => {
              const active = difficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  style={{
                    background: active ? 'var(--main)' : 'var(--sub-alt)',
                    color: active ? 'var(--bg)' : 'var(--text)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease, color 0.12s ease',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.opacity = '1'; }}
                >
                  {diff.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* divider */}
        <div style={{ height: '1px', background: 'var(--sub-alt)' }} />

        {/* sound */}
        <div>
          <p style={{
            color: 'var(--text)',
            opacity: 0.65,
            fontSize: '0.65rem',
            fontFamily: 'var(--font)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            sound
          </p>
          {/* on/off + volume row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'disable sound' : 'enable sound'}
              style={{
                background: soundEnabled ? 'var(--main)' : 'var(--sub-alt)',
                color: soundEnabled ? 'var(--bg)' : 'var(--text)',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.7rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'background 0.12s ease, color 0.12s ease',
                flexShrink: 0,
              }}
            >
              {soundEnabled ? <Volume2 size={13} strokeWidth={1.5} /> : <VolumeX size={13} strokeWidth={1.5} />}
              {soundEnabled ? 'on' : 'off'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              disabled={!soundEnabled}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--main)',
                opacity: soundEnabled ? 1 : 0.3,
                cursor: soundEnabled ? 'pointer' : 'default',
                transition: 'opacity 0.12s ease',
              }}
            />
            <span style={{
              color: 'var(--sub)',
              fontSize: '0.7rem',
              fontFamily: 'var(--font)',
              minWidth: '2.2rem',
              textAlign: 'right',
              opacity: soundEnabled ? 1 : 0.3,
            }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          {/* profile chips */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', opacity: soundEnabled ? 1 : 0.3, transition: 'opacity 0.12s ease' }}>
            {SOUND_PROFILES.map((p) => {
              const active = soundProfile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { if (!soundEnabled) return; setSoundProfile(p.id); previewProfile(p.id, volume); }}
                  style={{
                    background: active ? 'var(--main)' : 'var(--sub-alt)',
                    color: active ? 'var(--bg)' : 'var(--text)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font)',
                    cursor: soundEnabled ? 'pointer' : 'default',
                    transition: 'background 0.12s ease, color 0.12s ease',
                  }}
                  onMouseEnter={(e) => { if (!active && soundEnabled) e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.opacity = '1'; }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* divider */}
        <div style={{ height: '1px', background: 'var(--sub-alt)' }} />

        {/* theme groups */}
        <ThemeGroup label="light" themes={LIGHT_THEMES} activeTheme={theme} onSelect={setTheme} />
        <ThemeGroup label="dark"  themes={DARK_THEMES}  activeTheme={theme} onSelect={setTheme} />
      </motion.div>
    </motion.div>
  );
}
