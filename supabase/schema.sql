create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique,
  display_name text,
  avatar_url text,
  role text check (role in ('user', 'admin')) default 'user',
  onboarding_completed boolean default false,
  onboarding_skipped boolean default false,
  onboarding_completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.profiles add column if not exists email text unique;
alter table public.profiles add column if not exists role text check (role in ('user', 'admin')) default 'user';
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists onboarding_skipped boolean default false;
alter table public.profiles add column if not exists onboarding_completed_at timestamp with time zone;

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique not null,
  imdb_id text,
  title text not null,
  overview text,
  poster_path text,
  backdrop_path text,
  release_date date,
  release_year integer,
  runtime integer,
  budget bigint,
  revenue bigint,
  status text,
  genres jsonb,
  genre_ids jsonb,
  director_ids jsonb,
  director_names jsonb,
  writer_ids jsonb,
  writer_names jsonb,
  cast_ids jsonb,
  cast_names jsonb,
  keyword_ids jsonb,
  keyword_names jsonb,
  original_language text,
  tmdb_rating numeric,
  tmdb_vote_count integer,
  imdb_rating numeric,
  rotten_tomatoes_rating text,
  popularity numeric,
  adult boolean default false,
  trailer_key text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

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

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  status text check (status in ('want_to_watch', 'watched', 'watched_watchlist')) default 'want_to_watch',
  created_at timestamp with time zone default now(),
  unique(user_id, movie_id)
);

create table if not exists public.movie_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, movie_id)
);

create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete set null,
  activity_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

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

create table if not exists public.movie_comments (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  rating numeric check (rating is null or (rating >= 0 and rating <= 10)),
  parent_id uuid references public.movie_comments(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  read_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  check (sender_id <> receiver_id)
);

create table if not exists public.curated_lists (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  is_public boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.curated_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.curated_lists(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  position integer default 0,
  note text,
  created_at timestamp with time zone default now(),
  unique(list_id, movie_id)
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  friend_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists movies_set_updated_at on public.movies;
create trigger movies_set_updated_at
before update on public.movies
for each row execute procedure public.set_updated_at();

drop trigger if exists friend_requests_set_updated_at on public.friend_requests;
create trigger friend_requests_set_updated_at
before update on public.friend_requests
for each row execute procedure public.set_updated_at();

drop trigger if exists curated_lists_set_updated_at on public.curated_lists;
create trigger curated_lists_set_updated_at
before update on public.curated_lists
for each row execute procedure public.set_updated_at();

drop trigger if exists movie_comments_set_updated_at on public.movie_comments;
create trigger movie_comments_set_updated_at
before update on public.movie_comments
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index if not exists watchlist_user_id_idx on public.watchlist(user_id);
create index if not exists watchlist_movie_id_idx on public.watchlist(movie_id);
create index if not exists movie_likes_user_id_idx on public.movie_likes(user_id);
create index if not exists user_activity_user_id_idx on public.user_activity(user_id);
create index if not exists user_movie_interactions_user_id_idx on public.user_movie_interactions(user_id);
create index if not exists user_movie_interactions_movie_id_idx on public.user_movie_interactions(movie_id);
create index if not exists user_taste_profiles_user_id_idx on public.user_taste_profiles(user_id);
create index if not exists movie_recommendations_user_id_idx on public.movie_recommendations(user_id);
create index if not exists movie_comments_movie_id_idx on public.movie_comments(movie_id);
create index if not exists movie_comments_user_id_idx on public.movie_comments(user_id);
create index if not exists direct_messages_sender_idx on public.direct_messages(sender_id);
create index if not exists direct_messages_receiver_idx on public.direct_messages(receiver_id);
create index if not exists curated_list_items_list_id_idx on public.curated_list_items(list_id);
create index if not exists movies_tmdb_id_idx on public.movies(tmdb_id);
create index if not exists friend_requests_sender_idx on public.friend_requests(sender_id);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id);
create index if not exists friendships_user_idx on public.friendships(user_id);
create index if not exists group_members_group_idx on public.group_members(group_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
