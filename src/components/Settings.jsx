'use client';
import { useEffect } from 'react';
import { X, Smile, Frown, Flame, Zap, Wind, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { previewProfile } from '../hooks/useSound';
import { APP_NAME, APP_VERSION } from '../lib/version';

const MOODS = [
  { id: 'happy', label: 'happy', Icon: Smile },
  { id: 'sad',   label: 'sad',   Icon: Frown },
  { id: 'anger', label: 'anger', Icon: Flame },
  { id: 'joy',   label: 'joy',   Icon: Zap   },
  { id: 'calm',  label: 'calm',  Icon: Wind  },
];

const LIGHT_THEMES = [
  { id: 'paper', label: 'paper', bg: '#f3eee6', main: '#b54a3a', text: '#2a2622', sub: '#8a8178' },
  { id: 'ivory', label: 'ivory', bg: '#f7f3ec', main: '#9a7b4f', text: '#2c2620', sub: '#8b7f6e' },
  { id: 'mist',  label: 'mist',  bg: '#f2f4f6', main: '#4a6670', text: '#1c2428', sub: '#6e7c84' },
];

const DARK_THEMES = [
  { id: 'carbon', label: 'carbon', bg: '#0e0e0e', main: '#d4af37', text: '#d4d2c8', sub: '#6f7276' },
  { id: 'mocha',  label: 'mocha',  bg: '#1a1b26', main: '#b8a0e0', text: '#c8cce0', sub: '#6e7188' },
  { id: 'forest', label: 'forest', bg: '#161e15', main: '#8fbc8a', text: '#d2ddd0', sub: '#6a7d66' },
  { id: 'venom',  label: 'venom',  bg: '#0c1210', main: '#4ecf8a', text: '#d5e0da', sub: '#6a7d74' },
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
      <div className="theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(3.4rem, 1fr))', gap: '0.45rem' }}>
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

const IDLE_GAMES = [
  { id: 'off',    label: 'off'     },
  { id: 'snake',  label: 'snake'   },
  { id: 'pacman', label: 'pac-man' },
  { id: 'matrix', label: 'matrix'  },
  { id: 'random', label: 'random'  },
];

const SOUND_PROFILES = [
  { id: 'nkcreams',   label: 'mechanical' },
  { id: 'typewriter', label: 'typewriter' },
  { id: 'click',      label: 'click'      },
  { id: 'beep',       label: 'beep'       },
  { id: 'pop',        label: 'pop'        },
];

const CARET_STYLES = [
  { id: 'line',      label: 'line' },
  { id: 'block',     label: 'block' },
  { id: 'underline', label: 'underline' },
];

const FONT_SIZES = [
  { id: 'small',  label: 'S' },
  { id: 'medium', label: 'M' },
  { id: 'large',  label: 'L' },
];

const LIVE_STATS = [
  { id: 'wpm',      label: 'wpm',      key: 'showLiveWpm',      setter: 'setShowLiveWpm' },
  { id: 'accuracy', label: 'accuracy', key: 'showLiveAccuracy', setter: 'setShowLiveAccuracy' },
  { id: 'time',     label: 'time',     key: 'showLiveTime',     setter: 'setShowLiveTime' },
  { id: 'errors',   label: 'errors',   key: 'showLiveErrors',   setter: 'setShowLiveErrors' },
];

function SectionLabel({ children }) {
  return (
    <p style={{
      color: 'var(--text)',
      opacity: 0.65,
      fontSize: '0.65rem',
      fontFamily: 'var(--font)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: '0.5rem',
    }}>
      {children}
    </p>
  );
}

function SubLabel({ children }) {
  return (
    <p style={{
      color: 'var(--sub)',
      fontSize: '0.65rem',
      fontFamily: 'var(--font)',
      letterSpacing: '0.04em',
      marginBottom: '0.4rem',
    }}>
      {children}
    </p>
  );
}

function Chip({ active, onClick, children, disabled, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      style={{
        background: active ? 'var(--main)' : 'var(--sub-alt)',
        color: active ? 'var(--bg)' : 'var(--text)',
        border: 'none',
        borderRadius: '4px',
        padding: '0.3rem 0.8rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font)',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.12s ease, color 0.12s ease',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
      }}
      onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.opacity = '0.7'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = disabled ? 0.4 : 1; }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--sub-alt)', flexShrink: 0 }} />;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
};

export default function Settings({ isOpen, onClose }) {
  const {
    theme, setTheme, language, setLanguage, mood, setMood, difficulty, setDifficulty,
    soundEnabled, setSoundEnabled, volume, setVolume, soundProfile, setSoundProfile,
    idleGame, setIdleGame, fluidEffectEnabled, setFluidEffectEnabled, fluidColorMode, setFluidColorMode,
    showLiveWpm, setShowLiveWpm, showLiveAccuracy, setShowLiveAccuracy,
    showLiveTime, setShowLiveTime, showLiveErrors, setShowLiveErrors,
    caretStyle, setCaretStyle, fontSize, setFontSize,
  } = useGameStore();

  const liveStatValues = {
    showLiveWpm, setShowLiveWpm,
    showLiveAccuracy, setShowLiveAccuracy,
    showLiveTime, setShowLiveTime,
    showLiveErrors, setShowLiveErrors,
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        variants={backdropVariants}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          pointerEvents: 'auto',
        }}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="settings"
        variants={drawerVariants}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(400px, 100%)',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--sub-alt)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {/* sticky header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.15rem 1.35rem',
          borderBottom: '1px solid var(--sub-alt)',
          flexShrink: 0,
        }}>
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
            aria-label="close settings"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* scrollable body — most-used first */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.35rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.35rem',
        }}>

        {/* 1. Theme — most frequently changed, live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <SectionLabel>theme</SectionLabel>
          <ThemeGroup label="light" themes={LIGHT_THEMES} activeTheme={theme} onSelect={setTheme} />
          <ThemeGroup label="dark" themes={DARK_THEMES} activeTheme={theme} onSelect={setTheme} />
        </div>

        <Divider />

        {/* 2. Display — font, caret, live stats */}
        <div>
          <SectionLabel>display</SectionLabel>

          <SubLabel>font size</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            {FONT_SIZES.map((f) => (
              <Chip key={f.id} active={fontSize === f.id} onClick={() => setFontSize(f.id)} title={f.id}>
                {f.label}
              </Chip>
            ))}
          </div>

          <SubLabel>caret</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            {CARET_STYLES.map((c) => (
              <Chip key={c.id} active={caretStyle === c.id} onClick={() => setCaretStyle(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>

          <SubLabel>live stats</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {LIVE_STATS.map(({ id, label, key, setter }) => {
              const active = liveStatValues[key];
              return (
                <Chip key={id} active={active} onClick={() => liveStatValues[setter](!active)}>
                  {label}
                </Chip>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 3. Typing — language, mood, difficulty */}
        <div>
          <SectionLabel>typing</SectionLabel>

          <SubLabel>language</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            {LANGUAGES.map((lang) => (
              <Chip key={lang.id} active={language === lang.id} onClick={() => setLanguage(lang.id)}>
                {lang.label}
              </Chip>
            ))}
          </div>

          <SubLabel>mood</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            {MOODS.map(({ id, label, Icon }) => (
              <Chip key={id} active={mood === id} onClick={() => setMood(id)} title={label}>
                <Icon size={13} strokeWidth={1.5} />
                {label}
              </Chip>
            ))}
          </div>

          <SubLabel>difficulty</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {DIFFICULTIES.map((diff) => (
              <Chip key={diff.id} active={difficulty === diff.id} onClick={() => setDifficulty(diff.id)}>
                {diff.label}
              </Chip>
            ))}
          </div>
        </div>

        <Divider />

        {/* 4. Sound */}
        <div>
          <SectionLabel>sound</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Chip
              active={soundEnabled}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'disable sound' : 'enable sound'}
            >
              {soundEnabled ? <Volume2 size={13} strokeWidth={1.5} /> : <VolumeX size={13} strokeWidth={1.5} />}
              {soundEnabled ? 'on' : 'off'}
            </Chip>
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
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            opacity: soundEnabled ? 1 : 0.3,
            transition: 'opacity 0.12s ease',
            pointerEvents: soundEnabled ? 'auto' : 'none',
          }}>
            {SOUND_PROFILES.map((p) => (
              <Chip
                key={p.id}
                active={soundProfile === p.id}
                onClick={() => { setSoundProfile(p.id); previewProfile(p.id, volume); }}
              >
                {p.label}
              </Chip>
            ))}
          </div>
        </div>

        <Divider />

        {/* 5. Extras — least frequently changed */}
        <div>
          <SectionLabel>extras</SectionLabel>

          <SubLabel>liquid background</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.9rem', alignItems: 'center' }}>
            <Chip
              active={fluidEffectEnabled}
              onClick={() => setFluidEffectEnabled(!fluidEffectEnabled)}
            >
              {fluidEffectEnabled ? 'on' : 'off'}
            </Chip>
            {['random', 'theme'].map((colorMode) => (
              <Chip
                key={colorMode}
                active={fluidColorMode === colorMode}
                onClick={() => setFluidColorMode(colorMode)}
                disabled={!fluidEffectEnabled}
              >
                {colorMode}
              </Chip>
            ))}
          </div>

          <SubLabel>idle animation</SubLabel>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {IDLE_GAMES.map((g) => (
              <Chip
                key={g.id}
                active={idleGame === g.id}
                onClick={() => setIdleGame(idleGame === g.id && g.id !== 'off' ? 'off' : g.id)}
              >
                {g.label}
              </Chip>
            ))}
          </div>
        </div>

        </div>

        {/* version footer */}
        <div style={{
          flexShrink: 0,
          padding: '0.85rem 1.35rem',
          borderTop: '1px solid var(--sub-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            color: 'var(--sub)',
            fontSize: '0.65rem',
            fontFamily: 'var(--font)',
            letterSpacing: '0.04em',
          }}>
            {APP_NAME}
          </span>
          <span style={{
            color: 'var(--sub)',
            fontSize: '0.65rem',
            fontFamily: 'var(--font)',
            letterSpacing: '0.06em',
            opacity: 0.85,
          }}>
            v{APP_VERSION}
          </span>
        </div>
      </motion.aside>
    </motion.div>
  );
}
