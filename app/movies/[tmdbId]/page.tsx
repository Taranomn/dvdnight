import { notFound } from "next/navigation";
import { CastRail } from "@/components/CastRail";
import { EmptyState } from "@/components/EmptyState";
import { MovieCommunityStats } from "@/components/MovieCommunityStats";
import { MovieDiscussion } from "@/components/MovieDiscussion";
import { MovieDetailHero } from "@/components/MovieDetailHero";
import { MovieDetailTabs } from "@/components/MovieDetailTabs";
import { ShareMoviePanel } from "@/components/ShareMoviePanel";
import { SimilarMoviesPanel } from "@/components/SimilarMoviesPanel";
import { getFriends } from "@/lib/friends";
import { enrichMoviesWithRatings, getFullMovieData } from "@/lib/movies";
import { getMovieComments, getMovieCommunityStats } from "@/lib/social";
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
  const [watchlistState, liked, similarRaw, comments, stats, friends] = await Promise.all([
    isMovieInWatchlist(user?.id, id),
    isMovieLiked(user?.id, id),
    getSmartSimilarMovies(id).catch(() => []),
    getMovieComments(id).catch(() => []),
    getMovieCommunityStats(id).catch(() => ({ watchedCount: 0, averageRating: null, ratingCount: 0 })),
    user ? getFriends(user.id).catch(() => []) : Promise.resolve([]),
  ]);
  const similar = await enrichMoviesWithRatings(similarRaw, 12);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 md:px-8">
      <MovieDetailHero movie={movie} watchlistState={watchlistState} liked={liked} />
      <section className="grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="order-2 lg:order-1">
          <MovieDetailTabs movie={movie} />
        </div>
        <div className="order-1 lg:order-2">
          <CastRail movie={movie} />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(24rem,1fr)]">
        <MovieCommunityStats stats={stats} />
        <ShareMoviePanel tmdbId={id} friends={friends} signedIn={Boolean(user)} />
      </section>
      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.9fr)]">
        <MovieDiscussion tmdbId={id} comments={comments} signedIn={Boolean(user)} />
        <SimilarMoviesPanel movies={similar} />
      </section>
    </div>
  );
}
