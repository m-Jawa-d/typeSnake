'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import useMultiplayerStore from '../store/multiplayerStore';

const LINES_VISIBLE = 3;

export default function RaceView() {
  const {
    raceWords, wordIndex, wordStates, typedWords,
    mpStatus, countdown, players, clientId, wpm,
    handleRaceKey, leaveRoom, language,
  } = useMultiplayerStore();
  const isUrdu = language === 'urdu';

  const wordsRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [lineHeight, setLineHeight] = useState(0);
  const [scrollLines, setScrollLines] = useState(0);

  const focusInput = useCallback(() => { hiddenInputRef.current?.focus(); }, []);
  useEffect(() => { focusInput(); }, [focusInput]);

  useEffect(() => {
    if (!wordsRef.current) return;
    const firstWord = wordsRef.current.querySelector('[data-word]');
    if (firstWord) setLineHeight(firstWord.getBoundingClientRect().height);
  }, [raceWords]);

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
      left = (isUrdu ? r.right : r.left) - containerRect.left;
      top = r.top - containerRect.top;
    } else {
      const last = letterEls[letterEls.length - 1];
      if (last) {
        const r = last.getBoundingClientRect();
        left = (isUrdu ? r.left : r.right) - containerRect.left;
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
      if (e.key === 'Tab') { e.preventDefault(); return; }
      handleRaceKey(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRaceKey]);

  const wrapperHeight = lineHeight > 0 ? lineHeight * LINES_VISIBLE : 150;
  const scrollOffset = lineHeight > 0 ? scrollLines * lineHeight : 0;

  const sortedPlayers = [...players].sort((a, b) => b.progress - a.progress);

  if (mpStatus === 'countdown') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        minHeight: '200px',
      }}>
        <div style={{ color: 'var(--sub)', fontSize: '0.8rem' }}>race starts in</div>
        <div style={{
          color: 'var(--main)',
          fontSize: '5rem',
          fontWeight: 700,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {countdown}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {/* Player progress bars */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {sortedPlayers.map((p, i) => {
          const isMe = p.id === clientId;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '80px',
                color: isMe ? 'var(--text)' : 'var(--sub)',
                fontSize: '0.7rem',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexShrink: 0,
              }}>
                {i === 0 && p.progress > 0 && <span style={{ color: 'var(--main)', marginRight: '0.25rem' }}>▶</span>}
                {p.name}
              </div>
              <div style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: 'var(--sub-alt)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  borderRadius: '3px',
                  width: `${p.progress}%`,
                  background: isMe ? 'var(--main)' : 'var(--sub)',
                  transition: 'width 0.2s ease',
                }} />
              </div>
              <div style={{
                width: '45px',
                color: 'var(--sub)',
                fontSize: '0.65rem',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}>
                {p.finished ? '✓' : p.wpm > 0 ? `${p.wpm}` : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live WPM */}
      <div style={{
        color: 'var(--sub)',
        fontSize: '1rem',
        marginBottom: '1rem',
        minHeight: '1.5rem',
        fontVariantNumeric: 'tabular-nums',
        opacity: mpStatus === 'racing' ? 1 : 0,
      }}>
        {wpm > 0 ? wpm : ''}
      </div>

      {/* Words */}
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
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: lineHeight ? `${lineHeight}px` : '50px',
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {!isFocused && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 5, backdropFilter: 'blur(4px)',
            color: 'var(--sub)', fontSize: '0.75rem',
          }}>
            click to focus
          </div>
        )}

        <div
          ref={wordsRef}
          dir={isUrdu ? 'rtl' : 'ltr'}
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
            ...(isUrdu && { fontFamily: "var(--font-urdu, 'Noto Nastaliq Urdu', serif)" }),
          }}
        >
          {raceWords.map((word, wi) => {
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
                  fontSize: isUrdu ? '1.6rem' : '1.4rem',
                  lineHeight: isUrdu ? '2.5' : '1.75',
                  borderBottom: hasError ? '1px solid var(--error)' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {word.split('').map((char, li) => {
                  const state = states[li];
                  const color = !state ? 'var(--sub)'
                    : state === 'correct' ? 'var(--text)'
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

        {isFocused && (
          <div style={{
            position: 'absolute',
            top: caretPos.top + 2,
            left: caretPos.left,
            width: '2px',
            height: lineHeight > 0 ? `${lineHeight * 0.75}px` : '1.4rem',
            background: 'var(--main)',
            borderRadius: '1px',
            zIndex: 3,
            pointerEvents: 'none',
            transition: 'left 0.08s ease, top 0.08s ease',
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

      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={leaveRoom}
          style={{
            background: 'none', border: 'none',
            color: 'var(--sub)', fontSize: '0.7rem',
            cursor: 'pointer', fontFamily: 'var(--font)',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sub)'; }}
        >
          leave race
        </button>
      </div>
    </div>
  );
}
