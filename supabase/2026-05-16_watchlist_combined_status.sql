alter table public.watchlist
  drop constraint if exists watchlist_status_check;

alter table public.watchlist
  add constraint watchlist_status_check
  check (status in ('want_to_watch', 'watched', 'watched_watchlist'));
