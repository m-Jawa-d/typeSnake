'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import useGameStore from '../store/gameStore';
import useSound from '../hooks/useSound';

const LINES_VISIBLE = 4;

function SnakeOverlay({ containerRef, wordsRef, active }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const theme = useGameStore((s) => s.theme);

  useEffect(() => {
    if (!active || !containerRef.current || !wordsRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stateRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const box = containerRef.current.getBoundingClientRect();
    canvas.width = box.width;
    canvas.height = box.height;

    const getColors = () => ({
      main: getComputedStyle(document.documentElement).getPropertyValue('--main').trim() || '#e2b714',
      sub: getComputedStyle(document.documentElement).getPropertyValue('--sub').trim() || '#646669',
    });

    const TILE = 14;
    const cols = Math.floor(box.width / TILE);
    const rows = Math.floor(box.height / TILE);
    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);

    // track which words are hidden (eaten)
    const eaten = new Set();
    // pending grow segments to add
    let growPending = 0;
    // snapshot of word elements — rebuilt when words change
    let wordEls = Array.from(wordsRef.current.querySelectorAll('[data-word]'));

    const getTotalWords = () => wordEls.length;
    const allEaten = () => eaten.size >= getTotalWords() && getTotalWords() > 0;

    // watch for word list changes (mood/language/mode switch resets words)
    const wordObserver = new MutationObserver(() => {
      const newEls = Array.from(wordsRef.current.querySelectorAll('[data-word]'));
      if (newEls.length !== wordEls.length || newEls[0] !== wordEls[0]) {
        wordEls = newEls;
        eaten.clear();
        growPending = 0;
        if (stateRef.current) {
          stateRef.current.sleeping = false;
          stateRef.current.snake = initSnake();
          stateRef.current.dir = { x: 1, y: 0 };
        }
      }
    });
    wordObserver.observe(wordsRef.current, { childList: true, subtree: false });

    const initSnake = () => {
      const segs = [];
      for (let i = 0; i < 8; i++) segs.push({ x: centerCol - i, y: centerRow });
      return segs;
    };

    stateRef.current = {
      snake: initSnake(),
      dir: { x: 1, y: 0 },
      lastMove: 0,
      speed: 450,
      sleeping: false,
      sleepStart: null,
    };

    const DIRS = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 },
    ];

    const isSafe = (nx, ny, snake) => {
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false;
      const body = snake.slice(0, snake.length - 1);
      return !body.some((s) => s.x === nx && s.y === ny);
    };

    const getNearestWordTile = (head) => {
      const parentRect = containerRef.current.getBoundingClientRect();
      let best = null, bestDist = Infinity;
      wordEls.forEach((el, idx) => {
        if (eaten.has(idx)) return;
        const r = el.getBoundingClientRect();
        const tx = Math.floor((r.left - parentRect.left + r.width / 2) / TILE);
        const ty = Math.floor((r.top - parentRect.top + r.height / 2) / TILE);
        const dist = Math.abs(tx - head.x) + Math.abs(ty - head.y);
        if (dist < bestDist) { bestDist = dist; best = { x: tx, y: ty }; }
      });
      return best;
    };

    const chooseNextDir = (current, snake) => {
      const head = snake[0];
      const notReverse = DIRS.filter((d) => !(d.x === -current.x && d.y === -current.y));
      const safe = notReverse.filter((d) => isSafe(head.x + d.x, head.y + d.y, snake));
      if (safe.length === 0) return current;

      // 60% of the time steer toward nearest uneaten word
      if (Math.random() < 0.6) {
        const target = getNearestWordTile(head);
        if (target) {
          const dx = target.x - head.x;
          const dy = target.y - head.y;
          // preferred directions toward target, sorted by how much they close the gap
          const preferred = safe.slice().sort((a, b) => {
            const scoreA = a.x * dx + a.y * dy;
            const scoreB = b.x * dx + b.y * dy;
            return scoreB - scoreA;
          });
          if (preferred.length) return preferred[0];
        }
      }

      // otherwise: 50% keep straight, 50% random safe turn (avoids getting stuck on one axis)
      if (Math.random() > 0.5 && safe.includes(current)) return current;
      return safe[Math.floor(Math.random() * safe.length)];
    };

    const checkWordEat = (head) => {
      const parentRect = containerRef.current.getBoundingClientRect();
      const headPx = { x: head.x * TILE, y: head.y * TILE };
      wordEls.forEach((el, idx) => {
        if (eaten.has(idx)) return;
        const r = el.getBoundingClientRect();
        const relLeft = r.left - parentRect.left;
        const relTop = r.top - parentRect.top;
        if (
          headPx.x >= relLeft - TILE &&
          headPx.x <= relLeft + r.width &&
          headPx.y >= relTop - TILE &&
          headPx.y <= relTop + r.height
        ) {
          eaten.add(idx);
          el.style.transition = 'opacity 0.3s';
          el.style.opacity = '0';
          growPending += 1;
        }
      });
    };

    const moveTowardCenter = (snake) => {
      const head = snake[0];
      const dx = centerCol - head.x;
      const dy = centerRow - head.y;
      if (dx === 0 && dy === 0) return null;
      // pick the safe direction that closes the most distance
      const DIRS_LOCAL = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      const candidates = DIRS_LOCAL
        .filter((d) => isSafe(head.x + d.x, head.y + d.y, snake))
        .sort((a, b) => (b.x * dx + b.y * dy) - (a.x * dx + a.y * dy));
      return candidates[0] ?? null;
    };

    const drawSnake = (snake, alpha = 1) => {
      const { main: mainColor } = getColors();
      snake.forEach((seg, i) => {
        const segAlpha = alpha * (1 - (i / snake.length) * 0.6);
        ctx.globalAlpha = segAlpha;
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2, 3);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawEyes = (snake, dir, alpha = 1) => {
      const h = snake[0];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      const ex = h.x * TILE + TILE / 2 + dir.x * 3;
      const ey = h.y * TILE + TILE / 2 + dir.y * 3;
      const off = dir.x !== 0 ? { dx: 0, dy: 3 } : { dx: 3, dy: 0 };
      ctx.beginPath(); ctx.arc(ex + off.dx, ey + off.dy, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex - off.dx, ey - off.dy, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    // build a fixed snake-shaped coil: two horizontal rows connected at ends (like a sleeping S)
    const buildSleepShape = (len) => {
      const segs = [];
      const rowLen = Math.ceil(len / 2);
      const startX = centerCol - Math.floor(rowLen / 2);
      const row1Y = centerRow - 1;
      const row2Y = centerRow + 1;
      // top row left→right
      for (let i = 0; i < rowLen && segs.length < len; i++) segs.push({ x: startX + i, y: row1Y });
      // bottom row right→left
      for (let i = rowLen - 1; i >= 0 && segs.length < len; i--) segs.push({ x: startX + i, y: row2Y });
      return segs;
    };

    const drawSleepingSnake = (snake, now, sleepStart) => {
      const { main: mainColor, sub: subColor } = getColors();
      const elapsed = now - sleepStart;
      const fadeIn = Math.min(elapsed / 500, 1);
      const shape = buildSleepShape(snake.length);

      // gentle breathing scale pulse
      const breathe = 1 + 0.04 * Math.sin(elapsed / 800);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathe, breathe);
      ctx.translate(-cx, -cy);

      shape.forEach((seg, i) => {
        const t = i / shape.length;
        ctx.globalAlpha = fadeIn * (1 - t * 0.45);
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2, 4);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // head = first segment, closed eyes (horizontal dashes)
      const head = shape[0];
      const hx = head.x * TILE + TILE / 2;
      const hy = head.y * TILE + TILE / 2;
      ctx.globalAlpha = fadeIn;
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx - 3.5, hy - 1); ctx.lineTo(hx - 1.5, hy - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 1.5, hy - 1); ctx.lineTo(hx + 3.5, hy - 1); ctx.stroke();

      // floating Z Z z above head — animated
      const zAlpha = fadeIn * (0.5 + 0.5 * Math.sin(elapsed / 700));
      ctx.globalAlpha = zAlpha;
      ctx.fillStyle = subColor;
      ctx.font = 'bold 13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const zBob = Math.sin(elapsed / 900) * 2;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText('z', hx + 10, hy - TILE - 4 + zBob);
      ctx.font = 'bold 14px JetBrains Mono, monospace';
      ctx.fillText('Z', hx + 20, hy - TILE - 12 + zBob);
      ctx.font = 'bold 17px JetBrains Mono, monospace';
      ctx.fillText('Z', hx + 33, hy - TILE - 22 + zBob);

      ctx.globalAlpha = 1;
      ctx.restore();

      // message — solid, clearly readable, below the snake
      const msgAlpha = Math.min(elapsed / 900, 1);
      ctx.globalAlpha = msgAlpha;
      ctx.fillStyle = mainColor;
      ctx.font = '13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('tap to start typing', canvas.width / 2, centerRow * TILE + TILE * 4);
      ctx.globalAlpha = 1;
    };

    const draw = (now) => {
      const s = stateRef.current;
      if (!s) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (s.sleeping) {
        drawSleepingSnake(s.snake, now, s.sleepStart);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // move on interval
      if (now - s.lastMove >= s.speed) {
        s.lastMove = now;

        const head = s.snake[0];

        // if all eaten, navigate toward center to sleep
        if (allEaten()) {
          const toCenter = moveTowardCenter(s.snake);
          if (toCenter) s.dir = toCenter;
          if (head.x === centerCol && head.y === centerRow) {
            s.sleeping = true;
            s.sleepStart = now;
            rafRef.current = requestAnimationFrame(draw);
            return;
          }
        } else {
          s.dir = chooseNextDir(s.dir, s.snake);
        }

        const newHead = { x: head.x + s.dir.x, y: head.y + s.dir.y };
        s.snake.unshift(newHead);

        if (growPending > 0) {
          growPending--;
          // don't pop tail — snake grows
        } else {
          s.snake.pop();
        }

        checkWordEat(newHead);
      }

      drawSnake(s.snake);
      drawEyes(s.snake, s.dir);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      wordObserver.disconnect();
      if (wordsRef.current) {
        wordsRef.current.querySelectorAll('[data-word]').forEach((el) => {
          el.style.transition = 'opacity 0.3s';
          el.style.opacity = '1';
        });
      }
    };
  }, [active, containerRef, wordsRef, theme]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 4,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function TypingTest({ onFocusChange }) {
  const {
    words, wordIndex, wordStates, typedWords,
    status, mode, timeRemaining, wordOption,
    language, handleKey,
  } = useGameStore();

  const wordsRef = useRef(null);
  const containerRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const tickFn = useGameStore((s) => s.tick);
  const timerRef = useRef(null);
  const { playCorrect, playIncorrect, playSpace } = useSound();

  const [isFocused, setIsFocused] = useState(false);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [lineHeight, setLineHeight] = useState(0);
  const [scrollLines, setScrollLines] = useState(0);

  useEffect(() => {
    onFocusChange?.(isFocused && status === 'active');
  }, [isFocused, status, onFocusChange]);

  useEffect(() => {
    if (status === 'active' && mode === 'time' && isFocused) {
      timerRef.current = setInterval(tickFn, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status, mode, tickFn, isFocused]);

  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  useEffect(() => { focusInput(); }, [focusInput]);

  // Focus input when test is initialized (words change)
  useEffect(() => {
    focusInput();
  }, [words, focusInput]);

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

    const isRtl = language === 'urdu';
    let left, top;
    if (typedLen < letterEls.length) {
      const el = letterEls[typedLen];
      const r = el.getBoundingClientRect();
      left = (isRtl ? r.right : r.left) - containerRect.left;
      top = r.top - containerRect.top;
    } else {
      const last = letterEls[letterEls.length - 1];
      if (last) {
        const r = last.getBoundingClientRect();
        left = (isRtl ? r.left : r.right) - containerRect.left;
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
      if (e.key === 'Backspace') {
        handleKey('Backspace');
        return;
      }
      if (e.key.length === 1) return; // handled by onInput
      handleKey(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey, focusInput]);

  const playSoundForKey = useCallback((key) => {
    if (key === ' ') { playSpace(); return; }
    if (key.length !== 1) return;
    const { wordStates: ws, wordIndex: wi, words: w, typedWords: tw } = useGameStore.getState();
    const pos = (tw[wi] ?? '').length - 1;
    if (pos < 0) return;
    const state = ws[wi]?.[pos];
    if (state === 'correct') playCorrect();
    else if (state === 'incorrect' || state === 'extra') playIncorrect();
  }, [playCorrect, playIncorrect, playSpace]);

  const handleMobileInput = useCallback((e) => {
    const input = e.currentTarget;
    const val = input.value;
    if (!val) return;
    for (const char of val) {
      handleKey(char);
      playSoundForKey(char);
    }
    input.value = '';
  }, [handleKey, playSoundForKey]);

  const timerDisplay = mode === 'time'
    ? timeRemaining
    : mode === 'words'
    ? `${wordIndex} / ${wordOption}`
    : `${wordIndex} / ${words.length}`;
  const wrapperHeight = lineHeight > 0 ? lineHeight * LINES_VISIBLE : 150;
  const scrollOffset = lineHeight > 0 ? scrollLines * lineHeight : 0;

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>

      {/* Words container */}
      <div
        ref={containerRef}
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

        {/* Snake overlay when unfocused and idle */}
        <SnakeOverlay
          containerRef={containerRef}
          wordsRef={wordsRef}
          active={!isFocused && status === 'idle'}
        />

        {/* Scrolling words */}
        <div
          ref={wordsRef}
          dir={language === 'urdu' ? 'rtl' : 'ltr'}
          data-language={language}
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
            ...(language === 'urdu' && { fontFamily: "var(--font-urdu, 'Noto Nastaliq Urdu', serif)", fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', lineHeight: '2.5' }),
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
                  fontSize: language === 'urdu' ? 'clamp(1.25rem, 3.5vw, 1.6rem)' : 'clamp(1.1rem, 3vw, 1.4rem)',
                  lineHeight: language === 'urdu' ? '2.5' : '1.75',
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
            width: '2px',
            height: lineHeight > 0 ? `${lineHeight * 0.75}px` : '1.4rem',
            background: 'var(--main)',
            borderRadius: '1px',
            zIndex: 3,
            pointerEvents: 'none',
            transition: 'left 0.08s ease, top 0.08s ease',
            animation: status === 'idle' ? 'caretFlash 1s ease infinite' : 'none',
          }} />
        )}

        <input
          ref={hiddenInputRef}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onInput={handleMobileInput}
          style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          tabIndex={0}
        />
      </div>

    </div>
  );
}
