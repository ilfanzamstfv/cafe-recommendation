create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  max_distance_km double precision not null default 5,
  minimum_rating double precision not null default 4.2,
  preferred_price text not null default 'MEDIUM',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  constraint user_preferences_price_check check (
    preferred_price in ('BUDGET', 'MEDIUM', 'PREMIUM', 'ANY')
  )
);

create table if not exists public.user_purposes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null,
  created_at timestamptz not null default now(),
  unique (user_id, purpose),
  constraint user_purposes_purpose_check check (
    purpose in ('WORK', 'STUDY', 'HANGOUT', 'DATE', 'MEETING', 'QUICK_COFFEE')
  )
);

create table if not exists public.user_cafe_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  interaction_type text not null,
  created_at timestamptz not null default now(),
  constraint user_cafe_interactions_type_check check (
    interaction_type in ('LIKE', 'UNLIKE', 'SAVE', 'VISITED', 'NOT_INTERESTED')
  )
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_purposes enable row level security;
alter table public.user_cafe_interactions enable row level security;
alter table public.favorites enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "preferences_select_own" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "preferences_insert_own" on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy "preferences_update_own" on public.user_preferences
  for update using (auth.uid() = user_id);

create policy "purposes_select_own" on public.user_purposes
  for select using (auth.uid() = user_id);

create policy "purposes_insert_own" on public.user_purposes
  for insert with check (auth.uid() = user_id);

create policy "purposes_delete_own" on public.user_purposes
  for delete using (auth.uid() = user_id);

create policy "interactions_select_own" on public.user_cafe_interactions
  for select using (auth.uid() = user_id);

create policy "interactions_insert_own" on public.user_cafe_interactions
  for insert with check (auth.uid() = user_id);

create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);

create index if not exists user_cafe_interactions_user_id_created_at_idx
  on public.user_cafe_interactions (user_id, created_at desc);

create index if not exists user_cafe_interactions_place_id_idx
  on public.user_cafe_interactions (place_id);

create index if not exists favorites_user_id_created_at_idx
  on public.favorites (user_id, created_at desc);
