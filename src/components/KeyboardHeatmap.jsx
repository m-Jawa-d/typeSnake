'use client';

const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

function buildKeyStats(words, wordStates) {
  const stats = {};
  const record = (ch, correct) => {
    if (!stats[ch]) stats[ch] = { correct: 0, incorrect: 0 };
    if (correct) stats[ch].correct++;
    else stats[ch].incorrect++;
  };
  words.forEach((word, wi) => {
    const states = wordStates[wi] ?? [];
    word.split('').forEach((ch, li) => {
      const state = states[li];
      const key = ch.toLowerCase();
      if (state === 'correct') record(key, true);
      else if (state === 'incorrect') record(key, false);
    });
  });
  return stats;
}

function interpolateColor(ratio) {
  const r1 = 220, g1 = 80, b1 = 80;
  const r2 = 80, g2 = 190, b2 = 110;
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `rgb(${r},${g},${b})`;
}

function KeyTile({ label, ratio, total, KEY_SIZE, GAP, isUrdu }) {
  const bg = ratio < 0 ? 'var(--sub-alt)' : interpolateColor(ratio);
  const textColor = ratio < 0 ? 'var(--sub)' : 'rgba(0,0,0,0.8)';
  const pct = ratio < 0 ? '' : `${Math.round(ratio * 100)}%`;
  const tooltipTotal = total > 0 ? `${label}: ${Math.round(ratio * total)} correct, ${total - Math.round(ratio * total)} errors` : label;

  return (
    <div
      title={tooltipTotal}
      style={{
        width: isUrdu ? 'auto' : KEY_SIZE,
        minWidth: KEY_SIZE,
        height: KEY_SIZE,
        padding: isUrdu ? '0 6px' : 0,
        borderRadius: '6px',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: isUrdu ? "var(--font-urdu, 'Noto Nastaliq Urdu', serif)" : 'var(--font)',
        color: textColor,
        gap: '2px',
        transition: 'background 0.2s',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: isUrdu ? '1rem' : '0.75rem' }}>{label}</span>
      {pct && (
        <span style={{ fontSize: '0.52rem', opacity: 0.9 }}>{pct}</span>
      )}
    </div>
  );
}

export default function KeyboardHeatmap({ words, wordStates, language }) {
  const stats = buildKeyStats(words, wordStates);
  const isUrdu = language === 'urdu';

  const KEY_SIZE = 38;
  const GAP = 5;
  const rowOffsets = [0, 0.5, 1];

  if (isUrdu) {
    // Show all typed Urdu chars as a grid, sorted weakest first
    const entries = Object.entries(stats)
      .filter(([, s]) => s.correct + s.incorrect > 0)
      .map(([ch, s]) => {
        const total = s.correct + s.incorrect;
        const ratio = s.correct / total;
        return { ch, ratio, total };
      })
      .sort((a, b) => a.ratio - b.ratio);

    if (entries.length === 0) {
      return (
        <div>
          <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '1rem', letterSpacing: '0.04em' }}>
            key accuracy
          </div>
          <div style={{ color: 'var(--sub)', fontSize: '0.75rem' }}>no data</div>
        </div>
      );
    }

    // chunk into rows of 8
    const chunkSize = 8;
    const rows = [];
    for (let i = 0; i < entries.length; i += chunkSize) {
      rows.push(entries.slice(i, i + chunkSize));
    }

    return (
      <div>
        <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '1rem', letterSpacing: '0.04em' }}>
          key accuracy
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: `${GAP}px`, flexWrap: 'wrap' }}>
              {row.map(({ ch, ratio, total }) => (
                <KeyTile key={ch} label={ch} ratio={ratio} total={total} KEY_SIZE={KEY_SIZE} GAP={GAP} isUrdu />
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem' }}>
            <div style={{
              width: '64px',
              height: '5px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, rgb(220,80,80), rgb(80,190,110))',
            }} />
            <span style={{ color: 'var(--sub)', fontSize: '0.62rem' }}>weak → strong</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '1rem', letterSpacing: '0.04em' }}>
        key accuracy
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {ROWS.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: 'flex',
              gap: `${GAP}px`,
              marginLeft: `${rowOffsets[ri] * (KEY_SIZE + GAP)}px`,
            }}
          >
            {row.map((key) => {
              const s = stats[key];
              const total = s ? s.correct + s.incorrect : 0;
              const ratio = total > 0 ? s.correct / total : -1;
              return (
                <KeyTile key={key} label={key} ratio={ratio} total={total} KEY_SIZE={KEY_SIZE} GAP={GAP} isUrdu={false} />
              );
            })}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem' }}>
          <div style={{
            width: '64px',
            height: '5px',
            borderRadius: '3px',
            background: 'linear-gradient(to right, rgb(220,80,80), rgb(80,190,110))',
          }} />
          <span style={{ color: 'var(--sub)', fontSize: '0.62rem' }}>error → perfect</span>
        </div>
      </div>
    </div>
  );
}
