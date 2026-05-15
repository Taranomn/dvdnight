import Link from "next/link";
import { Bell } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { MovieSearchBar } from "@/components/MovieSearchBar";
import { enrichMoviesWithRatings, getPopularMovies, getTopRatedMovies, getTrendingMovies } from "@/lib/movies";
import type { DisplayMovie, MovieSummary } from "@/types/movie";

async function safeMovies(loader: () => Promise<MovieSummary[]>) {
  try {
    return await loader();
  } catch {
    return [];
  }
}

function MovieSection({ title, slug, movies }: { title: string; slug: string; movies: DisplayMovie[] }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={`/lists/${slug}`} className="text-sm text-zinc-400 hover:text-white">
          See all
        </Link>
      </div>
      {movies.length ? (
        <MovieGrid movies={movies.slice(0, 12)} />
      ) : (
        <div className="glass rounded-3xl p-6 text-sm text-zinc-400">
          Add TMDB credentials to show {title.toLowerCase()}.
        </div>
      )}
    </section>
  );
}

export default async function Home() {
  const [trendingRaw, popularRaw, topRatedRaw] = await Promise.all([
    safeMovies(getTrendingMovies),
    safeMovies(getPopularMovies),
    safeMovies(getTopRatedMovies),
  ]);
  const [trending, popular, topRated] = await Promise.all([
    enrichMoviesWithRatings(trendingRaw, 12),
    enrichMoviesWithRatings(popularRaw, 12),
    enrichMoviesWithRatings(topRatedRaw, 12),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
      <header className="flex items-center gap-4">
        <MovieSearchBar />
        <button className="glass hidden rounded-2xl p-3 text-zinc-300 sm:block" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
      </header>
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f1a] p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#ff3b5c]">Movie Night</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-normal md:text-6xl">
          Find the movie both of you actually want to watch.
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Browse cinematic picks, save your watchlist, connect with friends, and match on the films you have in common.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/search" className="primary-button px-5 py-3">
            Start Searching
          </Link>
          <Link href="/match" className="secondary-button px-5 py-3">
            Compare Watchlists
          </Link>
        </div>
      </section>
      <MovieSection title="Trending Now" slug="trending" movies={trending} />
      <MovieSection title="Popular Movies" slug="popular" movies={popular} />
      <MovieSection title="Top Rated" slug="top-rated" movies={topRated} />
    </div>
  );
}
