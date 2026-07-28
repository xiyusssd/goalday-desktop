-- GoalDay cloud sync schema.
-- Run this in your Supabase project's SQL editor once. Safe to re-run after upgrades.

-- Migration: add the daily-plan period column to existing installs.
alter table if exists public.tasks add column if not exists scheduled_period text;
-- Migration: add the recurrence column to existing installs.
alter table if exists public.tasks add column if not exists recurrence text;
-- Migration: add the due-date (deadline) column to existing installs.
alter table if exists public.tasks add column if not exists due_date text;
-- Migration: add the recurring-series column to existing installs.
alter table if exists public.tasks add column if not exists series_id text;

create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  notes text not null default '',
  status text not null default 'todo',
  priority text not null default 'medium',
  scheduled_date text,
  due_date text,
  scheduled_period text,
  order_index integer not null default 0,
  goal_id text,
  recurrence text,
  series_id text,
  created_at bigint not null,
  updated_at bigint not null,
  completed_at bigint,
  deleted boolean not null default false
);

create table if not exists public.journals (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  content text not null default '',
  mood integer,
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false
);

create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  color text not null default '#6366f1',
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false
);

-- 记账 (money tracking).
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'expense',
  amount double precision not null default 0,
  category text not null default 'other',
  note text not null default '',
  date text not null,
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false
);

-- 健身 (workout log).
create table if not exists public.workouts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'other',
  duration_min integer not null default 0,
  calories integer,
  sets integer,
  note text not null default '',
  date text not null,
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false
);

-- 备忘录 (sticky notes).
create table if not exists public.notes (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  color text not null default '#fde68a',
  pinned boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false
);

create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists journals_user_idx on public.journals (user_id);
create index if not exists goals_user_idx on public.goals (user_id);
create index if not exists transactions_user_idx on public.transactions (user_id);
create index if not exists workouts_user_idx on public.workouts (user_id);
create index if not exists notes_user_idx on public.notes (user_id);

-- Row Level Security: each user can only touch their own rows.
alter table public.tasks enable row level security;
alter table public.journals enable row level security;
alter table public.goals enable row level security;
alter table public.transactions enable row level security;
alter table public.workouts enable row level security;
alter table public.notes enable row level security;

create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journals" on public.journals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own workouts" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
