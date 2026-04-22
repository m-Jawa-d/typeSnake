'use client';
import useMultiplayerStore from '../store/multiplayerStore';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RaceResults({ onPlayAgain }) {
  const { players, clientId, leaveRoom, raceWords, startRace, isHost } = useMultiplayerStore();

  const sorted = [...players].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.wpm - a.wpm;
  });

  const myResult = sorted.find((p) => p.id === clientId);
  const myRank = sorted.indexOf(myResult) + 1;

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '0.3rem' }}>your result</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <div style={{ color: 'var(--text)', fontSize: '3.5rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {myResult?.wpm ?? 0}
          </div>
          <div style={{ color: 'var(--sub)', fontSize: '0.8rem' }}>wpm</div>
          {myRank <= 3 && (
            <div style={{ fontSize: '2rem' }}>{MEDALS[myRank - 1]}</div>
          )}
        </div>
      </div>

      <div style={{
        borderTop: '1px solid var(--sub-alt)',
        paddingTop: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {sorted.map((p, i) => {
          const isMe = p.id === clientId;
          return (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '1.5rem',
                color: 'var(--sub)',
                fontSize: '0.75rem',
                textAlign: 'center',
                flexShrink: 0,
              }}>
                {i < 3 ? MEDALS[i] : `${i + 1}`}
              </div>
              <div style={{
                flex: 1,
                color: isMe ? 'var(--text)' : 'var(--sub)',
                fontSize: '0.9rem',
                fontWeight: isMe ? 600 : 400,
              }}>
                {p.name}
                {isMe && <span style={{ color: 'var(--sub)', fontSize: '0.65rem', marginLeft: '0.4rem' }}>you</span>}
              </div>
              <div style={{
                color: isMe ? 'var(--main)' : 'var(--sub)',
                fontSize: '1.1rem',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: isMe ? 600 : 400,
              }}>
                {p.wpm}
              </div>
              <div style={{ color: 'var(--sub)', fontSize: '0.65rem' }}>wpm</div>
              {!p.finished && (
                <div style={{ color: 'var(--sub)', fontSize: '0.65rem' }}>dnf</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {isHost && (
          <button
            onClick={onPlayAgain}
            style={{
              background: 'var(--main)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--bg)',
              fontFamily: 'var(--font)',
              fontSize: '0.8rem',
              padding: '0.6rem 1.2rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            play again
          </button>
        )}
        {!isHost && (
          <div style={{ color: 'var(--sub)', fontSize: '0.8rem', alignSelf: 'center' }}>
            waiting for host to restart…
          </div>
        )}
        <button
          onClick={leaveRoom}
          style={{
            background: 'var(--sub-alt)',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--sub)',
            fontFamily: 'var(--font)',
            fontSize: '0.8rem',
            padding: '0.6rem 1.2rem',
            cursor: 'pointer',
          }}
        >
          leave
        </button>
      </div>
    </div>
  );
}
