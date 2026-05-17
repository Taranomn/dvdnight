alter table public.movies add column if not exists movie_cast jsonb;
alter table public.movies add column if not exists movie_crew jsonb;
