alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.watchlist enable row level security;
alter table public.movie_likes enable row level security;
alter table public.user_activity enable row level security;
alter table public.user_movie_interactions enable row level security;
alter table public.user_taste_profiles enable row level security;
alter table public.movie_recommendations enable row level security;
alter table public.movie_comments enable row level security;
alter table public.direct_messages enable row level security;
alter table public.curated_lists enable row level security;
alter table public.curated_list_items enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
on public.profiles for select
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Movies are readable" on public.movies;
create policy "Movies are readable"
on public.movies for select
using (true);

drop policy if exists "Users can read own watchlist" on public.watchlist;
create policy "Users can read own watchlist"
on public.watchlist for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own watchlist items" on public.watchlist;
create policy "Users can insert own watchlist items"
on public.watchlist for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own watchlist items" on public.watchlist;
create policy "Users can delete own watchlist items"
on public.watchlist for delete
using (auth.uid() = user_id);

drop policy if exists "Users can update own watchlist items" on public.watchlist;
create policy "Users can update own watchlist items"
on public.watchlist for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own likes" on public.movie_likes;
create policy "Users can read own likes"
on public.movie_likes for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own likes" on public.movie_likes;
create policy "Users can insert own likes"
on public.movie_likes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own likes" on public.movie_likes;
create policy "Users can delete own likes"
on public.movie_likes for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own activity" on public.user_activity;
create policy "Users can read own activity"
on public.user_activity for select
using (auth.uid() = user_id);

drop policy if exists "Users can read own interactions" on public.user_movie_interactions;
create policy "Users can read own interactions"
on public.user_movie_interactions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own interactions" on public.user_movie_interactions;
create policy "Users can insert own interactions"
on public.user_movie_interactions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own interactions" on public.user_movie_interactions;
create policy "Users can update own interactions"
on public.user_movie_interactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own interactions" on public.user_movie_interactions;
create policy "Users can delete own interactions"
on public.user_movie_interactions for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own taste profile" on public.user_taste_profiles;
create policy "Users can read own taste profile"
on public.user_taste_profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own taste profile" on public.user_taste_profiles;
create policy "Users can insert own taste profile"
on public.user_taste_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own taste profile" on public.user_taste_profiles;
create policy "Users can update own taste profile"
on public.user_taste_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own recommendations" on public.movie_recommendations;
create policy "Users can read own recommendations"
on public.movie_recommendations for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own recommendations" on public.movie_recommendations;
create policy "Users can insert own recommendations"
on public.movie_recommendations for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own recommendations" on public.movie_recommendations;
create policy "Users can update own recommendations"
on public.movie_recommendations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "Curated lists public read" on public.curated_lists;
create policy "Curated lists public read"
on public.curated_lists for select
using (is_public = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins manage curated lists" on public.curated_lists;
create policy "Admins manage curated lists"
on public.curated_lists for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Curated list items public read" on public.curated_list_items;
create policy "Curated list items public read"
on public.curated_list_items for select
using (
  exists (
    select 1 from public.curated_lists l
    where l.id = curated_list_items.list_id and l.is_public = true
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins manage curated list items" on public.curated_list_items;
create policy "Admins manage curated list items"
on public.curated_list_items for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Users can read own friend requests" on public.friend_requests;
create policy "Users can read own friend requests"
on public.friend_requests for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can create own friend requests" on public.friend_requests;
create policy "Users can create own friend requests"
on public.friend_requests for insert
with check (auth.uid() = sender_id and sender_id <> receiver_id);

drop policy if exists "Receivers can update friend requests" on public.friend_requests;
create policy "Receivers can update friend requests"
on public.friend_requests for update
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
on public.friendships for select
using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can delete their friendships" on public.friendships;
create policy "Users can delete their friendships"
on public.friendships for delete
using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Group owners can manage groups" on public.groups;
create policy "Group owners can manage groups"
on public.groups for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Group members can view groups" on public.groups;
create policy "Group members can view groups"
on public.groups for select
using (
  auth.uid() = owner_id
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id and gm.user_id = auth.uid()
  )
);

drop policy if exists "Group members can view group members" on public.group_members;
create policy "Group members can view group members"
on public.group_members for select
using (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id and g.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
  )
);

drop policy if exists "Group owners can manage group members" on public.group_members;
create policy "Group owners can manage group members"
on public.group_members for all
using (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id and g.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id and g.owner_id = auth.uid()
  )
);

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
on storage.objects for delete
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
