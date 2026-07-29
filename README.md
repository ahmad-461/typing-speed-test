# ⚡ Typing Speed Test (TST) — Terminal Edition

A premium, highly polished, game-themed Next.js portfolio application designed to benchmark typing accuracy, speed (WPM), and typing consistency under pressure. Featuring a minimalist developer terminal aesthetics, dynamic AI-powered content streams, deep gamified progression systems, local error heatmaps, and a global leaderboard connected to a live Supabase database.

---

## 🎮 Key Systems & Core Features

### 1. Gamified Mission Control Hub (`/`)
The traditional landing page is replaced with a premium, fully-interactive retro **Mission Select Game Menu**:
*   **6 Immersive Practice Modes**:
    *   `Code Arena`: Benchmarks your performance on real, multi-language code blocks (TypeScript, Python, HTML/CSS).
    *   `Knowledge Quest`: Educational trivia, core science facts, and advanced vocabulary passages.
    *   `AI Lab`: Futuristic paragraphs focusing on deep learning, neural networks, and AI trends.
    *   `World Explorer`: Rich descriptive passages covering geography, landmarks, and travel.
    *   `Weak-Key Drill`: Dynamically customized passages prioritizing keys that you historically struggle with.
    *   `Speed Sprint`: High-pressure 20-second flat countdown utilizing ultra-short, punchy sentences (~15-20 words).
*   **Interactive Parameters Console**: Segmented control tabs prefixed with `> MODE:`, `> DURATION:`, `> LENGTH:`, and `> DIFFICULTY:`. Allows players to toggle **Punctuation** and **Numbers** dynamically, with instant visual feedback and no layout shifts.
*   **Ghost Race Mode**: Race in real-time against your previous personal best run. The ghost cursor starts automatically and moves at a constant linear speed calculated from your personal best record's duration and characters.

### 2. Gamification & Progression Engine
*   **XP & Leveling System**: Earn experience points (XP) retroactively on every completed test. Watch your levels promote in real-time!
*   **Daily Streaks**: Consecutive days of completed tests grant timezone-safe scaling XP modifiers (`+10%` for 3-4 days, `+15%` for 5-6 days, `+20%` for 7+ days) to incentivize daily training.
*   **Achievements & Titles**: Over a dozen unique achievements (e.g., reaching 50+ or 80+ WPM benchmarks, perfect 100% accuracy, level promotions, completed test milestones) with custom unlock timestamps persisted to your operator log.

### 3. Diagnostics & Analytics Dashboard (`/history`)
*   **Player Profile HUD**: Visually rich dashboard including your current rank, XP progress bar, active streak, and personal speed goal.
*   **QWERTY Weak-Key Heatmap**: Tracks your keyboard error metrics mapping expected letters (A-Z and Spacebar) vs actual incorrect inputs. Overlaid with an electric-blue opacity gradient to visually target your weak spots.
*   **Active Skill Profile**: Represents your current capabilities (Speed, Accuracy, and Consistency) computed from your last 10 completed tests.
*   **Practice Mode Breakdown**: Chronological and aggregated log of completed tests, averages, and milestones.

### 4. Advanced Technical Integrations
*   **Dynamic Gemini AI Generator**: Integrated with Google's `@google/generative-ai` SDK using `gemini-flash-lite-latest` to stream real-time, prompt-engineered typing passages tailored to your chosen difficulty, category, punctuation/numbers toggles, and optional weak keys. Features an instantaneous, silent fallback to static local passages in case of rate limits or offline events.
*   **Adaptive AI Coach**: Sends your typing metrics to `/api/coach-feedback` where a Gemini prompt evaluates your stats (WPM, accuracy, consistency) and returns 1-2 sentences of highly customized, actionable coaching advice.
*   **Synthesized Audio Engine**: Keystroke sounds (correct and incorrect clicks) and event chimes (completion, levels, achievements) are synthesized programmatically using the native browser **Web Audio API** (zero external assets loaded!).
*   **Unlockable Terminal Skins**: Swap between four gorgeous CRT/terminal-themed accent color profiles ("Electric Blue", "Emerald Terminal", "Amber CRT", "Crimson Protocol") bound to specific levels and achievements.
*   **Branded Result Card Exporter**: Utilizing `html2canvas` to render and export a gorgeous 16:9 performance certificate showing your stats, Operator Name, and active theme colors. You can copy the image directly to your clipboard or download it as a PNG.

### 5. Terminal Identity & Quick Command Pages
Directly linked in the Mission Control Footer under QUICK COMMANDS:
*   `[CMD] data_protocol.log` (`/data-protocol`): Terminal diagnostic readout covering GDPR/data handling rules, equipped with an interactive data purge tool.
*   `[CMD] rules.txt` (`/rules-of-engagement`): Clean rules, tips, and mission objectives layout.
*   `[CMD] changelog.log` (`/changelog`): Comprehensive developer roadmap (v1.0 to v1.6 patch notes).

---

## 🛠️ Technical Stack

*   **Framework**: Next.js 15 (App Router)
*   **Styling**: Tailwind CSS v3 with custom theme config and utility classes
*   **Runtime/Language**: TypeScript & Node.js
*   **Database**: Supabase (PostgreSQL client with Row Level Security)
*   **AI Engine**: Google Gemini API (`gemini-flash-lite-latest`)
*   **Client Dependencies**: `html2canvas` (with strict HEX/RGB constraints to prevent canvas export breaking)

---

## 🚀 Setup & Local Installation

### 1. Clone & Install Dependencies
Ensure you have Node.js installed, then run:
```bash
git clone https://github.com/ahmad-461/typing-speed-test.git
cd typing-speed-test
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` in the root of the project with the following keys:
```bash
# Gemini AI Configuration
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GEMINI_MODEL="gemini-flash-lite-latest"

# Supabase Configurations
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_PUBLIC_KEY"
```

*Note: For build processes or CI pipelines, the Supabase wrapper silently handles missing environment variables with a warning fallback to prevent static generation failures.*

### 3. Setup PostgreSQL Table Schema
Apply the updated database definition located in the project's root `schema.sql` inside your Supabase SQL editor. It defines the structure for storing leaderboard rankings with Row Level Security (RLS) and check constraints:

```sql
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid (),
  name text not null check (length(name) <= 25),
  wpm integer not null,
  accuracy numeric not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'custom')),
  category text not null default 'custom' check (category in ('code_arena', 'knowledge_quest', 'ai_lab', 'world_explorer', 'weak_key_drill', 'speed_sprint', 'custom')),
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.scores enable row level security;

-- Create policies
create policy "Allow public insert" on public.scores for insert with check (true);
create policy "Allow public select" on public.scores for select using (true);
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser.

---

## 🏗️ Development and Production Builds

Verify compilation, static generation, type checks, and lint configurations:
```bash
# Compile and build the optimized production package
npm run build

# Run the project linter
npm run lint
```
