'use client';
import { create } from 'zustand';

const STORIES = [
  "The sun dipped below the horizon, painting the sky in shades of orange and pink. A lone figure walked along the beach, footprints trailing behind in the wet sand. Waves crashed and retreated, erasing each mark as if the ocean wanted no record of the journey.",
  "She opened the old wooden box and found letters tied with a faded ribbon. Each envelope bore her grandmother's handwriting, careful and deliberate. She sat by the window and began to read, feeling the decades collapse between the pages.",
  "The train pulled into the station just as the first drops of rain began to fall. He grabbed his bag and stepped onto the platform, scanning the crowd for a familiar face. A hand waved from beneath a yellow umbrella, and he smiled.",
  "Every morning the baker arrived before dawn to light the ovens. The smell of fresh bread would drift through the quiet streets, pulling people from their beds like a gentle current. By the time the sun rose, the shelves were already half empty.",
  "The children found the map tucked inside a library book about distant islands. They spread it out on the kitchen table and traced the dotted lines with their fingers. By afternoon they had packed their bags and were ready for the adventure.",
];

const QUOTES = [
  "The only way to do great work is to love what you do.",
  "In the middle of every difficulty lies opportunity.",
  "It does not matter how slowly you go as long as you do not stop.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Life is what happens when you are busy making other plans.",
  "You only live once, but if you do it right, once is enough.",
  "Be yourself; everyone else is already taken.",
  "Two things are infinite: the universe and human stupidity; and I am not sure about the universe.",
  "In three words I can sum up everything I have learned about life: it goes on.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall.",
  "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
  "Spread love everywhere you go. Let no one ever come to you without leaving happier.",
  "When you reach the end of your rope, tie a knot in it and hang on.",
  "Always remember that you are absolutely unique. Just like everyone else.",
];

const MOOD_WORD_POOLS = {
  happy: [
    'smile','laugh','bright','sunny','joy','cheer','dance','glow','warm','play',
    'love','hope','gift','sweet','fun','light','lucky','bloom','fresh','free',
    'sing','bliss','glad','kind','leap','bounce','share','greet','sparkle','delight',
    'wonderful','amazing','celebrate','radiant','lively','cheerful','grateful','sunshine',
    'rainbow','fantastic','joyful','merry','elated','gleeful','buoyant','vibrant',
    'euphoric','content','pleased','thrilled','excited','beaming','glowing','upbeat',
  ],
  sad: [
    'rain','grey','alone','miss','lost','tear','ache','empty','quiet','dark',
    'sigh','fade','cold','hollow','heavy','still','gone','pale','drift','echo',
    'longing','sorrow','weep','mourn','broken','silent','dim','frail','wither','distant',
    'forgotten','melancholy','regret','grief','yearning','solitude','despair','wistful',
    'forlorn','somber','mournful','dreary','bleak','gloomy','desolate','resigned',
    'heartbreak','nostalgia','absence','loneliness','hollow','fragile','fading',
  ],
  anger: [
    'rage','storm','clash','fierce','burn','strike','fight','bold','fierce','roar',
    'force','blaze','sharp','raw','loud','clash','break','slam','harsh','grit',
    'fury','wrath','rebel','clash','defiant','intense','volatile','explosive','seething',
    'furious','livid','outrage','temper','hostility','aggression','turbulent','ferocious',
    'infuriated','enraged','vengeance','provoke','confront','antagonize','hostile','combative',
    'ruthless','relentless','fierce','unyielding','bold','fierce','powerful','unstoppable',
  ],
  joy: [
    'wonder','burst','thrill','ecstasy','alive','soar','rush','spark','pure','vivid',
    'exhilarate','triumph','magic','dream','glee','peak','golden','uplift','infinite','euphoria',
    'rapture','jubilee','exuberant','radiant','festive','electric','magnificent','breathtaking',
    'extraordinary','spectacular','incredible','phenomenal','legendary','transcendent','sublime',
    'glorious','magnificent','dazzling','splendid','brilliant','marvelous','stunning','wondrous',
    'exquisite','divine','celestial','infinite','boundless','limitless','soaring','blissful',
  ],
  calm: [
    'peace','soft','still','breathe','flow','gentle','quiet','rest','ease','slow',
    'serene','smooth','tender','drift','float','hush','meadow','mist','ripple','clear',
    'tranquil','mindful','balance','center','harmony','steady','patient','grounded','present','aware',
    'meditate','reflect','restore','renewal','silence','spacious','unhurried','thoughtful','graceful',
    'equanimity','serenity','composure','stability','clarity','simplicity','acceptance','surrender',
    'openness','spaciousness','wholeness','completeness','contentment','fulfillment','at-ease',
  ],
};

