# Typing Test

A minimalist typing speed test built with Next.js. Supports multiple modes, mood-based word pools, themes, and multilingual input.

**Live demo:** [keyflows.vercel.app](https://keyflows.vercel.app/)

---

## Features

- **Modes** — `time` (countdown with infinite words), `words` (fixed count), `quote`, `story`
- **Moods** — happy / sad / anger / joy / calm, each with its own word pool, quotes, and stories
- **Themes** — multiple themes via CSS custom properties; light and dark supported
- **Stats** — WPM, raw WPM, accuracy, correct/incorrect characters, time, words completed
- **Multilingual** — language selector in Settings
- **Multiplayer Racing** — real-time race mode with lobbies; create/join rooms and compete live (powered by Ably)
- **History & Analytics** — view past test results with dates and stats; detailed statistics dashboard with filtering by mode and trend visualization
- **Difficulty Levels** — adjustable game difficulty with varied word pools
- **Sound Effects** — customizable keyboard sound profiles and toggle on/off
- All styling is inline styles + CSS variables — no Tailwind, no CSS modules

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router, JavaScript)
- [Zustand](https://zustand-demo.pmnd.rs/) — global state
- [Framer Motion](https://www.framer.com/motion/) — transitions
- [Lucide React](https://lucide.dev/) — icons
- [Ably](https://ably.com/) — real-time multiplayer
- JetBrains Mono (Google Fonts)

## Getting Started

**Prerequisites:** Node.js ≥ 18, npm ≥ 9

```bash
git clone https://github.com/m-Jawa-d/keyflow.git
cd keyflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # ESLint
```

## Project Structure

```
src/
  app/
    globals.css              # CSS custom properties for all themes
    page.js                  # Root page, AnimatePresence orchestration
    layout.js                # Next.js app layout
    api/
      ably-token/route.js    # Ably token request endpoint
  components/
    TypingTest.jsx           # Core typing UI, caret, keyboard input
    ConfigBar.jsx            # Mode/time/word-count chips
    Settings.jsx             # Language, mood, theme, sound effects modal
    Results.jsx              # Post-test stats screen
    History.jsx              # Past results viewer
    StatsPage.jsx            # Detailed statistics dashboard with filtering
    WpmGraph.jsx             # WPM trend visualization
    KeyboardHeatmap.jsx      # Key frequency and accuracy heatmap
    MultiplayerLobby.jsx     # Create/join room UI
    RaceView.jsx             # Live racing UI
    RaceResults.jsx          # Post-race leaderboard
    SnakeSplash.jsx          # Splash screen component
  store/
    gameStore.js             # Zustand store — single-player game state
    multiplayerStore.js      # Zustand store — multiplayer race state
```

## Environment Setup

### Multiplayer Racing

Multiplayer racing requires the `ABLY_API_KEY` environment variable. Create a `.env.local` file at the project root:

```
ABLY_API_KEY=your_ably_api_key_here
```

Get a free API key from [Ably](https://ably.com/) — the free tier includes generous rate limits for testing.

## Contributing

Contributions are welcome — bug fixes, new themes, new word pools, new languages, sound profiles, or UX improvements.

### How to contribute

1. **Fork** the repository and clone your fork.
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes.** A few conventions to follow:
   - Inline styles only — no CSS utility classes or CSS modules.
   - New themes go in [src/app/globals.css](src/app/globals.css) as `[data-theme="your-theme"]` blocks.
   - New word pools and moods go in [src/store/gameStore.js](src/store/gameStore.js) — see `MOOD_WORD_POOLS`, `MOOD_QUOTES`, `MOOD_STORIES` patterns.
   - Sound profiles are defined in `gameStore.js` — add to `KEYBOARD_SOUND_PROFILES`.
   - No TypeScript — the project is plain JavaScript.
4. **Commit** with a descriptive message (`feat:`, `fix:`, `chore:` prefixes are appreciated).
5. **Push** your branch and open a **Pull Request** against `main`.

### Good first contributions

- Add a new theme (see the `--bg`, `--main`, `--text`, `--sub`, `--sub-alt`, `--error`, `--error-extra` variables)
- Add words for a new language
- Add mood-specific word pools, quotes, or stories
- Add a new keyboard sound profile
- Improve caret smoothness or scrolling behavior in [TypingTest.jsx](src/components/TypingTest.jsx)
- Improve mobile/touch support
- Enhance the statistics dashboard with new metrics

### Reporting issues

Open a [GitHub Issue](https://github.com/m-Jawa-d/keyflows/issues) with steps to reproduce, expected vs. actual behavior, and your browser/OS.

## Contact

Questions or feedback: chudhryjawad@gmail.com


