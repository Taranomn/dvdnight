import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import {
  discoverMovies,
  enrichMoviesWithRatings,
  getImdbRatedMovies,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
} from "@/lib/movies";
import type { DisplayMovie, MovieSummary } from "@/types/movie";

const playlists = [
  {
    slug: "imdb-top-250",
    title: "IMDb-Rated Essentials",
    copy: "High-confidence classics ordered by IMDb rating where available.",
    loader: getImdbRatedMovies,
  },
  {
    slug: "rotten-favorites",
    title: "Critic Favorites",
    copy: "Critic-friendly discoveries with strong ratings and enough audience signal.",
    loader: () => discoverMovies({ sort_by: "vote_average.desc", "vote_count.gte": 1000 }),
  },
  {
    slug: "top-rated",
    title: "Top Rated Movies",
    copy: "A steady stream of highly rated films.",
    loader: getTopRatedMovies,
  },
  {
    slug: "modern-classics",
    title: "Modern Classics",
    copy: "Highly rated films from the last few decades.",
    loader: () => discoverMovies({ sort_by: "vote_average.desc", "vote_count.gte": 1500, "primary_release_date.gte": "1990-01-01" }),
  },
  {
    slug: "cult-night",
    title: "Cult Movie Night",
    copy: "Genre-heavy picks for weirder movie-night energy.",
    loader: () => discoverMovies({ sort_by: "popularity.desc", with_genres: "27,53,878" }),
  },
  {
    slug: "trending",
    title: "Trending Now",
    copy: "What people are checking right now.",
    loader: getTrendingMovies,
  },
  {
    slug: "popular",
    title: "Popular Movies",
    copy: "Broad crowd-pleasers in popularity order.",
    loader: getPopularMovies,
  },
  {
    slug: "upcoming",
    title: "Coming Soon",
    copy: "Upcoming and newly dated releases.",
    loader: getUpcomingMovies,
  },
  {
    slug: "now-playing",
    title: "Latest in Theaters",
    copy: "Fresh theatrical releases for the current movie mood.",
    loader: getNowPlayingMovies,
  },
];

async function loadPreview(loader: () => Promise<MovieSummary[] | DisplayMovie[]>) {
  try {
    return await enrichMoviesWithRatings(await loader(), 6);
  } catch {
    return [];
  }
}

export default async function PlaylistsPage() {
  const rows = await Promise.all(playlists.map(async (playlist) => ({ ...playlist, movies: await loadPreview(playlist.loader) })));

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Playlists</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Compact movie streams. Open a shelf when it catches your eye, close it when you are ready for the next one.
      </p>
      <div className="mt-8 space-y-4">
        {rows.map((playlist, index) => (
          <details key={playlist.slug} open={index < 2} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{playlist.title}</h2>
                <p className="mt-1 text-sm text-zinc-400">{playlist.copy}</p>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400 transition group-open:rotate-180" />
            </summary>
            <div className="mt-5">
              {playlist.movies.length ? (
                <MovieGrid movies={playlist.movies.slice(0, 3)} actionVariant="none" className="grid-cols-3 gap-x-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3" />
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm text-zinc-500">
                  This shelf is waiting for movie data.
                </div>
              )}
              <Link href={`/lists/${playlist.slug}`} className="secondary-button mt-5 w-fit px-4 py-2 text-sm">
                See full list
              </Link>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
