'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import useGameStore from '../store/gameStore';

const LINES_VISIBLE = 3;

export default function TypingTest({ onFocusChange }) {
  const {
    words, wordIndex, wordStates, typedWords,
    status, mode, timeRemaining, wordOption,
    handleKey,
  } = useGameStore();

  const wordsRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const tickFn = useGameStore((s) => s.tick);
  const timerRef = useRef(null);

  const [isFocused, setIsFocused] = useState(false);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [lineHeight, setLineHeight] = useState(0);
  const [scrollLines, setScrollLines] = useState(0);

  useEffect(() => {
    onFocusChange?.(isFocused && status === 'active');
  }, [isFocused, status, onFocusChange]);

  useEffect(() => {
    if (status === 'active' && mode === 'time') {
      timerRef.current = setInterval(tickFn, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status, mode, tickFn]);

  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  useEffect(() => { focusInput(); }, [focusInput]);

  useEffect(() => {
    if (!wordsRef.current) return;
    const firstWord = wordsRef.current.querySelector('[data-word]');
    if (firstWord) setLineHeight(firstWord.getBoundingClientRect().height);
  }, [words]);

  useEffect(() => {
    if (!wordsRef.current) return;
    const wordEls = wordsRef.current.querySelectorAll('[data-word]');
    const currentWordEl = wordEls[wordIndex];
    if (!currentWordEl) return;

    const containerRect = wordsRef.current.parentElement.getBoundingClientRect();
    const wordRect = currentWordEl.getBoundingClientRect();
    const letterEls = currentWordEl.querySelectorAll('[data-letter]');
    const typedLen = typedWords[wordIndex]?.length ?? 0;

    let left, top;
    if (typedLen < letterEls.length) {
      const el = letterEls[typedLen];
      const r = el.getBoundingClientRect();
      left = r.left - containerRect.left;
      top = r.top - containerRect.top;
    } else {
      const last = letterEls[letterEls.length - 1];
      if (last) {
        const r = last.getBoundingClientRect();
        left = r.right - containerRect.left;
        top = r.top - containerRect.top;
      } else {
        left = wordRect.left - containerRect.left;
        top = wordRect.top - containerRect.top;
      }
    }

    setCaretPos({ top, left });
    if (lineHeight > 0 && top > lineHeight * 1.8) {
      setScrollLines((prev) => prev + 1);
    }
  }, [wordIndex, typedWords, wordStates, lineHeight]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        useGameStore.getState().restart();
        setScrollLines(0);
        focusInput();
        return;
      }
      handleKey(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey, focusInput]);

  const timerDisplay = mode === 'time' ? timeRemaining : `${wordIndex} / ${wordOption}`;
  const wrapperHeight = lineHeight > 0 ? lineHeight * LINES_VISIBLE : 150;
  const scrollOffset = lineHeight > 0 ? scrollLines * lineHeight : 0;

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {/* Timer */}
      <div style={{
        color: 'var(--sub)',
        fontSize: '1rem',
        fontWeight: 400,
        marginBottom: '1rem',
        minHeight: '1.5rem',
        opacity: status === 'idle' ? 0 : 1,
        transition: 'opacity var(--transition)',
        userSelect: 'none',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {timerDisplay}
      </div>

      {/* Words container */}
      <div
        onClick={focusInput}
        style={{
          position: 'relative',
          height: `${wrapperHeight}px`,
          overflow: 'hidden',
          cursor: 'text',
          userSelect: 'none',
        }}
      >
        {/* Bottom fade */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: lineHeight ? `${lineHeight}px` : '50px',
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Unfocused overlay */}
        {!isFocused && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            backdropFilter: 'blur(4px)',
            color: 'var(--sub)',
            fontSize: '0.75rem',
          }}>
            click to focus
          </div>
        )}

        {/* Scrolling words */}
        <div
          ref={wordsRef}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            transform: `translateY(-${scrollOffset}px)`,
            transition: 'transform 0.15s ease',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            rowGap: '0.5rem',
            columnGap: '0.6em',
          }}
        >
          {words.map((word, wi) => {
            const states = wordStates[wi] ?? [];
            const typed = typedWords[wi] ?? '';
            const isPast = wi < wordIndex;
            const hasError = isPast && (
              states.some((s) => s === 'incorrect' || s === 'extra') ||
              typed.length < word.length
            );

            return (
              <span
                key={wi}
                data-word
                style={{
                  display: 'inline-block',
                  fontSize: '1.4rem',
                  lineHeight: '1.75',
                  borderBottom: hasError ? '1px solid var(--error)' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {word.split('').map((char, li) => {
                  const state = states[li];
                  const color = !state
                    ? 'var(--sub)'
                    : state === 'correct'
                    ? 'var(--text)'
                    : 'var(--error)';
                  return (
                    <span key={li} data-letter style={{ color, transition: 'color 0.05s' }}>
                      {char}
                    </span>
                  );
                })}
                {typed.length > word.length &&
                  typed.slice(word.length).split('').map((char, xi) => (
                    <span key={`x${xi}`} data-letter style={{ color: 'var(--error-extra)' }}>
                      {char}
                    </span>
                  ))}
              </span>
            );
          })}
        </div>

        {/* Caret — thin vertical line */}
        {isFocused && status !== 'finished' && (
          <div style={{
            position: 'absolute',
            top: caretPos.top + 2,
            left: caretPos.left,
            width: '1px',
            height: lineHeight > 0 ? `${lineHeight * 0.75}px` : '1.4rem',
            background: 'var(--text)',
            zIndex: 3,
            pointerEvents: 'none',
            animation: status === 'idle' ? 'none' : 'caretFlash 1s ease infinite',
          }} />
        )}

        <input
          ref={hiddenInputRef}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          readOnly
          tabIndex={0}
        />
      </div>

      {/* Hint */}
      <div style={{
        marginTop: '1rem',
        color: 'var(--sub)',
        fontSize: '0.7rem',
        opacity: status === 'idle' ? 1 : 0,
        transition: 'opacity var(--transition)',
        userSelect: 'none',
      }}>
        tab to reset
      </div>
    </div>
  );
}
