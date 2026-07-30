# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint via Next.js
npm run start    # Serve production build
```

No test suite is configured.

## Environment

Multiplayer racing requires the `ABLY_API_KEY` environment variable. Create a `.env.local` file at the project root:

```
ABLY_API_KEY=your_ably_api_key_here
```

Get an API key from [Ably](https://ably.com/) — free tier includes generous rate limits for testing.

## Architecture

Next.js 14 App Router project (JavaScript, no TypeScript). All styling is inline styles only — no CSS modules, no Tailwind. Theming is entirely via CSS custom properties on `[data-theme="..."]` selectors in [src/app/globals.css](src/app/globals.css); the active theme is set on `document.documentElement` in [src/app/page.js](src/app/page.js). Font is JetBrains Mono loaded from Google Fonts.

### State: Zustand store ([src/store/gameStore.js](src/store/gameStore.js))

Single store drives the entire game. Key fields:

- **`status`**: `'idle' | 'active' | 'finished'` — transitions on first keypress, timer end, or word completion.
- **`mode`**: `'time'` (countdown, infinite words) | `'words'` (fixed count, no timer) | `'quote'` | `'story'`.
- **`mood`**: `'happy' | 'sad' | 'anger' | 'joy' | 'calm'` — selects which word pool, quote list, and story list `initTest` draws from. Mood pools are defined at the top of the file as `MOOD_WORD_POOLS`, `MOOD_QUOTES`, `MOOD_STORIES`. If no mood matches, falls back to the standard `WORD_POOLS` / `QUOTES` / `STORIES`.
- **`wordStates`**: parallel array to `words`; each entry is an array of `'correct' | 'incorrect' | 'extra' | null` per letter.
- **`typedWords`**: what the user has actually typed per word slot (including the word in progress).
- In `time` mode, words are generated in batches of 80, then 40 more appended when within 10 words of the end. The infinite-scroll word generation also respects the active mood pool.
- `_recalcStats()` recalculates WPM/accuracy from scratch on every keypress and tick — spaces between words count as 1 correct character.
- `theme`, `language`, `fluidEffectEnabled` (default `false`), and `fluidColorMode` (`'random' | 'theme'`, default `'theme'`) are persisted to `localStorage`; `mood` is not.

### Components

- **[TypingTest.jsx](src/components/TypingTest.jsx)** — core typing UI. Keyboard input is captured via a `window` keydown listener (not the hidden `<input>`). The hidden `<input>` exists only for focus tracking (blur overlay). Caret position is computed with `getBoundingClientRect()` on individual `[data-letter]` spans. Line scrolling is CSS `translateY` driven by `scrollLines`, incremented whenever the caret top exceeds `lineHeight * 1.8`. Timer interval is started/cleared in a `useEffect` watching `status`, `mode`, and `isFocused` — the timer only ticks while the test area is focused.
- **[ConfigBar.jsx](src/components/ConfigBar.jsx)** — mode chips (time / words / quote / story) plus time/word-count sub-options. Fades out when `focused && active`. Mood is not shown here — it lives in Settings.
- **[Settings.jsx](src/components/Settings.jsx)** — modal with language selector, mood selector (5 buttons with lucide-react icons, no emoji), theme grid, and persisted liquid-background enable/color controls. Uses `framer-motion` for enter/exit animation. Mood icons: Smile → happy, Frown → sad, Flame → anger, Zap → joy, Wind → calm. Also includes sound effects toggle and keyboard sound profiles.
- **[FluidBackground.jsx](src/components/FluidBackground.jsx)** — full-viewport WebGL canvas rendered behind the Practice page when `fluidEffectEnabled` is true. [src/lib/fluidSimulation.js](src/lib/fluidSimulation.js) pushes dye through a fluid solver on cursor movement and dissipates it when movement stops. `fluidColorMode: 'random'` uses changing rainbow colors; `'theme'` strictly uses the active theme's accent. The canvas is `pointer-events: none`, tears down the simulation when unmounted, and is skipped for `prefers-reduced-motion: reduce`.
- **[Results.jsx](src/components/Results.jsx)** — shown when `status === 'finished'`; displays wpm, accuracy, raw wpm, correct/errors, time, words completed. Tab/Enter triggers restart.
- **[History.jsx](src/components/History.jsx)** — slide-in panel showing past test results read from `localStorage`. Dates are formatted relative to today (time if today, "yesterday", or short date).
- **[StatsPage.jsx](src/components/StatsPage.jsx)** — detailed statistics dashboard showing history entries filterable by mode, with aggregate stats across all tests or selected filters.
- **[WpmGraph.jsx](src/components/WpmGraph.jsx)** — lightweight WPM trend visualization using canvas for performance.
- **[KeyboardHeatmap.jsx](src/components/KeyboardHeatmap.jsx)** — heatmap showing key frequency and accuracy per keystroke for performance analysis.
- **[MultiplayerLobby.jsx](src/components/MultiplayerLobby.jsx)** — create/join room UI backed by `useMultiplayerStore`. Tabs for create vs join; shows player list and a "start race" button (host only) once in lobby.
- **[RaceView.jsx](src/components/RaceView.jsx)** — the live racing UI, mirrors TypingTest's caret/scroll logic but reads from `multiplayerStore`. Shows a progress bar per player in real time.
- **[RaceResults.jsx](src/components/RaceResults.jsx)** — post-race leaderboard; players sorted by finish time, then by WPM for those who didn't finish.

### Multiplayer ([src/store/multiplayerStore.js](src/store/multiplayerStore.js))

Real-time multiplayer is built on **Ably** (pub/sub channels). The API route [src/app/api/ably-token/route.js](src/app/api/ably-token/route.js) issues a token request with a random `clientId` (UUID). Requires `ABLY_API_KEY` environment variable.

- `mpStatus`: `'idle' | 'lobby' | 'countdown' | 'racing' | 'finished'`
- Room channel name: `race:<ROOM_CODE>` (4-char uppercase code).
- Host publishes `room-state` to latecomers on `player-joined`; all clients subscribe to `start-race`, `progress-update`, `race-finished`, and `countdown`.
- `raceWords` is a fixed 30-word list generated by the host and distributed via `room-state`/`start-race`.
- Progress updates are published on every space keypress (word completion) during a race.

### Page ([src/app/page.js](src/app/page.js))

`AnimatePresence` cross-fades between the test view (`ConfigBar` + `TypingTest`) and `Results` based on `status`. Header and footer fade out when the user is actively typing (focus + active state via `onFocusChange` callback). Settings modal is mounted/unmounted via a second `AnimatePresence`. The liquid background mounts only on the Practice view and sits below the header, main content, and footer.

### Design tokens (CSS variables)

| Variable | Purpose |
|---|---|
| `--bg` | Page background |
| `--main` | Accent / caret / active chip highlight |
| `--text` | Correctly typed letters, primary text |
| `--sub` | Untyped letters, secondary hints |
| `--sub-alt` | Chip/button backgrounds, dividers |
| `--error` | Incorrect letters, error underline on completed words |
| `--error-extra` | Extra characters beyond word length |
| `--font` | JetBrains Mono stack |
| `--transition` | `0.1s ease` — used for color transitions throughout |
