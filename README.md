# NOKY — Typing Speed Test ⚡

A premium, full-stack typing speed and accuracy platform with a distinctive dark cyber-terminal identity. Built as a complete typing game and learning platform — not just a speed test, but a persistent, gamified experience with AI-powered coaching, multiple practice modes, and deep progress tracking.

**Live:** [typing-speed-test-pi-smoky.vercel.app](https://typing-speed-test-pi-smoky.vercel.app)

---

## Features

### Core Typing Experience
- **6 Practice Modes**: Code Arena, Knowledge Quest, AI Lab, World Explorer, Speed Sprint, and Weak-Key Drill — each with its own content focus and mechanics
- **3 Test Types**: Time Mode (15s/30s/60s/120s), Word Count Mode (10/25/50/100 words), and classic Passage Mode (Easy/Medium/Hard)
- **AI-Generated Passages**: Dynamic content via the Gemini API (`gemini-flash-lite-latest`), tailored per category and difficulty, with a 100% silent static fallback on any API failure or timeout
- **Live WPM, Accuracy & Consistency tracking**, character-by-character correctness highlighting, and Ghost Race mode to race your personal best

### Identity & Progression
- **Identity Gate**: Terminal-style "callsign" entry establishes a player identity that persists across sessions, with full per-player data isolation — each name gets its own completely separate history, stats, and progress
- **Gamification System**: XP, 6-tier level progression (Beginner → Typing Legend), unlockable achievements, and daily streak tracking with bonus XP
- **Unlockable Terminal Skins**: 4 alternate accent-color themes (Electric Blue, Emerald Terminal, Amber CRT, Crimson Protocol) earned through achievements, applied globally via CSS custom properties
- **Personal Goal-Setting**: Set a target WPM and track progress toward it, with celebratory unlock moments

### AI-Powered Coaching
- **Adaptive AI Coach**: After every test, Gemini analyzes your specific performance data (WPM, accuracy, mistyped characters) to generate a short, actionable coaching tip — not generic praise
- **Weak-Key Drill Mode**: Spaced-repetition-style practice generating passages that specifically target your weakest keys, based on accumulated error tracking

### Analytics & History
- **Full Player Dashboard** (`/history`): Player profile card, XP progress, achievements grid with unlock dates, per-mode performance breakdown, week-over-week trend comparisons, a chronological milestone timeline, a keyboard weak-key heatmap, and a skill profile (Speed/Accuracy/Consistency ratings)

### Social & Competitive
- **Global Leaderboard**: Podium-style top-3 display plus a dense terminal-log-style ranked list, filterable by difficulty, with the current player's own entry highlighted
- **Shareable Result Cards**: Export a branded, styled image of your results (WPM, accuracy, consistency, level) via `html2canvas`, ready to share

### Polish & Experience
- **Optional keyboard sound feedback** synthesized via the Web Audio API (zero asset loading)
- **Mission Control footer**: Live system status, quick-command navigation, real player stats, and ambient terminal motion effects
- **Data Protocol, Rules of Engagement, and Changelog pages** — honest, in-world alternatives to typical legal/contact boilerplate
- Fully responsive from 360px to 1920px, WCAG AA color contrast, smooth GPU-accelerated animations throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 (CSS custom properties for theming) |
| AI | Google Gemini API (`gemini-flash-lite-latest`) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security) |
| Image Export | `html2canvas` |
| Hosting | Vercel |
| State/Persistence | localStorage (per-player namespaced) + Supabase (global leaderboard) |

---

## Setup & Local Installation

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ahmad-461/typing-speed-test.git
cd typing-speed-test
npm install
