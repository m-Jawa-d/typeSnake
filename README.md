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
- All styling is inline styles + CSS variables — no Tailwind, no CSS modules

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router, JavaScript)
- [Zustand](https://zustand-demo.pmnd.rs/) — global state
- [Framer Motion](https://www.framer.com/motion/) — transitions
- [Lucide React](https://lucide.dev/) — icons
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
    globals.css       # CSS custom properties for all themes
    page.js           # Root page, AnimatePresence orchestration
  components/
    TypingTest.jsx    # Core typing UI, caret, keyboard input
    ConfigBar.jsx     # Mode/time/word-count chips
    Settings.jsx      # Language, mood, theme modal
    Results.jsx       # Post-test stats screen
  store/
    gameStore.js      # Zustand store — all game state and logic
```

## Contributing

Contributions are welcome — bug fixes, new themes, new word pools, new languages, or UX improvements.

### How to contribute

1. **Fork** the repository and clone your fork.
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes.** A few conventions to follow:
   - Inline styles only — no CSS utility classes or CSS modules.
   - New themes go in [src/app/globals.css](src/app/globals.css) as `[data-theme="your-theme"]` blocks.
   - New word pools go in [src/store/gameStore.js](src/store/gameStore.js) — see `MOOD_WORD_POOLS` for the pattern.
   - No TypeScript — the project is plain JavaScript.
4. **Commit** with a descriptive message (`feat:`, `fix:`, `chore:` prefixes are appreciated).
5. **Push** your branch and open a **Pull Request** against `main`.

### Good first contributions

- Add a new theme (see the `--bg`, `--main`, `--text`, `--sub`, `--sub-alt`, `--error`, `--error-extra` variables)
- Add words for a new language
- Add mood-specific word pools, quotes, or stories
- Improve caret smoothness or scrolling behavior in [TypingTest.jsx](src/components/TypingTest.jsx)
- Improve mobile/touch support

### Reporting issues

Open a [GitHub Issue](https://github.com/m-Jawa-d/keyflows/issues) with steps to reproduce, expected vs. actual behavior, and your browser/OS.

## Contact

Questions or feedback: chudhryjawad@gmail.com


