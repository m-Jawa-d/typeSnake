'use client';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Settings, User, Globe, Info, BarChart3 } from 'lucide-react';
import useGameStore from '../store/gameStore';
import ConfigBar from '../components/ConfigBar';
import TypingTest from '../components/TypingTest';
import Results from '../components/Results';
import SettingsModal from '../components/Settings';
import History from '../components/History';

export default function Home() {
  const { status, initTest, theme } = useGameStore();
  const [focused, setFocused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => { initTest(); }, [initTest]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleFocusChange = useCallback((f) => setFocused(f), []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 3rem',
      maxWidth: '1000px',
      margin: '0 auto',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        opacity: focused ? 0 : 1,
        transition: 'opacity 0.15s ease',
        pointerEvents: focused ? 'none' : 'auto',
      }}>
        <span style={{
          color: 'var(--text)',
          fontSize: '0.95rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}>
          keyflow
        </span>

        <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          {[
            { label: 'history', Icon: BarChart3, onClick: () => setHistoryOpen(true) },
            { label: 'settings', Icon: Settings, onClick: () => setSettingsOpen(true) },
          ].map(({ label, Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              title={label}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                transition: 'color var(--transition)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
      }}>
        <AnimatePresence mode="wait">
          {status === 'finished' ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', maxWidth: '900px' }}
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
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
              }}
            >
              <ConfigBar focused={focused} />
              <TypingTest onFocusChange={handleFocusChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer style={{
        marginTop: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        opacity: focused ? 0 : 1,
        transition: 'opacity 0.15s ease',
        pointerEvents: focused ? 'none' : 'auto',
      }}>
        {[
          { label: 'github', Icon: Globe, href: 'https://github.com/m-Jawa-d/keyflow' },
          { label: 'about', Icon: Info, href: null },
        ].map(({ label, Icon, href }) => (
          <a
            key={label}
            href={href}
            target={href ? '_blank' : undefined}
            rel={href ? 'noopener noreferrer' : undefined}
            title={label}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              fontSize: '0.7rem',
              cursor: href ? 'pointer' : 'default',
              fontFamily: 'var(--font)',
              transition: 'color var(--transition)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              textDecoration: 'none',
              pointerEvents: href ? 'auto' : 'none',
            }}
            onMouseEnter={(e) => { if (href) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { if (href) e.currentTarget.style.color = 'var(--sub)'; }}
          >
            <Icon size={13} strokeWidth={1.5} />
            {label}
          </a>
        ))}
      </footer>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyOpen && (
          <History onClose={() => setHistoryOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