const MOOD_QUOTES = {
  happy: [
    "Happiness is not something ready-made. It comes from your own actions.",
    "The most wasted of days is one without laughter.",
    "Joy is the simplest form of gratitude.",
    "Happiness is a warm smile shared with a stranger.",
    "The secret of happiness is freedom and the secret of freedom is courage.",
  ],
  sad: [
    "Even the darkest night will end and the sun will rise.",
    "The soul would have no rainbow had the eyes no tears.",
    "What we have once enjoyed we can never lose. All that we love deeply becomes a part of us.",
    "Tears are words that need to be written.",
    "Every goodbye makes the next hello closer.",
  ],
  anger: [
    "Speak when you are angry and you will make the best speech you will ever regret.",
    "For every minute you are angry you lose sixty seconds of happiness.",
    "The flame of anger, bright and brief, sharpens the barb of love.",
    "Anger is an acid that can do more harm to the vessel in which it is stored than to anything on which it is poured.",
    "Where there is anger there is always pain underneath.",
  ],
  joy: [
    "Find ecstasy in life; the mere sense of living is joy enough.",
    "Joy is what happens to us when we allow ourselves to recognize how good things really are.",
    "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    "Joy does not simply happen to us. We have to choose joy and keep choosing it.",
    "When you do things from your soul you feel a river moving in you, a joy.",
  ],
  calm: [
    "Within you there is a stillness and a sanctuary to which you can retreat at any time.",
    "Calmness is the cradle of power.",
    "Peace comes from within. Do not seek it without.",
    "Nothing can bring you peace but yourself.",
    "Set peace of mind as your highest goal and organize your life around it.",
  ],
};

const MOOD_STORIES = {
  happy: [
    "She woke up to the sound of birds singing outside her window. The morning light filtered through the curtains, golden and warm. She stretched, smiled for no particular reason, and decided today would be wonderful. The coffee was perfect, the air smelled of blooming flowers, and somewhere down the street someone was laughing.",
    "The children burst through the door after school, faces flushed and full of news. There was a story about a bird, a joke that made no sense but delighted everyone, and a drawing that had to be hung on the refrigerator immediately. The house felt suddenly very full and very alive.",
  ],
  sad: [
    "She kept the last voicemail saved on her phone. Not to listen to it, really, but just to know it was there. His voice, casual and hurried, saying he would call back later. He never did. Later never came. She pressed the phone against her chest in the dark and listened to the silence.",
    "The park bench had their initials carved into the wood. She had passed it a hundred times without stopping. Today she sat. The leaves were falling in slow spirals and the world seemed to be letting go of things it could no longer hold. She understood that feeling completely.",
  ],
  anger: [
    "He slammed the folder on the desk. The numbers were wrong again. He had said it twice, written it down, sent the email. Nobody listened. He stood at the window and breathed through the heat rising in his chest. Outside, the city moved indifferently. He would have to start over, alone, as always.",
    "The meeting ended and she walked straight to the stairwell. She needed stairs, movement, something to do with the energy crackling through her. They had dismissed her idea without even reading it. Three months of work, reduced to a shrug. She climbed until her legs burned and the anger had somewhere to go.",
  ],
  joy: [
    "The results came back and she screamed so loud her neighbor knocked on the wall. She did not care. She ran to the window and screamed again at the sky, which was blue and enormous and seemed to celebrate with her. She called everyone she had ever loved and said nothing coherent and that was fine.",
    "He crossed the finish line and did not stop running. He ran through the crowd and through the barrier and down the street because he could not contain what was in him. People cheered and he waved without seeing them. He was somewhere else entirely, somewhere bright and boundless and completely his own.",
  ],
  calm: [
    "The lake at dawn was perfectly still. She dipped her paddle in without a sound and the kayak moved forward as if by thought alone. The mist rose in slow columns. A heron stood in the shallows and did not startle. She breathed in and let the water carry her somewhere she did not need to name.",
    "He had learned to sit with the afternoon and not fill it. No phone, no task, just the window and the tea growing cool beside him. A car passed. A cloud changed shape. His thoughts moved through without catching. He had spent years learning this, the simple art of being somewhere without needing it to be different.",
  ],
};

