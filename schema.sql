-- schema.sql
-- Create scores table for global leaderboard

create table if
  not exists public.scores (
    id uuid primary key default gen_random_uuid (),
    name text not null check (length(name) <= 25), -- Allow a bit of margin, client restricts to 20
    wpm integer not null,
    accuracy numeric not null,
    difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'custom')),
    category text not null default 'custom' check (category in ('code_arena', 'knowledge_quest', 'ai_lab', 'world_explorer', 'weak_key_drill', 'speed_sprint', 'custom')),
    created_at timestamp with time zone default now() not null
  );

-- Enable Row Level Security
alter table public.scores enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow public insert" on public.scores;
drop policy if exists "Allow public select" on public.scores;

-- Create policies
create policy "Allow public insert" on public.scores
  for insert
  with check (true);

create policy "Allow public select" on public.scores
  for select
  using (true);

-- ==========================================
-- MANUAL UPDATE INSTRUCTIONS FOR LIVE DATABASE
-- ==========================================
-- If your Supabase database already has a `scores` table with historical data,
-- do NOT drop the table. Instead, execute the following SQL commands in the
-- Supabase SQL Editor to update the constraints and defaults safely:
--
-- 1. Drop the legacy check constraint:
--    ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_category_check;
--
-- 2. Add the updated check constraint for all 6 practice modes plus 'custom':
--    ALTER TABLE public.scores ADD CONSTRAINT scores_category_check CHECK (category IN ('code_arena', 'knowledge_quest', 'ai_lab', 'world_explorer', 'weak_key_drill', 'speed_sprint', 'custom'));
--
-- 3. Update the default value of the category column:
--    ALTER TABLE public.scores ALTER COLUMN category SET DEFAULT 'custom';
-- ==========================================
