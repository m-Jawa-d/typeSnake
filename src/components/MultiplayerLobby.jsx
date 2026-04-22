'use client';
import { useState } from 'react';
import { Copy, Check, ClipboardPaste } from 'lucide-react';
import useMultiplayerStore from '../store/multiplayerStore';
import useGameStore from '../store/gameStore';

const inputStyle = {
  background: 'var(--sub-alt)',
  border: 'none',
  borderRadius: '6px',
  color: 'var(--text)',
  fontFamily: 'var(--font)',
  fontSize: '0.9rem',
  padding: '0.6rem 0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle = (primary) => ({
  background: primary ? 'var(--main)' : 'var(--sub-alt)',
  border: 'none',
  borderRadius: '6px',
  color: primary ? 'var(--bg)' : 'var(--sub)',
  fontFamily: 'var(--font)',
  fontSize: '0.8rem',
  padding: '0.6rem 1.2rem',
  cursor: 'pointer',
  transition: 'opacity 0.1s ease',
  fontWeight: primary ? 600 : 400,
});

export default function MultiplayerLobby({ onBack }) {
  const { createRoom, joinRoom, mpStatus, roomCode, players, isHost, startRace, leaveRoom } = useMultiplayerStore();
  const language = useGameStore((s) => s.language);
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('enter your name'); return; }
    setLoading(true);
    setError('');
    try {
      await createRoom(name.trim(), language);
    } catch {
      setError('failed to create room');
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError('enter your name'); return; }
    if (!joinCode.trim()) { setError('enter room code'); return; }
    setLoading(true);
    setError('');
    try {
      await joinRoom(joinCode.trim(), name.trim());
    } catch {
      setError('room not found or could not connect');
    }
    setLoading(false);
  };

  const handleBack = () => {
    leaveRoom();
    onBack();
  };

  // Waiting room (lobby)
  if (mpStatus === 'lobby') {
    return (
      <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '0.4rem' }}>room code</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              color: 'var(--main)',
              fontSize: '2.5rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
            }}>
              {roomCode}
            </div>
            <button
              onClick={handleCopy}
              title={copied ? 'copied!' : 'copy room code'}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? 'var(--main)' : 'var(--sub)',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.1s ease',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginTop: '0.3rem' }}>
            share this code with your friends
          </div>
          <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
            language: <span style={{ color: 'var(--text)' }}>{useMultiplayerStore.getState().language === 'urdu' ? 'اردو' : 'english'}</span>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--sub)', fontSize: '0.7rem', marginBottom: '0.75rem' }}>
            players ({players.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map((p) => (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text)',
                fontSize: '0.9rem',
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--main)',
                }} />
                {p.name}
                {isHost && p.id === useMultiplayerStore.getState().clientId && (
                  <span style={{ color: 'var(--sub)', fontSize: '0.65rem' }}>you · host</span>
                )}
                {!isHost && p.id === useMultiplayerStore.getState().clientId && (
                  <span style={{ color: 'var(--sub)', fontSize: '0.65rem' }}>you</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isHost && (
            <button
              style={btnStyle(true)}
              onClick={startRace}
              disabled={players.length < 1}
            >
              start race
            </button>
          )}
          {!isHost && (
            <div style={{ color: 'var(--sub)', fontSize: '0.8rem', alignSelf: 'center' }}>
              waiting for host to start…
            </div>
          )}
          <button style={btnStyle(false)} onClick={handleBack}>leave</button>
        </div>
      </div>
    );
  }

  // Entry form
  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['create', 'join'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: tab === t ? 'var(--text)' : 'var(--sub)',
              fontFamily: 'var(--font)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0 0 0.3rem 0',
              borderBottom: tab === t ? '2px solid var(--main)' : '2px solid transparent',
              transition: 'color 0.1s ease',
            }}
          >
            {t === 'create' ? 'create room' : 'join room'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          style={inputStyle}
          placeholder="your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          onKeyDown={(e) => { if (e.key === 'Enter') tab === 'create' ? handleCreate() : handleJoin(); }}
        />

        {tab === 'join' && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.15em', paddingRight: '2.5rem' }}
              placeholder="room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
            />
            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setJoinCode(text.toUpperCase().slice(0, 4));
                } catch {}
              }}
              title="paste from clipboard"
              style={{
                position: 'absolute',
                right: '0.6rem',
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.1s ease',
              }}
            >
              <ClipboardPaste size={14} />
            </button>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button
            style={btnStyle(true)}
            onClick={tab === 'create' ? handleCreate : handleJoin}
            disabled={loading}
          >
            {loading ? '…' : tab === 'create' ? 'create' : 'join'}
          </button>
          <button style={btnStyle(false)} onClick={onBack}>back</button>
        </div>
      </div>
    </div>
  );
}
