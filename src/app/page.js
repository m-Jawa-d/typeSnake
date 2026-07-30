'use client';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon, Settings } from 'lucide-react';
import useGameStore from '../store/gameStore';
import useMultiplayerStore from '../store/multiplayerStore';
import { preloadProfile } from '../hooks/useSound';
import ConfigBar from '../components/ConfigBar';
import TypingTest from '../components/TypingTest';
import Results from '../components/Results';
import SettingsModal from '../components/Settings';
import StatsPage from '../components/StatsPage';
import MultiplayerLobby from '../components/MultiplayerLobby';
import RaceView from '../components/RaceView';
import RaceResults from '../components/RaceResults';
import SplashScreen from '../components/SplashScreen';
import FluidBackground from '../components/FluidBackground';

const DARK_THEMES = ['carbon', 'mocha', 'forest', 'slate', 'graphite'];

function updateFavicon(theme) {
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--main')
    .trim();
  const match = accent.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) return;

  const accentRgb = match.slice(1).map((channel) => parseInt(channel, 16));
  const image = new Image();

  image.onload = () => {
    if (document.documentElement.dataset.theme !== theme) return;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const red = pixels.data[index];
      const green = pixels.data[index + 1];
      const blue = pixels.data[index + 2];
      const neutral = Math.max(red, blue);
      const greenTint = Math.max(0, green - neutral);

      if (greenTint > 2) {
        pixels.data[index] = Math.min(255, neutral + (accentRgb[0] * greenTint) / 255);
        pixels.data[index + 1] = Math.min(255, neutral + (accentRgb[1] * greenTint) / 255);
        pixels.data[index + 2] = Math.min(255, neutral + (accentRgb[2] * greenTint) / 255);
      }
    }
    context.putImageData(pixels, 0, 0);

    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = 'image/png';
    favicon.href = canvas.toDataURL('image/png');
  };

  image.src = '/icon.png';
}

