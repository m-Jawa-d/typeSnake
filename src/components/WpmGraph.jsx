'use client';

export default function WpmGraph({ timeline }) {
  if (!timeline || timeline.length < 2) return null;

  const width = 400;
  const height = 160;
  const pad = { top: 12, right: 12, bottom: 24, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxWpm = Math.max(...timeline, 1);
  const minWpm = Math.min(...timeline, 0);
  const range = maxWpm - minWpm || 1;

  const xStep = innerW / (timeline.length - 1);
  const toX = (i) => pad.left + i * xStep;
  const toY = (v) => pad.top + innerH - ((v - minWpm) / range) * innerH;

  const points = timeline.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPoints = [
    `${toX(0)},${pad.top + innerH}`,
    ...timeline.map((v, i) => `${toX(i)},${toY(v)}`),
    `${toX(timeline.length - 1)},${pad.top + innerH}`,
  ].join(' ');

  const yLabels = [minWpm, Math.round((minWpm + maxWpm) / 2), maxWpm];
  const xLabels = [
    { i: 0, label: '0' },
    { i: Math.floor((timeline.length - 1) / 2), label: `${Math.floor((timeline.length - 1) / 2)}` },
    { i: timeline.length - 1, label: `${timeline.length - 1}` },
  ];

  return (
    <div>
      <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '1rem', letterSpacing: '0.04em' }}>
        wpm over time
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--main)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--main)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yLabels.map((v) => (
          <line
            key={v}
            x1={pad.left} y1={toY(v)}
            x2={pad.left + innerW} y2={toY(v)}
            stroke="var(--sub-alt)"
            strokeWidth="1"
          />
        ))}

        <polygon points={areaPoints} fill="url(#wpmGrad)" />

        <polyline
          points={points}
          fill="none"
          stroke="var(--main)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {yLabels.map((v) => (
          <text
            key={v}
            x={pad.left - 6}
            y={toY(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--sub)"
            fontFamily="var(--font)"
          >
            {v}
          </text>
        ))}

        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={toX(i)}
            y={pad.top + innerH + 16}
            textAnchor="middle"
            fontSize="10"
            fill="var(--sub)"
            fontFamily="var(--font)"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
