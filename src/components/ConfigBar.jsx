'use client';
import { useRef, useEffect, useState } from 'react';
import { AlignLeft, LayoutList, Quote, Book, Pencil, Clock, ChevronDown } from 'lucide-react';
import useGameStore from '../store/gameStore';

const MODE_CONFIG = [
  { key: 'time',   label: 'Text',   Icon: AlignLeft },
  { key: 'words',  label: 'Words',  Icon: LayoutList },
  { key: 'quote',  label: 'Quotes', Icon: Quote },
  { key: 'story', label: 'Story', Icon: Book },
  { key: 'custom', label: 'Custom', Icon: Pencil },
];

function TimeDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const label = value >= 60 ? `${value / 60} Min` : `${value} Sec`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--sub-alt)',
          borderRadius: '999px',
          color: 'var(--sub)',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          fontSize: '0.82rem',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          transition: 'color var(--transition)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = 'var(--sub)'; }}
      >
        <Clock size={14} strokeWidth={1.5} />
        {label}
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--bg)',
          border: '1px solid var(--sub-alt)',
          borderRadius: '10px',
          padding: '0.3rem',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          minWidth: '100px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        }}>
          {options.map((opt) => {
            const optLabel = opt >= 60 ? `${opt / 60} Min` : `${opt} Sec`;
            const active = opt === value;
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  background: active ? 'var(--sub-alt)' : 'none',
                  border: 'none',
                  borderRadius: '6px',
                  color: active ? 'var(--text)' : 'var(--sub)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 400,
                  padding: '0.4rem 0.75rem',
                  textAlign: 'left',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--sub-alt)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'none'; }}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ConfigBar({ focused }) {
  const {
    mode, timeOption, wordOption, customText,
    setMode, setTimeOption, setWordOption, setCustomText, initTest,
  } = useGameStore();
  const textareaRef = useRef(null);
  const [draft, setDraft] = useState(customText);
  const [customReady, setCustomReady] = useState(false);

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
    useGameStore.setState({ customText: trimmed });
    initTest();
    setCustomReady(true);
  };

  const handleCancel = () => setMode('time');

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
  };

  return (
    <div style={{
      opacity: focused ? 0 : 1,
      pointerEvents: focused ? 'none' : 'auto',
      transition: 'opacity 0.15s ease',
      userSelect: 'none',
    }}>
      {/* Tab row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

        {/* Pill group containing all mode tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg)',
          border: '1px solid var(--sub-alt)',
          borderRadius: '999px',
          padding: '0.3rem 0.4rem',
          gap: '0.1rem',
        }}>
          {MODE_CONFIG.map(({ key, label, Icon }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  background: active ? 'var(--text)' : 'none',
                  border: 'none',
                  borderRadius: '999px',
                  color: active ? 'var(--bg)' : 'var(--sub)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 400,
                  padding: '0.35rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background var(--transition), color var(--transition)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--sub)'; }}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '18px',
            background: 'var(--sub-alt)',
            margin: '0 0.35rem',
            flexShrink: 0,
          }} />

          {/* Word count options inline (words mode) */}
          {mode === 'words' && [10, 25, 50, 100].map((w) => {
            const active = wordOption === w;
            return (
              <button
                key={w}
                onClick={() => setWordOption(w)}
                style={{
                  background: active ? 'var(--text)' : 'none',
                  border: 'none',
                  borderRadius: '999px',
                  color: active ? 'var(--bg)' : 'var(--sub)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 400,
                  padding: '0.35rem 0.75rem',
                  transition: 'background var(--transition), color var(--transition)',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--sub)'; }}
              >
                {w}
              </button>
            );
          })}
        </div>

        {/* Time dropdown — separate pill, only for time mode */}
        {mode === 'time' && (
          <TimeDropdown
            value={timeOption}
            options={[15, 30, 60, 120]}
            onChange={setTimeOption}
          />
        )}
      </div>

      {/* Custom text panel */}
      {mode === 'custom' && !customReady && (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          userSelect: 'text',
          pointerEvents: 'auto',
          marginTop: '0.75rem',
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
              borderRadius: '8px',
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
                borderRadius: '6px',
                color: 'var(--bg)',
                fontFamily: 'var(--font)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.45rem 1.1rem',
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
                opacity: draft.trim() ? 1 : 0.4,
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