export default function Home() {
  const { status, initTest, theme, setTheme, soundProfile, fluidEffectEnabled, fluidColorMode, wpm, accuracy, timeRemaining, incorrectChars, mode, wordOption, wordIndex, words } = useGameStore();
  const { mpStatus, startRace } = useMultiplayerStore();
  const [focused, setFocused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);

  const inMultiplayer = multiplayerOpen || ['lobby', 'countdown', 'racing', 'finished'].includes(mpStatus);
  const showStats = statsOpen;
  const showPractice = !inMultiplayer && !showStats;
  const isDark = DARK_THEMES.includes(theme);

  useEffect(() => { initTest(); }, [initTest]);
  useEffect(() => { preloadProfile(soundProfile); }, [soundProfile]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    updateFavicon(theme);
  }, [theme]);

  const handleFocusChange = useCallback((f) => setFocused(f), []);

  const toggleTheme = () => {
    setTheme(isDark ? 'zinc' : 'carbon');
  };

  const navFade = focused && status === 'active';

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      isolation: 'isolate',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font)',
    }}>
      {fluidEffectEnabled && showPractice && (
        <FluidBackground theme={theme} colorMode={fluidColorMode} />
      )}

      {/* ── Top nav ─────────────────────────────────── */}
      <header style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        borderBottom: '1px solid var(--sub-alt)',
        opacity: navFade ? 0 : 1,
        transition: 'opacity 0.15s ease',
        pointerEvents: navFade ? 'none' : 'auto',
      }}>
        {/* Logo */}
        <span style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '0.01em',
        }}>
          typeSnake
        </span>

        {/* Center nav links */}
        <nav className="header-nav" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {[
            { label: 'Practice', active: !showStats && !inMultiplayer, onClick: () => { setStatsOpen(false); setMultiplayerOpen(false); } },
            { label: 'Stats', active: showStats, onClick: () => setStatsOpen(true) },
            { label: 'Race', active: inMultiplayer, onClick: () => { setMultiplayerOpen(true); setStatsOpen(false); } },
          ].map(({ label, active, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
                color: active ? 'var(--text)' : 'var(--sub)',
                cursor: onClick ? 'pointer' : 'default',
                fontFamily: 'var(--font)',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 400,
                padding: '0.35rem 0',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--sub)'; }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile nav — hidden on desktop via CSS */}
        <nav className="header-mobile-nav" style={{ display: 'none', alignItems: 'center' }}>
          {[
            { label: 'Practice', active: !showStats && !inMultiplayer, onClick: () => { setStatsOpen(false); setMultiplayerOpen(false); } },
            { label: 'Stats', active: showStats, onClick: () => setStatsOpen(true) },
            { label: 'Race', active: inMultiplayer, onClick: () => { setMultiplayerOpen(true); setStatsOpen(false); } },
          ].map(({ label, active, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
                color: active ? 'var(--text)' : 'var(--sub)',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                fontSize: '0.78rem',
                fontWeight: active ? 600 : 400,
                padding: '0.3rem 0',
                transition: 'color var(--transition)',
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            style={{
              background: 'none',
              border: '1px solid var(--sub-alt)',
              borderRadius: '6px',
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
            <Settings size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            style={{
              background: 'none',
              border: '1px solid var(--sub-alt)',
              borderRadius: '6px',
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
            {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────── */}
      <main style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(1.25rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem) 2rem',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        <AnimatePresence mode="wait">
          {showStats ? (
            <StatsPage onBack={() => setStatsOpen(false)} />
          ) : inMultiplayer ? (
            <motion.div
              key="multiplayer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%' }}
            >
              {(mpStatus === 'idle' || mpStatus === 'lobby') && (
                <MultiplayerLobby onBack={() => setMultiplayerOpen(false)} />
              )}
              {(mpStatus === 'countdown' || mpStatus === 'racing') && <RaceView />}
              {mpStatus === 'finished' && <RaceResults onPlayAgain={startRace} />}
            </motion.div>
          ) : status === 'finished' ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%' }}
            >
              <Results />
            </motion.div>
          ) : (
            <motion.div
              key="test"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Hero text */}
              <div style={{
                textAlign: 'center',
                marginBottom: '1.75rem',
                opacity: navFade ? 0 : 1,
                transition: 'opacity 0.15s ease',
                pointerEvents: navFade ? 'none' : 'auto',
              }}>
                <h1 style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: '0 0 0.4rem',
                  letterSpacing: '-0.01em',
                }}>
                  Type. Improve. Flow.
                </h1>
                <p style={{ color: 'var(--sub)', fontSize: '0.875rem', margin: 0 }}>
                  Simple typing practice to help you type faster and better.
                </p>
              </div>

              {/* Config bar — centered */}
              <div className="config-bar-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <ConfigBar focused={focused && status === 'active'} />
              </div>

              {/* Typing card */}
              <div className="typing-card" style={{
                width: '100%',
                border: '1px solid var(--sub-alt)',
                borderRadius: '12px',
                padding: 'clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2.5rem) clamp(1.75rem, 5vw, 3rem)',
                background: 'var(--bg)',
                boxSizing: 'border-box',
              }}>
                <TypingTest onFocusChange={handleFocusChange} />
              </div>

              {/* Stats bar */}
              {(() => {
                const timeDisplay = mode === 'time'
                  ? `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`
                  : mode === 'words'
                  ? `${wordIndex} / ${wordOption}`
                  : `${wordIndex} / ${words.length}`;
                return (
                  <div className="stats-grid" style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    marginTop: '1.5rem',
                    userSelect: 'none',
                  }}>
                    {[
                      { label: 'WPM', value: wpm },
                      { label: 'Accuracy', value: `${accuracy}%` },
                      { label: 'Time', value: timeDisplay },
                      { label: 'Errors', value: incorrectChars },
                    ].map(({ label, value }, i, arr) => (
                      <div key={label} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '1rem 0',
                        borderRight: i < arr.length - 1 ? '1px solid var(--sub-alt)' : 'none',
                      }}>
                        <span style={{ color: 'var(--sub)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          {label}
                        </span>
                        <span style={{
                          color: 'var(--text)',
                          fontSize: '1.75rem',
                          fontWeight: 700,
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                marginTop: '1.75rem',
                opacity: navFade ? 0 : 1,
                transition: 'opacity 0.15s ease',
                pointerEvents: navFade ? 'none' : 'auto',
              }}>
                <button
                  onClick={() => useGameStore.getState().restart()}
                  style={{
                    background: 'var(--main)',
                    border: 'none',
                    borderRadius: '999px',
                    color: 'var(--bg)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.7rem 2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  ▶ Start
                </button>
                <button
                  onClick={() => useGameStore.getState().restart()}
                  style={{
                    background: 'none',
                    border: '1px solid var(--sub-alt)',
                    borderRadius: '999px',
                    color: 'var(--sub)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    padding: '0.7rem 2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'color var(--transition)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
                >
                  ↺ Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Tip footer ──────────────────────────────── */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '1rem 2rem 1.5rem',
        opacity: navFade ? 0 : 1,
        transition: 'opacity 0.15s ease',
        pointerEvents: navFade ? 'none' : 'auto',
      }}>
        <span style={{ color: 'var(--sub)', fontSize: '0.75rem' }}>
          💡 Tip: Focus on accuracy first, speed will follow.
        </span>
      </footer>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>

      <SplashScreen />
    </div>
  );
}
