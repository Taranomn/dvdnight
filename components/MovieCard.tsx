import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { DisplayMovie } from "@/types/movie";
import { formatRating, posterUrl, yearFromDate } from "@/lib/utils";
import { WatchlistButton } from "@/components/WatchlistButton";
import { CompactMovieActions } from "@/components/CompactMovieActions";
import { RottenTomatoesIcon } from "@/components/RottenTomatoesIcon";

type MovieCardProps = {
  movie: DisplayMovie;
  savedMovieId?: string | null;
  inWatchlist?: boolean;
  showWatchlistButton?: boolean;
  actionVariant?: "watchlist" | "compact" | "none";
};

function getTmdbId(movie: DisplayMovie) {
  return "tmdb_id" in movie ? movie.tmdb_id : movie.id;
}

function getYear(movie: DisplayMovie) {
  return "release_year" in movie ? movie.release_year : yearFromDate(movie.release_date);
}

function getImdb(movie: DisplayMovie) {
  return "imdb_rating" in movie ? movie.imdb_rating : null;
}

function getRotten(movie: DisplayMovie) {
  return "rotten_tomatoes_rating" in movie ? movie.rotten_tomatoes_rating : null;
}

export function MovieCard({ movie, savedMovieId, inWatchlist, showWatchlistButton = true, actionVariant }: MovieCardProps) {
  const tmdbId = getTmdbId(movie);
  const poster = posterUrl(movie.poster_path);
  const variant = actionVariant ?? (showWatchlistButton ? "compact" : "none");
  const imdbRating = getImdb(movie);
  const rottenRating = getRotten(movie);

  return (
    <article className="group w-full min-w-[11rem] animate-fade-up">
      <Link href={`/movies/${tmdbId}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f1a] shadow-2xl shadow-black/30 transition duration-200 group-hover:-translate-y-1 group-hover:border-[#ff3b5c]/50">
          {poster ? (
            <Image
              src={poster}
              alt={`${movie.title} poster`}
              fill
              sizes="(max-width: 768px) 45vw, 180px"
              className="object-cover transition duration-200 group-hover:brightness-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-500">
              Poster not available
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
            <div className="flex items-center justify-between gap-2 text-sm font-bold">
              <span className="inline-flex min-w-0 items-center gap-1 text-[#f5c518]">
                <Star className="h-3.5 w-3.5 shrink-0 fill-current" />
                <span className="truncate">{typeof imdbRating === "number" ? formatRating(imdbRating) : "N/A"}</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-1 text-[#ff4b4b]">
                <RottenTomatoesIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{rottenRating ?? "N/A"}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-3">
        <Link href={`/movies/${tmdbId}`} className="line-clamp-1 font-semibold text-white">
          {movie.title}
        </Link>
        <div className="mt-1 text-sm text-zinc-500">{getYear(movie) ?? "Year N/A"}</div>
        {variant === "watchlist" ? (
          <WatchlistButton
            tmdbId={tmdbId}
            movieId={savedMovieId}
            inWatchlist={inWatchlist}
            className="mt-3 min-h-10 w-full flex-wrap px-2 py-2 text-[0.7rem] leading-tight"
          />
        ) : null}
        {variant === "compact" ? <CompactMovieActions tmdbId={tmdbId} /> : null}
      </div>
    </article>
  );
}
