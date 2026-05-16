import type { Metadata } from "next";
import Link from "next/link";
import { MovieGrid } from "@/components/MovieGrid";
import { MovieSearchBar } from "@/components/MovieSearchBar";
import { enrichMoviesWithRatings, getNowPlayingMovies, getPopularMovies, getTopRatedMovies, getTrendingMovies } from "@/lib/movies";
import type { DisplayMovie, MovieSummary } from "@/types/movie";

export const metadata: Metadata = {
  title: "Movie Night | Social Movie Watchlists and Matching",
  description:
    "Browse trending movies, see IMDb and Rotten Tomatoes ratings, save films to Want to Watch, and match with friends on what to watch together.",
  alternates: {
    canonical: "/",
  },
};

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
        <MovieGrid movies={movies.slice(0, 5)} className="xl:grid-cols-5 2xl:grid-cols-5" />
      ) : (
        <div className="glass rounded-3xl p-6 text-sm text-zinc-400">
          Add TMDB credentials to show {title.toLowerCase()}.
        </div>
      )}
    </section>
  );
}

export default async function Home() {
  const [latestRaw, trendingRaw, popularRaw, topRatedRaw] = await Promise.all([
    safeMovies(getNowPlayingMovies),
    safeMovies(getTrendingMovies),
    safeMovies(getPopularMovies),
    safeMovies(getTopRatedMovies),
  ]);
  const [latest, trending, popular, topRated] = await Promise.all([
    enrichMoviesWithRatings(latestRaw, 12),
    enrichMoviesWithRatings(trendingRaw, 12),
    enrichMoviesWithRatings(popularRaw, 12),
    enrichMoviesWithRatings(topRatedRaw, 12),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
      <header className="flex items-center gap-4">
        <MovieSearchBar />
      </header>
      <MovieSection title="Latest in Theaters" slug="now-playing" movies={latest} />
      <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0f1a] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff3b5c]">Movie Night</p>
        <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-normal md:text-4xl">
          Find the movie both of you actually want to watch.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Save movies to Want to Watch, connect with friends, and match on the films you have in common.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/search" className="primary-button px-5 py-3">
            Start Searching
          </Link>
          <Link href="/match" className="secondary-button px-5 py-3">
            Match With Friends
          </Link>
        </div>
      </section>
      <MovieSection title="Trending Now" slug="trending" movies={trending} />
      <MovieSection title="Popular Movies" slug="popular" movies={popular} />
      <MovieSection title="Top Rated" slug="top-rated" movies={topRated} />
    </div>
  );
}