const WORD_POOLS = {
  english: [
    'the','be','to','of','and','a','in','that','have','it','for','not','on','with','he','as','you',
    'do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my',
    'one','all','would','there','their','what','so','up','out','if','about','who','get','which',
    'go','me','when','make','can','like','time','no','just','him','know','take','people','into',
    'year','your','good','some','could','them','see','other','than','then','now','look','only',
    'come','its','over','think','also','back','after','use','two','how','our','work','first','well',
    'way','even','new','want','because','any','these','give','day','most','us','great','between',
    'need','large','often','hand','high','place','hold','turn','been','same','tell','does','set',
    'three','air','play','small','number','off','always','move','night','live','point','city',
    'thought','head','under','story','saw','left','few','while','along','might','close','something',
    'seem','next','hard','open','real','example','begin','life','those','both','paper','together',
    'got','group','run','important','until','children','side','feet','car','mile','walk',
    'white','sea','began','grow','took','river','four','carry','state','once','book','hear','stop','without',
  ],
  urdu: [
    'ہے','کہ','اور','کی','میں','کو','نہیں','سے','ہو','ایک','یہ','بھی','پر','نے','آپ',
    'ہم','وہ','تو','کیا','اس','جو','لیے','ہیں','آ','جب','اب','ان','اپنے','تھا','تھی',
    'کے','ہوا','کر','مجھے','تم','دیا','لیا','گیا','ہوں','رہا','ہاں','نہ','مگر','یا','بڑا',
    'چھوٹا','اچھا','برا','پانی','گھر','راستہ','کام','وقت','دن','رات','آنکھ','دل','ہاتھ','پیر',
    'سوچ','بات','نام','جگہ','دوست','لوگ','بچہ','باپ','ماں','بھائی','بہن','شہر','ملک','دنیا',
    'خوشی','غم','محبت','زندگی','موت','سچ','جھوٹ','کتاب','قلم','لکھنا','پڑھنا','دیکھنا','سننا',
    'جانا','آنا','کھانا','پینا','سونا','جاگنا','کھیلنا','دوڑنا','ہنسنا','رونا','بولنا','چلنا',
    'آسمان','زمین','درخت','پھول','پانی','آگ','ہوا','روشنی','اندھیرا','صبح','شام','سورج','چاند',
  ],
};

function generateWords(count, language = 'english') {
  const pool = WORD_POOLS[language] ?? WORD_POOLS.english;
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return words;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function textToWords(text) {
  return text.split(' ');
}

const useGameStore = create((set, get) => ({
  // Config
  mode: 'time',           // 'time' | 'words' | 'quote' | 'story'
  mood: 'happy',          // 'happy' | 'sad' | 'anger' | 'joy' | 'calm'
  timeOption: 30,         // 15 | 30 | 60 | 120
  wordOption: 25,         // 10 | 25 | 50 | 100
  language: (() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    return stored === 'urdu' ? 'urdu' : 'english';
  })(),
  theme: (() => {
    const VALID = ['paper','ivory','zinc','rose','sky','carbon','mocha','forest','slate','graphite'];
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    return VALID.includes(stored) ? stored : 'paper';
  })(),

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
    if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
    set({ theme });
  },

  setLanguage: (language) => {
    if (typeof window !== 'undefined') localStorage.setItem('language', language);
    set({ language, status: 'idle', results: null });
    get().initTest();
  },

  setMood: (mood) => {
    set({ mood, status: 'idle', results: null });
    get().initTest();
  },

  initTest: () => {
    const { mode, timeOption, wordOption, language, mood } = get();
    let words;
    if (mode === 'quote') {
      const pool = mood && MOOD_QUOTES[mood] ? MOOD_QUOTES[mood] : QUOTES;
      words = textToWords(pickRandom(pool));
    } else if (mode === 'story') {
      const pool = mood && MOOD_STORIES[mood] ? MOOD_STORIES[mood] : STORIES;
      words = textToWords(pickRandom(pool));
    } else if (mood && MOOD_WORD_POOLS[mood]) {
      const count = mode === 'time' ? 80 : wordOption;
      const pool = MOOD_WORD_POOLS[mood];
      const result = [];
      for (let i = 0; i < count; i++) result.push(pool[Math.floor(Math.random() * pool.length)]);
      words = result;
    } else {
      const count = mode === 'time' ? 80 : wordOption;
      words = generateWords(count, language);
    }
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

      // In words/quote/story mode: check if done
      if (mode === 'words' && nextIndex >= wordOption) {
        set({ wordStates: newWordStates, wordIndex: nextIndex });
        get().finishTest();
        return;
      }
      if ((mode === 'quote' || mode === 'story') && nextIndex >= words.length) {
        set({ wordStates: newWordStates, wordIndex: nextIndex });
        get().finishTest();
        return;
      }

      // In time mode: if we hit the end of generated words, generate more
      if (mode === 'time' && nextIndex >= words.length - 10) {
        const { mood: currentMood } = get();
        const moreWords = currentMood && MOOD_WORD_POOLS[currentMood]
          ? (() => { const p = MOOD_WORD_POOLS[currentMood]; return Array.from({ length: 40 }, () => p[Math.floor(Math.random() * p.length)]); })()
          : generateWords(40, get().language);
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
        wordsTotal: get().words.length,
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
