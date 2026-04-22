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

## Architecture

This is a Next.js 14 App Router project (JavaScript, no TypeScript) styled entirely with inline styles — there are no CSS modules or Tailwind classes. All theming is done via CSS custom properties defined in [src/app/globals.css](src/app/globals.css).

### State: Zustand store ([src/store/gameStore.js](src/store/gameStore.js))

Single store drives the entire game. Key concepts:

- **`status`**: `'idle' | 'active' | 'finished'` — transitions on first keypress, timer end, or word completion.
- **`mode`**: `'time'` (countdown, infinite words) or `'words'` (fixed word count, no timer).
- **`wordStates`**: parallel array to `words`; each entry is an array of `'correct' | 'incorrect' | 'extra' | null` per letter.
- **`typedWords`**: what the user has actually typed per word slot.
- In `time` mode, words are generated in batches of 80 initially, then 40 more appended when within 10 words of the end — this is the infinite scroll mechanism.
- `_recalcStats()` is private (convention only) and recalculates WPM/accuracy from scratch on every keypress and tick — spaces between words count as 1 correct character.

### Components

- **[TypingTest.jsx](src/components/TypingTest.jsx)** — the core UI. Captures all keyboard input via a `window` keydown listener (not the hidden `<input>`). The hidden `<input>` exists solely to track focus state for the blur overlay. Caret position is computed by measuring DOM `getBoundingClientRect()` on individual letter `<span>`s. Line scrolling is CSS `translateY` driven by a `scrollLines` counter incremented when the caret exceeds 1.8× the line height.
- **[ConfigBar.jsx](src/components/ConfigBar.jsx)** — mode/option selector chips, fades out when `focused && active`.
- **[Results.jsx](src/components/Results.jsx)** — shown when `status === 'finished'`; Tab/Enter restart.

### Page ([src/app/page.js](src/app/page.js))

Uses `AnimatePresence` from framer-motion to cross-fade between the test view and results view based on `status`. Header and footer fade out when the user is actively typing (focus + active state propagated up via `onFocusChange` callback).

### Design tokens (CSS variables)

| Variable | Purpose |
|---|---|
| `--bg` | Page background (#323437) |
| `--main` | Accent/caret/highlight (#e2b714 yellow) |
| `--text` | Correctly typed letters |
| `--sub` | Untyped letters, hints |
| `--sub-alt` | Chip backgrounds |
| `--error` | Incorrect letters, error underline |
| `--error-extra` | Extra characters beyond word length |
