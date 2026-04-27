'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'typeSnake-splash-dismissed';
const AUTO_CLOSE_MS = 4200;

const FLOAT_WORDS = ['flow', 'focus', 'speed', 'rhythm', 'accuracy', 'zen'];
const TYPING_PHRASE = 'calm fingers, fast thoughts';

export default function SplashScreen({ onDismiss }) {
  const [visible, setVisible] = useState(true);
  const [floatIndex, setFloatIndex] = useState(0);

  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) setVisible(false);
    } catch {
      /* ignore */
    }
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [visible, dismiss]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setFloatIndex((i) => (i + 1) % FLOAT_WORDS.length);
    }, 680);
    return () => clearInterval(id);
  }, [visible]);

  useLayoutEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, dismiss]);

  const titleParts = useMemo(
    () => [
      { text: 'type', main: true },
      { text: 'Snake', main: false },
    ],
    [],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome"
          aria-describedby="splash-hint"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            paddingBottom: 'calc(2rem + 8px)',
            boxSizing: 'border-box',
            background: 'var(--bg)',
            fontFamily: 'var(--font)',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          onClick={dismiss}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.4,
              backgroundImage:
                'linear-gradient(var(--sub-alt) 1px, transparent 1px), linear-gradient(90deg, var(--sub-alt) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              pointerEvents: 'none',
            }}
          />

          <motion.div
            aria-hidden
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.35, 0.55, 0.35],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: 'min(85vw, 420px)',
              height: 'min(85vw, 420px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, color-mix(in srgb, var(--main) 35%, transparent) 0%, transparent 70%)',
              pointerEvents: 'none',
              top: '18%',
              filter: 'blur(2px)',
            }}
          />
          <motion.div
            aria-hidden
            animate={{
              x: [0, 24, 0],
              y: [0, -18, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, color-mix(in srgb, var(--main) 18%, transparent) 0%, transparent 65%)',
              pointerEvents: 'none',
              bottom: '12%',
              right: '8%',
              filter: 'blur(4px)',
            }}
          />

          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 'clamp(0.75rem, 5vw, 2rem)',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              width: '6.5rem',
              textAlign: 'left',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={FLOAT_WORDS[floatIndex]}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 0.9, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--sub)',
                }}
              >
                {FLOAT_WORDS[floatIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'relative',
              textAlign: 'center',
              maxWidth: 'min(92vw, 540px)',
            }}
          >
            <div style={{ marginBottom: '1.25rem', minHeight: 'clamp(3rem, 12vw, 4.25rem)' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2.35rem, 9vw, 3.6rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.05,
                }}
              >
                {titleParts.map(({ text, main }) => (
                  <span key={text} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {text.split('').map((char, i) => (
                      <motion.span
                        key={`${text}-${i}`}
                        initial={{ opacity: 0, y: 26 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.06 + i * 0.045,
                          duration: 0.45,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                          display: 'inline-block',
                          color: main ? 'var(--main)' : 'var(--text)',
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                ))}
              </h1>
            </div>

            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              style={{
                margin: '0 0 1.75rem',
                fontSize: 'clamp(0.95rem, 3vw, 1.12rem)',
                color: 'var(--sub)',
                lineHeight: 1.55,
              }}
            >
              Type. Improve. Flow.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.35 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1rem',
                marginBottom: '1.75rem',
                borderRadius: '8px',
                border: '1px solid var(--sub-alt)',
                background: 'color-mix(in srgb, var(--sub-alt) 45%, transparent)',
                fontSize: 'clamp(0.78rem, 2.2vw, 0.88rem)',
                color: 'var(--text)',
              }}
            >
              <TypingStrip />
              <motion.span
                aria-hidden
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.85, repeat: Infinity }}
                style={{
                  width: '2px',
                  height: '1em',
                  background: 'var(--main)',
                  borderRadius: '1px',
                  flexShrink: 0,
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.35 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                style={{
                  background: 'var(--main)',
                  border: 'none',
                  borderRadius: '999px',
                  color: 'var(--bg)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.78rem 2rem',
                  boxShadow: '0 8px 28px color-mix(in srgb, var(--main) 35%, transparent)',
                }}
              >
                Enter now
              </button>
              <span id="splash-hint" style={{ color: 'var(--sub)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                Auto-continuing in a few seconds · Click or Enter to skip
              </span>
            </motion.div>
          </motion.div>

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '4px',
              background: 'var(--sub-alt)',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: AUTO_CLOSE_MS / 1000, ease: 'linear' }}
              style={{
                height: '100%',
                width: '100%',
                transformOrigin: 'left center',
                background: 'var(--main)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypingStrip() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= TYPING_PHRASE.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 38 + Math.random() * 45);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
      {TYPING_PHRASE.slice(0, shown)}
    </span>
  );
}
