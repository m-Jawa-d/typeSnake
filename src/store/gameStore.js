'use client';
import { create } from 'zustand';

// Word pool for generating tests
const WORD_POOL = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with','he','as','you',
  'do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my',
  'one','all','would','there','their','what','so','up','out','if','about','who','get','which',
  'go','me','when','make','can','like','time','no','just','him','know','take','people','into',
  'year','your','good','some','could','them','see','other','than','then','now','look','only',
  'come','its','over','think','also','back','after','use','two','how','our','work','first','well',
  'way','even','new','want','because','any','these','give','day','most','us','great','between',
  'need','large','often','hand','high','place','hold','turn','been','same','tell','does','set',
  'three','air','play','small','number','off','always','move','night','live','mr','point','city',
  'play','small','number','off','always','move','night','live','point','city','earth','eye','light',
  'thought','head','under','story','saw','left','don','few','while','along','might','close','something',
  'seem','next','hard','open','real','example','begin','life','always','those','both','paper','together',
  'got','group','often','run','important','until','children','side','feet','car','mile','night','walk',
  'white','sea','began','grow','took','river','four','carry','state','once','book','hear','stop','without',
];

function generateWords(count) {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  }
  return words;
}

const useGameStore = create((set, get) => ({
  // Config
  mode: 'time',           // 'time' | 'words'
  timeOption: 30,         // 15 | 30 | 60 | 120
  wordOption: 25,         // 10 | 25 | 50 | 100
  theme: 'light',         // 'light' | 'dark'

  // Game state
  status: 'idle',         // 'idle' | 'active' | 'finished'
  words: [],              // array of target words
  wordIndex: 0,           // current word being typed
  letterIndex: 0,         // current letter in current word
  // wordStates: array of arrays — 'correct'|'incorrect'|'extra'|null per letter
  wordStates: [],
  // typedWords: what user has actually typed per word (including in-progress)
  typedWords: [],

  startTime: null,
  timeRemaining: 30,
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  correctChars: 0,
  incorrectChars: 0,
  totalChars: 0,

  // Results
  results: null,

  // Actions
  setMode: (mode) => {
    set({ mode, status: 'idle', results: null });
    get().initTest();
  },

  setTimeOption: (val) => {
    set({ timeOption: val, timeRemaining: val, status: 'idle', results: null });
    get().initTest();
  },

  setWordOption: (val) => {
    set({ wordOption: val, status: 'idle', results: null });
    get().initTest();
  },

  setTheme: (theme) => {
    set({ theme });
  },

  initTest: () => {
    const { mode, timeOption, wordOption } = get();
    const count = mode === 'time' ? 80 : wordOption;
    const words = generateWords(count);
    set({
      words,
      wordIndex: 0,
      letterIndex: 0,
      wordStates: words.map(() => []),
      typedWords: words.map(() => ''),
      status: 'idle',
      startTime: null,
      timeRemaining: timeOption,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      results: null,
    });
  },

  startTest: () => {
    set({ status: 'active', startTime: Date.now() });
  },

  // Called every second when active in time mode
  tick: () => {
    const { status, mode, timeRemaining } = get();
    if (status !== 'active' || mode !== 'time') return;
    if (timeRemaining <= 1) {
      get().finishTest();
    } else {
      set((s) => ({ timeRemaining: s.timeRemaining - 1 }));
      get()._recalcStats();
    }
  },

  handleKey: (key) => {
    const { status, words, wordIndex, typedWords, wordStates, mode, wordOption } = get();

    if (status === 'idle') {
      if (key.length === 1) {
        get().startTest();
        get().handleKey(key);
      }
      return;
    }
    if (status !== 'active') return;

    const currentWord = words[wordIndex];

    if (key === ' ') {
      // Move to next word only if something was typed
      const typed = typedWords[wordIndex];
      if (!typed) return;

      // Mark missed letters as incorrect
      const newWordStates = [...wordStates];
      const states = [...(newWordStates[wordIndex] || [])];
      for (let i = states.length; i < currentWord.length; i++) {
        states.push('incorrect');
      }
      newWordStates[wordIndex] = states;

      const nextIndex = wordIndex + 1;

      // In words mode: check if done
      if (mode === 'words' && nextIndex >= wordOption) {
        set({ wordStates: newWordStates, wordIndex: nextIndex });
        get().finishTest();
        return;
      }

      // In time mode: if we hit the end of generated words, generate more
      if (mode === 'time' && nextIndex >= words.length - 10) {
        const moreWords = generateWords(40);
        const newWords = [...words, ...moreWords];
        set({
          words: newWords,
          wordStates: [...newWordStates, ...moreWords.map(() => [])],
          typedWords: [...get().typedWords, ...moreWords.map(() => '')],
        });
      }

      set({ wordIndex: nextIndex, letterIndex: 0, wordStates: newWordStates });
      get()._recalcStats();
      return;
    }

    if (key === 'Backspace') {
      const typed = typedWords[wordIndex];
      if (!typed) return; // can't backspace past start of word

      const newTyped = [...typedWords];
      newTyped[wordIndex] = typed.slice(0, -1);

      const newWordStates = [...wordStates];
      const states = [...(newWordStates[wordIndex] || [])];
      states.pop();
      newWordStates[wordIndex] = states;

      set({
        typedWords: newTyped,
        wordStates: newWordStates,
        letterIndex: Math.max(0, get().letterIndex - 1),
      });
      return;
    }

    // Regular character
    if (key.length !== 1) return;

    const typed = typedWords[wordIndex];
    const pos = typed.length;

    // Allow up to word length + 10 extra chars
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

    set({
      typedWords: newTyped,
      wordStates: newWordStates,
      letterIndex: pos + 1,
    });

    get()._recalcStats();
  },

  _recalcStats: () => {
    const { words, wordIndex, typedWords, startTime } = get();
    if (!startTime) return;

    const elapsedMs = Date.now() - startTime;
    const elapsedMin = elapsedMs / 60000;

    let correct = 0;
    let incorrect = 0;

    // Count all completed words
    for (let i = 0; i < wordIndex; i++) {
      const w = words[i];
      const typed = typedWords[i];
      // Each correct char in completed words
      for (let j = 0; j < Math.min(w.length, typed.length); j++) {
        if (typed[j] === w[j]) correct++;
        else incorrect++;
      }
      // Missing chars count as incorrect
      if (typed.length < w.length) incorrect += w.length - typed.length;
      // Space between words = 1 correct char
      correct += 1;
    }

    const totalTyped = correct + incorrect;
    const wpm = elapsedMin > 0 ? Math.round((correct / 5) / elapsedMin) : 0;
    const rawWpm = elapsedMin > 0 ? Math.round(((correct + incorrect) / 5) / elapsedMin) : 0;
    const accuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;

    set({ wpm, rawWpm, accuracy, correctChars: correct, incorrectChars: incorrect, totalChars: totalTyped });
  },

  finishTest: () => {
    const { wordIndex, startTime, mode, timeOption } = get();

    get()._recalcStats();
    const finalState = get();

    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const wordsCompleted = wordIndex;

    set({
      status: 'finished',
      results: {
        wpm: finalState.wpm,
        rawWpm: finalState.rawWpm,
        accuracy: finalState.accuracy,
        correct: finalState.correctChars,
        incorrect: finalState.incorrectChars,
        time: mode === 'time' ? timeOption : elapsed,
        wordsCompleted,
        mode,
      },
    });
  },

  restart: () => {
    get().initTest();
  },
}));

export default useGameStore;
