'use client';
import { create } from 'zustand';
import * as Ably from 'ably';

// Generates a random 4-char uppercase room code
function makeRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

const RACE_POOL_ENGLISH = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
  'she','or','an','will','my','one','all','would','there','their','what','so','up',
  'out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','good','some','could','them',
];

const RACE_POOL_URDU = [
  'ہے','کہ','اور','کی','میں','کو','نہیں','سے','ہو','ایک','یہ','بھی','پر','نے','آپ',
  'ہم','وہ','تو','کیا','اس','جو','لیے','ہیں','آ','جب','اب','ان','اپنے','تھا','تھی',
  'کے','ہوا','کر','مجھے','تم','دیا','لیا','گیا','ہوں','رہا','ہاں','نہ','مگر','یا','بڑا',
  'چھوٹا','اچھا','برا','پانی','گھر','راستہ','کام','وقت','دن','رات','دل','ہاتھ','پیر',
  'سوچ','بات','نام','جگہ','دوست','لوگ','بچہ','باپ','ماں','بھائی','بہن','شہر','ملک',
];

function generateRaceWords(language = 'english') {
  const pool = language === 'urdu' ? RACE_POOL_URDU : RACE_POOL_ENGLISH;
  const words = [];
  for (let i = 0; i < 30; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return words;
}

const useMultiplayerStore = create((set, get) => ({
  // Connection
  ablyClient: null,
  channel: null,
  clientId: null,

  // Room
  roomCode: null,
  isHost: false,
  players: [],       // [{ id, name, progress, wpm, finished, finishTime }]
  raceWords: [],
  language: 'english',

  // Local race state
  mpStatus: 'idle',  // 'idle' | 'lobby' | 'countdown' | 'racing' | 'finished'
  countdown: 3,
  wordIndex: 0,
  typedWords: [],
  wordStates: [],
  startTime: null,
  wpm: 0,
  localFinished: false,

  // Connect to Ably and set clientId
  connect: async () => {
    if (get().ablyClient) return;
    const client = new Ably.Realtime({ authUrl: '/api/ably-token' });
    await new Promise((res) => client.connection.once('connected', res));
    set({ ablyClient: client, clientId: client.auth.clientId });
  },

  // Create a new room (host)
  createRoom: async (playerName, language = 'english') => {
    await get().connect();
    const roomCode = makeRoomCode();
    const raceWords = generateRaceWords(language);
    const { ablyClient, clientId } = get();

    const channel = ablyClient.channels.get(`race:${roomCode}`);

    const me = { id: clientId, name: playerName, progress: 0, wpm: 0, finished: false, finishTime: null };

    channel.subscribe('player-joined', (msg) => {
      const player = msg.data;
      set((s) => {
        if (s.players.find((p) => p.id === player.id)) return {};
        return { players: [...s.players, player] };
      });
      // Host sends room state to new joiner
      channel.publish('room-state', {
        raceWords: get().raceWords,
        players: get().players,
        hostId: clientId,
        language: get().language,
      });
    });

    channel.subscribe('player-progress', (msg) => {
      const { id, progress, wpm } = msg.data;
      set((s) => ({
        players: s.players.map((p) => p.id === id ? { ...p, progress, wpm } : p),
      }));
    });

    channel.subscribe('player-finished', (msg) => {
      const { id, wpm, finishTime } = msg.data;
      set((s) => ({
        players: s.players.map((p) => p.id === id ? { ...p, finished: true, wpm, finishTime } : p),
      }));
      get()._checkAllFinished();
    });

    channel.subscribe('start-countdown', () => {
      get()._startCountdown();
    });

    set({ channel, roomCode, isHost: true, raceWords, language, players: [me], mpStatus: 'lobby' });
    channel.publish('player-joined', me);
  },

  // Join an existing room
  joinRoom: async (roomCode, playerName) => {
    await get().connect();
    const { ablyClient, clientId } = get();
    const channel = ablyClient.channels.get(`race:${roomCode.toUpperCase()}`);

    const me = { id: clientId, name: playerName, progress: 0, wpm: 0, finished: false, finishTime: null };

    channel.subscribe('room-state', (msg) => {
      const { raceWords, players, language } = msg.data;
      set({ raceWords, players, ...(language && { language }) });
    });

    channel.subscribe('player-joined', (msg) => {
      const player = msg.data;
      set((s) => {
        if (s.players.find((p) => p.id === player.id)) return {};
        return { players: [...s.players, player] };
      });
    });

    channel.subscribe('player-progress', (msg) => {
      const { id, progress, wpm } = msg.data;
      set((s) => ({
        players: s.players.map((p) => p.id === id ? { ...p, progress, wpm } : p),
      }));
    });

    channel.subscribe('player-finished', (msg) => {
      const { id, wpm, finishTime } = msg.data;
      set((s) => ({
        players: s.players.map((p) => p.id === id ? { ...p, finished: true, wpm, finishTime } : p),
      }));
      get()._checkAllFinished();
    });

    channel.subscribe('start-countdown', () => {
      get()._startCountdown();
    });

    set({ channel, roomCode: roomCode.toUpperCase(), isHost: false, mpStatus: 'lobby', players: [me] });
    channel.publish('player-joined', me);
  },

  // Host starts the race
  startRace: () => {
    const { channel } = get();
    channel.publish('start-countdown', {});
  },

  _startCountdown: () => {
    set({ mpStatus: 'countdown', countdown: 3 });
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        get()._beginRace();
      } else {
        set({ countdown: count });
      }
    }, 1000);
  },

  _beginRace: () => {
    const { raceWords } = get();
    set({
      mpStatus: 'racing',
      startTime: Date.now(),
      wordIndex: 0,
      typedWords: raceWords.map(() => ''),
      wordStates: raceWords.map(() => []),
      wpm: 0,
      localFinished: false,
    });
  },

  // Called on each keystroke during the race
  handleRaceKey: (key) => {
    const { mpStatus, raceWords, wordIndex, typedWords, wordStates, channel, clientId, startTime } = get();
    if (mpStatus !== 'racing') return;

    const currentWord = raceWords[wordIndex];

    if (key === ' ') {
      const typed = typedWords[wordIndex];
      if (!typed) return;

      const newWordStates = [...wordStates];
      const states = [...(newWordStates[wordIndex] || [])];
      for (let i = states.length; i < currentWord.length; i++) states.push('incorrect');
      newWordStates[wordIndex] = states;

      const nextIndex = wordIndex + 1;
      const progress = Math.round((nextIndex / raceWords.length) * 100);

      // Recalc wpm
      const elapsed = (Date.now() - startTime) / 60000;
      let correct = 0;
      for (let i = 0; i < nextIndex; i++) {
        const w = raceWords[i];
        const t = typedWords[i] || '';
        for (let j = 0; j < Math.min(w.length, t.length); j++) {
          if (t[j] === w[j]) correct++;
        }
        correct += 1; // space
      }
      const wpm = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;

      set({ wordIndex: nextIndex, wordStates: newWordStates, wpm });
      channel.publish('player-progress', { id: clientId, progress, wpm });

      if (nextIndex >= raceWords.length) {
        const finishTime = Date.now();
        set({ localFinished: true });
        channel.publish('player-finished', { id: clientId, wpm, finishTime });
        get()._checkAllFinished();
      }
      return;
    }

    if (key === 'Backspace') {
      const typed = typedWords[wordIndex];
      if (!typed) return;
      const newTyped = [...typedWords];
      newTyped[wordIndex] = typed.slice(0, -1);
      const newWordStates = [...wordStates];
      const states = [...(newWordStates[wordIndex] || [])];
      states.pop();
      newWordStates[wordIndex] = states;
      set({ typedWords: newTyped, wordStates: newWordStates });
      return;
    }

    if (key.length !== 1) return;
    const typed = typedWords[wordIndex];
    const pos = typed.length;
    if (pos >= currentWord.length + 10) return;

    const newTyped = [...typedWords];
    newTyped[wordIndex] = typed + key;
    const newWordStates = [...wordStates];
    const states = [...(newWordStates[wordIndex] || [])];
    if (pos < currentWord.length) {
      states[pos] = key === currentWord[pos] ? 'correct' : 'incorrect';
    } else {
      states[pos] = 'extra';
    }
    newWordStates[wordIndex] = states;
    set({ typedWords: newTyped, wordStates: newWordStates });
  },

  _checkAllFinished: () => {
    const { players, localFinished } = get();
    // Show results if local player is done and race has been going
    if (localFinished) {
      setTimeout(() => {
        if (get().mpStatus === 'racing' || get().mpStatus === 'finished') {
          set({ mpStatus: 'finished' });
        }
      }, 3000); // wait 3s after finishing to let others catch up in view
    }
    const allDone = players.length > 0 && players.every((p) => p.finished);
    if (allDone) set({ mpStatus: 'finished' });
  },

  leaveRoom: () => {
    const { ablyClient, channel } = get();
    channel?.unsubscribe();
    channel?.detach();
    ablyClient?.close();
    set({
      ablyClient: null, channel: null, clientId: null,
      roomCode: null, isHost: false, players: [], raceWords: [], language: 'english',
      mpStatus: 'idle', countdown: 3, wordIndex: 0,
      typedWords: [], wordStates: [], startTime: null, wpm: 0, localFinished: false,
    });
  },
}));

export default useMultiplayerStore;
