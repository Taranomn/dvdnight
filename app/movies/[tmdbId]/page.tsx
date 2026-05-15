import { notFound } from "next/navigation";
import { CastRail } from "@/components/CastRail";
import { EmptyState } from "@/components/EmptyState";
import { MovieDetailHero } from "@/components/MovieDetailHero";
import { MovieDetailTabs } from "@/components/MovieDetailTabs";
import { enrichMoviesWithRatings, getFullMovieData } from "@/lib/movies";
import { getSessionUser } from "@/lib/supabase/server";
import { getSmartSimilarMovies } from "@/lib/tmdb";
import { isMovieInWatchlist, isMovieLiked } from "@/lib/watchlist";

export default async function MovieDetailPage({ params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!Number.isFinite(id)) notFound();

  let movie;
  try {
    movie = await getFullMovieData(id);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <EmptyState
          title="Movie unavailable"
          message="TMDB did not return this movie. Check your API keys or try another title."
          href="/search"
          action="Search movies"
        />
      </div>
    );
  }

  const user = await getSessionUser();
  const [watchlistState, liked, similarRaw] = await Promise.all([
    isMovieInWatchlist(user?.id, id),
    isMovieLiked(user?.id, id),
    getSmartSimilarMovies(id).catch(() => []),
  ]);
  const similar = await enrichMoviesWithRatings(similarRaw, 12);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 md:px-8">
      <MovieDetailHero movie={movie} watchlistState={watchlistState} liked={liked} />
      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <MovieDetailTabs movie={movie} similar={similar} />
        <CastRail movie={movie} />
      </section>
    </div>
  );
}
