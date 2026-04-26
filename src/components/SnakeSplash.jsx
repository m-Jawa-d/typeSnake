'use client';
import { useEffect, useRef, useState } from 'react';

const SITE_NAME = 'typeSnake';

export default function SnakeSplash({ onDone }) {
  const canvasRef = useRef(null);
  const [fading, setFading] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const style = getComputedStyle(document.documentElement);
    const bg       = style.getPropertyValue('--bg').trim()   || '#f5f0eb';
    const textClr  = style.getPropertyValue('--text').trim() || '#2c2c2c';
    const mainClr  = style.getPropertyValue('--main').trim() || '#c0392b';
    const subClr   = style.getPropertyValue('--sub').trim()  || '#7a736a';

    // resolve any CSS color to rgb values via an offscreen pixel
    function resolveColor(css) {
      const tmp = document.createElement('canvas');
      tmp.width = tmp.height = 1;
      const t = tmp.getContext('2d');
      t.fillStyle = css;
      t.fillRect(0, 0, 1, 1);
      const [r, g, b] = t.getImageData(0, 0, 1, 1).data;
      return { r, g, b, rgba: (a) => `rgba(${r},${g},${b},${a})` };
    }
    const main = resolveColor(mainClr);

    // font & layout
    const fontSize = Math.round(Math.min(Math.max(W * 0.085, 44), 100));
    const centerY  = H / 2;

    // measure letter positions after font is set
    ctx.font = `700 ${fontSize}px 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'middle';

    const letters   = SITE_NAME.split('');
    const letterPos = [];
    let runX = (W - ctx.measureText(SITE_NAME).width) / 2;
    for (const ch of letters) {
      const w = ctx.measureText(ch).width;
      letterPos.push({ ch, x: runX, midX: runX + w / 2, w });
      runX += w;
    }

    // snake config — very tight segments with connecting strokes
    const SEG_RADIUS   = fontSize * 0.1;   // fatter dot
    const SEG_SPACING  = fontSize * 0.038;   // super tight, almost overlapping
    const BODY_COUNT   = Math.round(fontSize * 1.4 / SEG_SPACING); // ~35 segs, half length
    const HEAD_RADIUS  = fontSize * 0.143;   // fatter head
    const SPEED        = Math.max(1.8, W / 70); // px per frame, slow enough to see
    const WAVE_AMP     = fontSize * 0.22;
    const WAVE_PERIOD  = W * 0.25;           // one full wave per ~55% of screen width

    // position history (one entry per pixel advanced)
    const historyMax = BODY_COUNT * SEG_SPACING + 20;
    const history    = [];
    const startX     = -(BODY_COUNT * SEG_SPACING) - HEAD_RADIUS - 10;
    for (let i = 0; i < historyMax + 20; i++) {
      history.push({ x: startX - i * SPEED, y: centerY });
    }

    let headX   = startX;
    let frame   = 0;

    const eaten     = new Array(letters.length).fill(false);
    const particles = [];

    function spawnBurst(x, y) {
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
        const spd   = 1.8 + Math.random() * 3.5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1,
          life: 1,
          decay: 1 / (28 + Math.random() * 18),
          r: SEG_RADIUS * (0.6 + Math.random() * 0.8),
        });
      }
    }

    let animId;

    function tick() {
      // advance head with wave
      const waveY = centerY + Math.sin((headX / WAVE_PERIOD) * Math.PI * 2) * WAVE_AMP;
      headX += SPEED;
      history.unshift({ x: headX, y: waveY });
      if (history.length > historyMax + 50) history.pop();

      // eat check
      for (let i = 0; i < letters.length; i++) {
        if (!eaten[i] && headX > letterPos[i].midX) {
          eaten[i] = true;
          spawnBurst(letterPos[i].midX, centerY);
        }
      }

      frame++;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // letters
      ctx.font = `700 ${fontSize}px 'JetBrains Mono', monospace`;
      ctx.textBaseline = 'middle';
      for (let i = 0; i < letters.length; i++) {
        if (eaten[i]) continue;
        const dist = letterPos[i].midX - headX;
        // next letter pulses with accent color
        ctx.fillStyle = (dist > 0 && dist < fontSize * 1.8) ? mainClr : textClr;
        ctx.fillText(letters[i], letterPos[i].x, centerY);
      }

      // subtitle
      const subSize = Math.max(12, fontSize * 0.165);
      ctx.font = `400 ${subSize}px 'JetBrains Mono', monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = subClr;
      ctx.textAlign = 'center';
      // ctx.fillText('loading...', W / 2, centerY + fontSize * 0.72);
      ctx.textAlign = 'left';

      // --- snake body ---
      // build segment positions from history
      const segs = [];
      for (let i = 0; i < BODY_COUNT; i++) {
        const idx = Math.min(Math.round(i * SEG_SPACING), history.length - 1);
        segs.push(history[idx]);
      }

      // glow pass (drawn back → front)
      ctx.save();
      ctx.shadowColor = mainClr;
      ctx.shadowBlur  = 14;
      for (let i = segs.length - 1; i >= 1; i--) {
        const t   = 1 - i / segs.length;
        const r   = SEG_RADIUS * (0.5 + 0.5 * t);
        ctx.beginPath();
        ctx.arc(segs[i].x, segs[i].y, r, 0, Math.PI * 2);
        ctx.fillStyle = main.rgba(0.18 + 0.45 * t);
        ctx.fill();
      }
      ctx.restore();

      // solid body pass — draw connecting line + circles for smooth ribbon
      if (segs.length >= 2) {
        // draw stroke connecting all segments
        ctx.strokeStyle = main.rgba(0.72);
        ctx.lineWidth   = SEG_RADIUS * 3.2;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(segs[0].x, segs[0].y);
        for (let i = 1; i < segs.length; i++) {
          ctx.lineTo(segs[i].x, segs[i].y);
        }
        ctx.stroke();

        // draw circles on top for definition
        for (let i = segs.length - 1; i >= 0; i--) {
          const t   = 1 - i / segs.length; // 0=tail, 1=head
          const r   = SEG_RADIUS * (0.5 + 0.5 * t);
          const alpha = 0.65 + 0.35 * t;

          ctx.beginPath();
          ctx.arc(segs[i].x, segs[i].y, r, 0, Math.PI * 2);
          ctx.fillStyle = main.rgba(alpha);
          ctx.fill();
        }
      }

      // head
      const hd = segs[0] || { x: headX, y: centerY };
      ctx.save();
      ctx.shadowColor = mainClr;
      ctx.shadowBlur  = 22;
      ctx.beginPath();
      ctx.arc(hd.x, hd.y, HEAD_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = mainClr;
      ctx.fill();
      ctx.restore();

      // eyes
      const eyeR   = HEAD_RADIUS * 0.26;
      const eyeOffX = HEAD_RADIUS * 0.38;
      const eyeOffY = HEAD_RADIUS * 0.38;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(hd.x + eyeOffX, hd.y - eyeOffY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hd.x + eyeOffX, hd.y + eyeOffY, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // tongue flicker
      if (frame % 34 < 17) {
        ctx.save();
        ctx.strokeStyle = '#ff3355';
        ctx.lineWidth   = Math.max(1, HEAD_RADIUS * 0.18);
        ctx.lineCap     = 'round';
        const tx = hd.x + HEAD_RADIUS;
        ctx.beginPath();
        ctx.moveTo(tx, hd.y);
        ctx.lineTo(tx + HEAD_RADIUS * 1.1, hd.y);
        ctx.moveTo(tx + HEAD_RADIUS * 1.1, hd.y);
        ctx.lineTo(tx + HEAD_RADIUS * 1.7, hd.y - HEAD_RADIUS * 0.5);
        ctx.moveTo(tx + HEAD_RADIUS * 1.1, hd.y);
        ctx.lineTo(tx + HEAD_RADIUS * 1.7, hd.y + HEAD_RADIUS * 0.5);
        ctx.stroke();
        ctx.restore();
      }

      // particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.12;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha   = p.life * p.life;
        ctx.shadowColor   = mainClr;
        ctx.shadowBlur    = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = mainClr;
        ctx.fill();
        ctx.restore();
      }

      tick();

      // finish once head clears the right edge
      if (headX > W + BODY_COUNT * SEG_SPACING + 30 && !doneRef.current) {
        doneRef.current = true;
        cancelAnimationFrame(animId);
        setFading(true);
        setTimeout(() => onDone(), 650);
        return;
      }

      animId = requestAnimationFrame(draw);
    }

    // wait for fonts before first frame
    const t0 = setTimeout(() => { animId = requestAnimationFrame(draw); }, 200);
    return () => { clearTimeout(t0); cancelAnimationFrame(animId); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'var(--bg)',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.65s ease',
      pointerEvents: fading ? 'none' : 'auto',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
