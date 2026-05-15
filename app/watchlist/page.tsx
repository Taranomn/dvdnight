import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { MovieCard } from "@/components/MovieCard";
import { removeMovieAction } from "@/lib/actions";
import { MovieStatusActions } from "@/components/MovieStatusActions";
import { requireUser } from "@/lib/supabase/server";
import { getUserWatchlist } from "@/lib/watchlist";
import { getBestComparableRating } from "@/lib/utils";

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; genre?: string }>;
}) {
  const user = await requireUser();
  const { q = "", sort = "created_at", genre = "" } = await searchParams;
  const items = await getUserWatchlist(user.id);
  const genres = Array.from(new Set(items.flatMap((item) => item.movies.genres?.map((g) => g.name) ?? []))).sort();
  const filtered = items
    .filter((item) => item.movies.title.toLowerCase().includes(q.toLowerCase()))
    .filter((item) => (genre ? item.movies.genres?.some((g) => g.name === genre) : true))
    .sort((a, b) => {
      if (sort === "rating") return getBestComparableRating(b.movies) - getBestComparableRating(a.movies);
      if (sort === "release_date") return String(b.movies.release_date ?? "").localeCompare(String(a.movies.release_date ?? ""));
      if (sort === "title") return a.movies.title.localeCompare(b.movies.title);
      return String(b.created_at).localeCompare(String(a.created_at));
    });

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">My Watchlist</h1>
          <p className="mt-2 text-zinc-400">{items.length} movies saved</p>
        </div>
        <Link href="/search" className="primary-button px-5 py-3">
          Add Movies
        </Link>
      </div>
      <form className="mt-6 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input name="q" defaultValue={q} placeholder="Search in watchlist..." className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-11 pr-4 outline-none" />
        </div>
        <select name="genre" defaultValue={genre} className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4">
          <option value="">All genres</option>
          {genres.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4">
          <option value="created_at">Date added</option>
          <option value="rating">Rating</option>
          <option value="release_date">Release date</option>
          <option value="title">Title</option>
        </select>
      </form>
      <div className="mt-8">
        {filtered.length ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filtered.map((item) => (
              <div key={item.id} className="glass rounded-3xl p-3">
                <MovieCard movie={item.movies} showWatchlistButton={false} />
                <div className="mt-3">
                  <MovieStatusActions tmdbId={item.movies.tmdb_id} movieId={item.movie_id} status={item.status} />
                </div>
                <form action={removeMovieAction.bind(null, item.movie_id, item.movies.tmdb_id)} className="mt-3">
                  <button className="secondary-button w-full px-3 py-2 text-sm">Remove</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your watchlist is empty"
            message="Start adding movies to find matches with friends."
            href="/search"
            action="Find movies"
          />
        )}
      </div>
    </div>
  );
}
