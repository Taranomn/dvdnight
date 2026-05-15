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

drop trigger if exists movie_comments_set_updated_at on public.movie_comments;
create trigger movie_comments_set_updated_at
before update on public.movie_comments
for each row execute procedure public.set_updated_at();

create index if not exists movie_comments_movie_id_idx on public.movie_comments(movie_id);
create index if not exists movie_comments_user_id_idx on public.movie_comments(user_id);
create index if not exists direct_messages_sender_idx on public.direct_messages(sender_id);
create index if not exists direct_messages_receiver_idx on public.direct_messages(receiver_id);

alter table public.movie_comments enable row level security;
alter table public.direct_messages enable row level security;

drop policy if exists "Movie comments are readable" on public.movie_comments;
create policy "Movie comments are readable"
on public.movie_comments for select
using (true);

drop policy if exists "Users can create own movie comments" on public.movie_comments;
create policy "Users can create own movie comments"
on public.movie_comments for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own movie comments" on public.movie_comments;
create policy "Users can update own movie comments"
on public.movie_comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own movie comments" on public.movie_comments;
create policy "Users can delete own movie comments"
on public.movie_comments for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their direct messages" on public.direct_messages;
create policy "Users can read their direct messages"
on public.direct_messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send direct messages" on public.direct_messages;
create policy "Users can send direct messages"
on public.direct_messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.friendships f
    where f.user_id = sender_id and f.friend_id = receiver_id
  )
);
