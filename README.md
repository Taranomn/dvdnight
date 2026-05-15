# Movie Night

A production-ready dark cinematic movie watchlist app built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, TMDB, and OMDb.

## Features

- Email/password sign up, login, logout, protected pages, and editable profiles.
- TMDB discovery for trending, popular, top-rated, search, details, credits, videos, and external IDs.
- OMDb enrichment for IMDb and Rotten Tomatoes ratings, with missing ratings shown as `N/A`.
- Server-only API access so TMDB and OMDb keys never reach the browser.
- Watchlist add/remove, saved movie caching, filtering, sorting, and local watchlist search.
- Friend search, requests, accept/decline, remove friend, and bidirectional friendships.
- Friend watchlist comparison with common movies, random picker, and highest-rated picker.
- Group creation, friend member adds, and group watchlist matching across all members.
- Explore recommendations based on liked movies, watchlist genres, watched status, and activity.
- Admin panel for curated playlists and cached movie/user management.
- Profile image upload with an in-browser crop preview.
- Clickable actor/director filmography pages with sorting.

## Setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Then run `supabase/rls.sql`.
4. If you already created the project before these features were added, re-run both SQL files so the new `movie_likes`, `user_activity`, `curated_lists`, profile `role`, and avatar storage policies exist.
5. Create a TMDB account and generate an API key or bearer token.
6. Create an OMDb API key.
7. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TMDB_API_KEY=
TMDB_BEARER_TOKEN=
OMDB_API_KEY=
```

8. Install and run locally:

```bash
npm install
npm run dev
```

9. Sign up as two users.
10. Add movies to each watchlist.
11. Search for the other user from `/friends` and send a friend request.
12. Log in as the second user and accept the request from `/friends/requests`.
13. Open `/match`, choose the friend, and compare common watchlist movies.
14. Optionally create a group from `/groups`, add friends, and compare movies everyone has saved.

## Admin Setup

After signing up, promote your account in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Then open `/admin` to create curated playlists and add movies by TMDB ID. Curated playlists are available at `/lists/{slug}`.

## API Notes

TMDB is the primary movie source. OMDb is only called from server code after TMDB returns an IMDb ID. Rotten Tomatoes is not guaranteed by OMDb, so the UI displays `N/A` whenever that rating is unavailable.

When a user adds a movie to their watchlist, the app fetches full TMDB and OMDb data, upserts the movie by `tmdb_id` into the local `movies` table, and then inserts the `watchlist` row with a unique `(user_id, movie_id)` constraint.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
