import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CastRail } from "@/components/CastRail";
import { EmptyState } from "@/components/EmptyState";
import { MovieCommunityStats } from "@/components/MovieCommunityStats";
import { MovieDiscussion } from "@/components/MovieDiscussion";
import { MovieDetailHero } from "@/components/MovieDetailHero";
import { MovieDetailTabs } from "@/components/MovieDetailTabs";
import { ShareMovieButton } from "@/components/ShareMovieButton";
import { SimilarMoviesPanel } from "@/components/SimilarMoviesPanel";
import { getFriends } from "@/lib/friends";
import { enrichMoviesWithRatings, getFullMovieData, getStoredMovieByTmdbId } from "@/lib/movies";
import { getMovieComments, getMovieCommunityStats } from "@/lib/social";
import { getSessionUser } from "@/lib/supabase/server";
import { getSmartSimilarMovies } from "@/lib/tmdb";
import { isMovieInWatchlist, isMovieLiked } from "@/lib/watchlist";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dvdnight.com").replace(/\/$/, "");
const imageBaseUrl = "https://image.tmdb.org/t/p";
const getMovieForPage = cache(async (tmdbId: number) => getFullMovieData(tmdbId));

export async function generateMetadata({ params }: { params: Promise<{ tmdbId: string }> }): Promise<Metadata> {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!Number.isFinite(id)) {
    return {
      title: "Movie Not Found",
    };
  }

  try {
    const movie = await getMovieForPage(id);
    const title = `${movie.title}${movie.release_year ? ` (${movie.release_year})` : ""}`;
    const description =
      movie.overview ??
      `Watch trailers, browse cast, see ratings, and save ${movie.title} to Watch List on Movie Night.`;
    const imagePath = movie.backdrop_path ?? movie.poster_path;
    const imageUrl = imagePath ? `${imageBaseUrl}/${movie.backdrop_path ? "original" : "w500"}${imagePath}` : undefined;

    return {
      title,
      description,
      alternates: {
        canonical: `/movies/${id}`,
      },
      openGraph: {
        title,
        description,
        url: `/movies/${id}`,
        siteName: "Movie Night",
        images: imageUrl ? [{ url: imageUrl, width: movie.backdrop_path ? 1280 : 500, height: movie.backdrop_path ? 720 : 750 }] : undefined,
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Movie Not Found",
      description: "This movie could not be loaded on Movie Night.",
    };
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!Number.isFinite(id)) notFound();

  let movie;
  try {
    movie = await getMovieForPage(id);
    const storedMovie = await getStoredMovieByTmdbId(id).catch(() => null);
    if (storedMovie) {
      movie = {
        ...movie,
        imdb_id: movie.imdb_id ?? storedMovie.imdb_id,
        imdb_rating: movie.imdb_rating ?? storedMovie.imdb_rating,
        rotten_tomatoes_rating: movie.rotten_tomatoes_rating ?? storedMovie.rotten_tomatoes_rating,
      };
    }
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
  const movieJsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.overview,
    url: `${siteUrl}/movies/${id}`,
    image: movie.poster_path ? `${imageBaseUrl}/w500${movie.poster_path}` : undefined,
    datePublished: movie.release_date,
    genre: movie.genres?.map((genre) => genre.name),
    director: movie.director_names?.map((name) => ({ "@type": "Person", name })) ?? (movie.director ? [{ "@type": "Person", name: movie.director }] : undefined),
    actor: movie.cast?.slice(0, 8).map((person) => ({ "@type": "Person", name: person.name })),
    aggregateRating: movie.imdb_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: movie.imdb_rating,
          bestRating: 10,
          ratingCount: movie.tmdb_vote_count,
        }
      : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 md:px-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(movieJsonLd) }}
      />
      <MovieDetailHero
        movie={movie}
        watchlistState={watchlistState}
        liked={liked}
        shareAction={<ShareMovieButton tmdbId={id} movieTitle={movie.title} friends={friends} signedIn={Boolean(user)} />}
      />
      <section className="grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="order-2 lg:order-1">
          <MovieDetailTabs movie={movie} />
        </div>
        <div className="order-1 lg:order-2">
          <CastRail movie={movie} />
        </div>
      </section>
      <section>
        <MovieCommunityStats stats={stats} />
      </section>
      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.9fr)]">
        <MovieDiscussion tmdbId={id} comments={comments} signedIn={Boolean(user)} />
        <SimilarMoviesPanel movies={similar} />
      </section>
    </div>
  );
}
