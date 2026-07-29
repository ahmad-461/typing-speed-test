-- schema.sql
-- Create scores table for global leaderboard

create table if
  not exists public.scores (
    id uuid primary key default gen_random_uuid (),
    name text not null check (length(name) <= 25), -- Allow a bit of margin, client restricts to 20
    wpm integer not null,
    accuracy numeric not null,
    difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'custom')),
    category text not null default 'code_arena' check (category in ('code_arena', 'knowledge_quest', 'ai_lab', 'world_explorer', 'speed_sprint', 'weak_key_drill', 'programming', 'general_knowledge', 'custom')),
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
