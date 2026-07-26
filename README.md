# Typing Speed Test ⚡

A highly polished, portfolio-quality Next.js application designed to benchmark keyboard accuracy and words-per-minute (WPM) under pressure. Featuring a minimalist developer terminal design, AI-powered passage generation, and a persistent global leaderboard.

## Features

- **Dynamic AI Passages**: Serverless endpoint utilizing the Gemini API (`gemini-flash-lite-latest`) to stream real-time typing passages tailored to easy (~30 words), medium (~60 words), or hard (~100 words) guidelines. Includes a 100% silent, instantaneous static fallback system on any network or API timeout event.
- **Premium Typing Experience**: Character-by-character accuracy capturing driven directly via a hidden text-input buffer. This ensures robust physical and virtual mobile keyboard support (no complex on-screen custom keyboard hacks) and zero layout shift.
- **Persistent Global Leaderboard**: Beautiful, paginated standings table connected to a live Supabase backend. Displays the top 50 typing performances filtered dynamically by difficulty level.
- **Micro-interactions & Polish**: Smooth CSS page mount fade-ins, aesthetic active focus states, custom blinking terminal cursors, responsive compatibility from 360px up to 1920px width screens, and strict adherence to AA accessibility standards (only HEX/RGB colors used).

---

## Technical Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL client)
- **AI API**: Google Gemini (`@google/generative-ai` compatible HTTPS)

---

## Setup & Local Installation

### 1. Clone & Install Dependencies
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
Apply the database definition located in the project's root `schema.sql` inside your Supabase SQL editor. It defines the structure for storing leaderboard rankings:

```sql
-- Schema SQL setup:
create table if not exists public.scores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  wpm integer not null,
  accuracy numeric(5,2) not null,
  difficulty text not null
);

-- RLS (Row Level Security) Configuration
alter table public.scores enable row level security;

create policy "Allow public read access" on public.scores
  for select using (true);

create policy "Allow public insert access" on public.scores
  for insert with check (true);
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to review.

---

## Build Commands
Verify compilation, type checks, and lint configurations:
```bash
# Production optimization compilation
npm run build

# Code standards linter
npm run lint
```
