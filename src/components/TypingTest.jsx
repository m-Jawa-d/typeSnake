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

function PacManOverlay({ containerRef, wordsRef, active }) {
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
    const PAC_R = Math.round(TILE * 0.85);  // ~12px — clearly visible
    const GHOST_R = Math.round(TILE * 0.78); // ~11px — clearly visible
    const cols = Math.floor(box.width / TILE);
    const rows = Math.floor(box.height / TILE);
    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);

    const eaten = new Set();

    // Only consider words whose center is inside the canvas bounds —
    // in time mode there are 80 words but only 4 lines are visible.
    const getVisibleWordEls = () => {
      if (!containerRef.current) return [];
      const parentRect = containerRef.current.getBoundingClientRect();
      return Array.from(wordsRef.current.querySelectorAll('[data-word]')).filter((el) => {
        const r = el.getBoundingClientRect();
        const ty = r.top - parentRect.top;
        return ty >= -r.height && ty < box.height;
      });
    };

    let wordEls = getVisibleWordEls();

    const initDots = () => {
      const d = new Set();
      for (let c = 0; c < cols; c += 2) {
        for (let r = 0; r < rows; r += 2) d.add(`${c},${r}`);
      }
      return d;
    };
    let dots = initDots();

    const GHOST_DELAY = 14;
    let posHistory = Array(GHOST_DELAY * 2).fill({ x: 2, y: centerRow });

    const wordObserver = new MutationObserver(() => {
      const newEls = getVisibleWordEls();
      if (newEls.length !== wordEls.length || newEls[0] !== wordEls[0]) {
        wordEls = newEls;
        eaten.clear();
        dots = initDots();
        const px = stateRef.current?.pac.x ?? 2;
        const py = stateRef.current?.pac.y ?? centerRow;
        posHistory = Array(GHOST_DELAY * 2).fill({ x: px, y: py });
        if (stateRef.current) {
          stateRef.current.sleeping = false;
          stateRef.current.pac = { x: 2, y: centerRow };
          stateRef.current.dir = { x: 1, y: 0 };
        }
      }
    });
    wordObserver.observe(wordsRef.current, { childList: true, subtree: false });

    stateRef.current = {
      pac: { x: 2, y: centerRow },
      dir: { x: 1, y: 0 },
      lastMove: 0,
      speed: 110,
      mouth: 0,
      mouthDir: 1,
      sleeping: false,
      sleepStart: null,
    };

    const DIRS = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 },
    ];

    const isSafe = (nx, ny) => nx >= 0 && nx < cols && ny >= 0 && ny < rows;
    const allEaten = () => eaten.size >= wordEls.length && wordEls.length > 0;

    const getNearestWordTile = (head) => {
      if (!containerRef.current) return null;
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

    const chooseDir = (cur, pac) => {
      const notReverse = DIRS.filter((d) => !(d.x === -cur.x && d.y === -cur.y));
      const safe = notReverse.filter((d) => isSafe(pac.x + d.x, pac.y + d.y));
      if (!safe.length) return cur;
      if (Math.random() < 0.65) {
        const target = getNearestWordTile(pac);
        if (target) {
          const dx = target.x - pac.x, dy = target.y - pac.y;
          const sorted = safe.slice().sort((a, b) => (b.x * dx + b.y * dy) - (a.x * dx + a.y * dy));
          if (sorted[0]) return sorted[0];
        }
      }
      if (safe.some((d) => d.x === cur.x && d.y === cur.y) && Math.random() > 0.4) return cur;
      return safe[Math.floor(Math.random() * safe.length)];
    };

    const checkEat = (pos) => {
      if (!containerRef.current) return;
      const parentRect = containerRef.current.getBoundingClientRect();
      const px = pos.x * TILE, py = pos.y * TILE;
      wordEls.forEach((el, idx) => {
        if (eaten.has(idx)) return;
        const r = el.getBoundingClientRect();
        const rl = r.left - parentRect.left, rt = r.top - parentRect.top;
        if (px >= rl - TILE && px <= rl + r.width && py >= rt - TILE && py <= rt + r.height) {
          eaten.add(idx);
          el.style.transition = 'opacity 0.3s';
          el.style.opacity = '0';
        }
      });
      dots.delete(`${pos.x},${pos.y}`);
    };

    const moveToCenter = (pac) => {
      const dx = centerCol - pac.x, dy = centerRow - pac.y;
      if (!dx && !dy) return null;
      const cands = DIRS
        .filter((d) => isSafe(pac.x + d.x, pac.y + d.y))
        .sort((a, b) => (b.x * dx + b.y * dy) - (a.x * dx + a.y * dy));
      return cands[0] ?? null;
    };

    const drawDots = () => {
      const { sub } = getColors();
      ctx.fillStyle = sub;
      ctx.globalAlpha = 0.3;
      dots.forEach((key) => {
        const [c, r] = key.split(',').map(Number);
        ctx.beginPath();
        ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawPac = (pos, dir, mouth) => {
      const { main } = getColors();
      const cx = pos.x * TILE + TILE / 2;
      const cy = pos.y * TILE + TILE / 2;
      const angle = dir.x === 1 ? 0 : dir.x === -1 ? Math.PI : dir.y === 1 ? Math.PI / 2 : -Math.PI / 2;
      const m = mouth * 0.38;
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, PAC_R, angle + m, angle + Math.PI * 2 - m);
      ctx.closePath();
      ctx.fill();
    };

    const drawGhost = (pos) => {
      const { sub } = getColors();
      const cx = pos.x * TILE + TILE / 2;
      const cy = pos.y * TILE + TILE / 2;
      const r = GHOST_R;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = sub;
      ctx.beginPath();
      // top semicircle (counterclockwise = upward arc)
      ctx.arc(cx, cy - 1, r, Math.PI, 0, true);
      // right side down
      ctx.lineTo(cx + r, cy + r);
      // wavy bottom with 2 bumps going left
      ctx.lineTo(cx + r * 0.65, cy + r - 4);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r * 0.65, cy + r - 4);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
      ctx.fill();
      // eyes — scaled to ghost size
      const eyeR = r * 0.28;
      const pupilR = eyeR * 0.55;
      const eyeOff = r * 0.33;
      const eyeY = cy - r * 0.15;
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(cx - eyeOff, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOff, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(20,20,20,0.9)';
      ctx.beginPath(); ctx.arc(cx - eyeOff + pupilR, eyeY + pupilR * 0.5, pupilR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOff + pupilR, eyeY + pupilR * 0.5, pupilR, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawSleeping = (now, sleepStart) => {
      const { main, sub } = getColors();
      const elapsed = now - sleepStart;
      const fadeIn = Math.min(elapsed / 500, 1);
      const cx = centerCol * TILE + TILE / 2;
      const cy = centerRow * TILE + TILE / 2;
      const r = PAC_R;
      const breathe = 1 + 0.04 * Math.sin(elapsed / 800);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathe, breathe);
      ctx.translate(-cx, -cy);

      ctx.globalAlpha = fadeIn;
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, 0.12, Math.PI * 2 - 0.12);
      ctx.closePath();
      ctx.fill();

      // closed eyes
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 4, cy - 1); ctx.lineTo(cx - 2, cy - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 2, cy - 1); ctx.lineTo(cx + 4, cy - 1); ctx.stroke();

      // floating ZZZ
      const zAlpha = fadeIn * (0.5 + 0.5 * Math.sin(elapsed / 700));
      const zBob = Math.sin(elapsed / 900) * 2;
      ctx.globalAlpha = zAlpha;
      ctx.fillStyle = sub;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText('z', cx + 10, cy - TILE - 4 + zBob);
      ctx.font = 'bold 14px JetBrains Mono, monospace';
      ctx.fillText('Z', cx + 20, cy - TILE - 12 + zBob);
      ctx.font = 'bold 17px JetBrains Mono, monospace';
      ctx.fillText('Z', cx + 33, cy - TILE - 22 + zBob);
      ctx.globalAlpha = 1;
      ctx.restore();

      const msgAlpha = Math.min(elapsed / 900, 1);
      ctx.globalAlpha = msgAlpha;
      ctx.fillStyle = main;
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
        drawDots();
        drawSleeping(now, s.sleepStart);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // animate mouth open/close
      s.mouth += 0.15 * s.mouthDir;
      if (s.mouth >= 1) { s.mouth = 1; s.mouthDir = -1; }
      if (s.mouth <= 0) { s.mouth = 0; s.mouthDir = 1; }

      if (now - s.lastMove >= s.speed) {
        s.lastMove = now;
        const head = s.pac;
        if (allEaten()) {
          const d = moveToCenter(s.pac);
          if (d) s.dir = d;
          if (head.x === centerCol && head.y === centerRow) {
            s.sleeping = true;
            s.sleepStart = now;
            rafRef.current = requestAnimationFrame(draw);
            return;
          }
        } else {
          s.dir = chooseDir(s.dir, s.pac);
        }
        s.pac = { x: head.x + s.dir.x, y: head.y + s.dir.y };
        posHistory.push({ ...s.pac });
        if (posHistory.length > GHOST_DELAY * 3) posHistory.shift();
        checkEat(s.pac);
      }

      drawDots();

      if (posHistory.length > GHOST_DELAY) {
        drawGhost(posHistory[Math.max(0, posHistory.length - 1 - GHOST_DELAY)]);
      }

      drawPac(s.pac, s.dir, s.mouth);
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
      style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}
    />
  );
}

