-- MovieMatch onboarding and recommendation migration.
-- Run this after the base schema, then run supabase/rls.sql.

alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists onboarding_skipped boolean default false;
alter table public.profiles add column if not exists onboarding_completed_at timestamp with time zone;

alter table public.movies add column if not exists budget bigint;
alter table public.movies add column if not exists revenue bigint;
alter table public.movies add column if not exists status text;
alter table public.movies add column if not exists genre_ids jsonb;
alter table public.movies add column if not exists director_ids jsonb;
alter table public.movies add column if not exists director_names jsonb;
alter table public.movies add column if not exists writer_ids jsonb;
alter table public.movies add column if not exists writer_names jsonb;
alter table public.movies add column if not exists cast_ids jsonb;
alter table public.movies add column if not exists cast_names jsonb;
alter table public.movies add column if not exists keyword_ids jsonb;
alter table public.movies add column if not exists keyword_names jsonb;
alter table public.movies add column if not exists original_language text;
alter table public.movies add column if not exists tmdb_vote_count integer;
alter table public.movies add column if not exists popularity numeric;
alter table public.movies add column if not exists adult boolean default false;

create table if not exists public.user_movie_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  interaction_type text not null check (interaction_type in (
    'liked','disliked','watched','watchlist','not_interested','clicked','trailer_watched',
    'onboarding_like','onboarding_dislike','onboarding_seen','onboarding_not_seen','onboarding_not_interested','onboarding_skip'
  )),
  source text default 'manual' check (source in ('manual','onboarding','watchlist','explore','search','movie_detail','match')),
  rating numeric,
  created_at timestamp with time zone default now()
);

create table if not exists public.user_taste_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  genre_weights jsonb default '{}'::jsonb,
  director_weights jsonb default '{}'::jsonb,
  actor_weights jsonb default '{}'::jsonb,
  writer_weights jsonb default '{}'::jsonb,
  keyword_weights jsonb default '{}'::jsonb,
  language_weights jsonb default '{}'::jsonb,
  decade_weights jsonb default '{}'::jsonb,
  runtime_weights jsonb default '{}'::jsonb,
  rating_preference numeric,
  updated_at timestamp with time zone default now()
);

create table if not exists public.movie_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  score numeric default 0,
  reason text,
  section text default 'recommended',
  created_at timestamp with time zone default now(),
  unique(user_id, movie_id, section)
);

create index if not exists user_movie_interactions_user_id_idx on public.user_movie_interactions(user_id);
create index if not exists user_movie_interactions_movie_id_idx on public.user_movie_interactions(movie_id);
create index if not exists user_taste_profiles_user_id_idx on public.user_taste_profiles(user_id);
create index if not exists movie_recommendations_user_id_idx on public.movie_recommendations(user_id);
