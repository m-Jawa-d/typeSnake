'use client';
import { X, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

export default function Settings({ isOpen, onClose }) {
  const { theme, setTheme } = useGameStore();

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
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--sub-alt)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{
            color: 'var(--text)',
            fontSize: '1.1rem',
            fontWeight: 700,
            margin: 0,
            fontFamily: 'var(--font)',
          }}>
            settings
          </h2>
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
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            marginBottom: '0.75rem',
          }}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                cursor: 'pointer',
                width: '16px',
                height: '16px',
              }}
            />
            <Sun size={16} strokeWidth={1.5} style={{ color: 'var(--sub)' }} />
            <span style={{
              color: theme === 'light' ? 'var(--text)' : 'var(--sub)',
              fontSize: '0.9rem',
              fontFamily: 'var(--font)',
              transition: 'color var(--transition)',
            }}>
              light theme
            </span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
          }}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                cursor: 'pointer',
                width: '16px',
                height: '16px',
              }}
            />
            <Moon size={16} strokeWidth={1.5} style={{ color: 'var(--sub)' }} />
            <span style={{
              color: theme === 'dark' ? 'var(--text)' : 'var(--sub)',
              fontSize: '0.9rem',
              fontFamily: 'var(--font)',
              transition: 'color var(--transition)',
            }}>
              dark theme
            </span>
          </label>
        </div>
      </motion.div>
    </motion.div>
  );
}