function MatrixRainOverlay({ containerRef, active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const theme = useGameStore((s) => s.theme);

  useEffect(() => {
    if (!active || !containerRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const box = containerRef.current.getBoundingClientRect();
    canvas.width = box.width;
    canvas.height = box.height;

    const getColors = () => ({
      main: getComputedStyle(document.documentElement).getPropertyValue('--main').trim() || '#e2b714',
    });

    const FONT_SIZE = 14;
    const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789@#$%&*<>{}[]!?';
    const cols = Math.floor(box.width / FONT_SIZE);

    const hexToRgb = (color) => {
      const hex = color.replace('#', '').trim();
      if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
      if (/^[0-9a-fA-F]{3}$/.test(hex)) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      }
      return { r: 226, g: 183, b: 20 };
    };

    const streams = Array.from({ length: cols }, () => ({
      y: -FONT_SIZE * (2 + Math.random() * Math.floor(box.height / FONT_SIZE)),
      speed: 0.6 + Math.random() * 1.4,
      length: 6 + Math.floor(Math.random() * 14),
      chars: Array.from({ length: 20 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
      nextChange: Math.random() * 300,
    }));

    let lastTime = 0;

    const draw = (now) => {
      const delta = Math.min(now - lastTime, 50);
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { main } = getColors();
      const rgb = hexToRgb(main);
      ctx.font = `${FONT_SIZE}px JetBrains Mono, monospace`;
      ctx.textBaseline = 'top';

      streams.forEach((s, col) => {
        // Randomly mutate one character in this stream
        if (now > s.nextChange) {
          const idx = Math.floor(Math.random() * s.chars.length);
          s.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
          s.nextChange = now + 60 + Math.random() * 180;
        }

        for (let i = 0; i < s.length; i++) {
          const charY = s.y - i * FONT_SIZE;
          if (charY < -FONT_SIZE || charY > box.height) continue;

          const char = s.chars[i % s.chars.length];
          const t = 1 - i / s.length; // 1 at head → 0 at tail

          if (i === 0) {
            // Head: bright highlight
            const hr = Math.min(rgb.r + 110, 255);
            const hg = Math.min(rgb.g + 110, 255);
            const hb = Math.min(rgb.b + 110, 255);
            ctx.fillStyle = `rgba(${hr},${hg},${hb},0.95)`;
          } else {
            ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${(t * 0.72).toFixed(2)})`;
          }
          ctx.fillText(char, col * FONT_SIZE, charY);
        }

        s.y += s.speed * delta * 0.075;

        if (s.y - s.length * FONT_SIZE > box.height) {
          s.y = -FONT_SIZE * (1 + Math.random() * 4);
          s.speed = 0.6 + Math.random() * 1.4;
          s.length = 6 + Math.floor(Math.random() * 14);
        }
      });

      // Pulsing "tap to start" message
      const pulse = 0.45 + 0.45 * Math.sin(now / 900);
      ctx.fillStyle = main;
      ctx.globalAlpha = pulse;
      ctx.font = '13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('tap to start typing', canvas.width / 2, box.height * 0.82);
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, containerRef, theme]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}
    />
  );
}

export default function TypingTest({ onFocusChange }) {
  const {
    words, wordIndex, wordStates, typedWords,
    status, mode, timeRemaining, wordOption,
    language, handleKey,
  } = useGameStore();

  const idleGame = useGameStore((s) => s.idleGame);

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
  const [resolvedIdleGame, setResolvedIdleGame] = useState('snake');

  const isIdleOverlayActive = !isFocused && status === 'idle';

  useEffect(() => {
    if (isIdleOverlayActive) {
      setResolvedIdleGame(
        idleGame === 'random'
          ? (['snake', 'pacman', 'matrix'])[Math.floor(Math.random() * 3)]
          : idleGame
      );
    }
  }, [isIdleOverlayActive, idleGame]);

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

        {/* Idle game overlays — only one active at a time based on resolvedIdleGame */}
        <SnakeOverlay
          containerRef={containerRef}
          wordsRef={wordsRef}
          active={isIdleOverlayActive && resolvedIdleGame === 'snake'}
        />
        <PacManOverlay
          containerRef={containerRef}
          wordsRef={wordsRef}
          active={isIdleOverlayActive && resolvedIdleGame === 'pacman'}
        />
        <MatrixRainOverlay
          containerRef={containerRef}
          active={isIdleOverlayActive && resolvedIdleGame === 'matrix'}
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
