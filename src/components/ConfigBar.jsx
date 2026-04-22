'use client';
import { useRef, useEffect, useState } from 'react';
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
  const { mode, timeOption, wordOption, customText, setMode, setTimeOption, setWordOption, setCustomText, initTest } = useGameStore();
  const textareaRef = useRef(null);
  const [draft, setDraft] = useState(customText);
  const [customReady, setCustomReady] = useState(false);

  // When switching to custom mode, reset ready state
  useEffect(() => {
    if (mode === 'custom') {
      setCustomReady(false);
      setDraft(customText);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [mode]);

  const handleConfirm = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setCustomText(trimmed);
    // initTest reads customText from store; set it first then init
    useGameStore.setState({ customText: trimmed });
    initTest();
    setCustomReady(true);
  };

  const handleCancel = () => {
    setMode('time');
  };

  const handleKeyDown = (e) => {
    // Let Enter+Ctrl or Shift+Enter confirm, plain Enter is newline
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
    // Escape cancels
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      opacity: focused ? 0 : 1,
      pointerEvents: focused ? 'none' : 'auto',
      transition: 'opacity 0.15s ease',
      userSelect: 'none',
      width: '100%',
      maxWidth: '900px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Chip active={mode === 'time'} onClick={() => setMode('time')}>time</Chip>
        <Chip active={mode === 'words'} onClick={() => setMode('words')}>words</Chip>
        <Chip active={mode === 'quote'} onClick={() => setMode('quote')}>quote</Chip>
        <Chip active={mode === 'story'} onClick={() => setMode('story')}>story</Chip>
        <Chip active={mode === 'custom'} onClick={() => setMode('custom')}>custom</Chip>

        {(mode === 'time' || mode === 'words') && (
          <>
            <span style={{ color: 'var(--sub)', fontSize: '0.7rem' }}>/</span>
            {mode === 'time'
              ? [15, 30, 60, 120].map((t) => (
                  <Chip key={t} active={timeOption === t} onClick={() => setTimeOption(t)}>{t}</Chip>
                ))
              : [10, 25, 50, 100].map((w) => (
                  <Chip key={w} active={wordOption === w} onClick={() => setWordOption(w)}>{w}</Chip>
                ))
            }
          </>
        )}
      </div>

      {/* Custom text input panel — only shown when not yet confirmed */}
      {mode === 'custom' && !customReady && (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          userSelect: 'text',
          pointerEvents: 'auto',
        }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="paste or type your text here..."
            rows={4}
            style={{
              width: '100%',
              background: 'var(--sub-alt)',
              border: '1px solid transparent',
              borderRadius: '6px',
              color: 'var(--text)',
              fontFamily: 'var(--font)',
              fontSize: '0.9rem',
              padding: '0.85rem 1rem',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.7,
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sub)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleConfirm}
              disabled={!draft.trim()}
              style={{
                background: 'var(--main)',
                border: 'none',
                borderRadius: '4px',
                color: 'var(--bg)',
                fontFamily: 'var(--font)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.4rem 1rem',
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
                opacity: draft.trim() ? 1 : 0.4,
                transition: 'opacity 0.15s',
              }}
            >
              start test
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                fontFamily: 'var(--font)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0,
                transition: 'color var(--transition)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
            >
              cancel
            </button>
            <span style={{ color: 'var(--sub)', fontSize: '0.65rem', marginLeft: 'auto' }}>
              ctrl+enter to start · esc to cancel
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
