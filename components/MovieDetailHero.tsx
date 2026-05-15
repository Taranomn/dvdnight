import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import type { FullMovieData } from "@/types/movie";
import { backdropUrl, formatRuntime, posterUrl } from "@/lib/utils";
import { RatingBadge } from "@/components/RatingBadge";
import { TrailerBackground } from "@/components/TrailerTakeover";
import { TrailerEmbed } from "@/components/TrailerEmbed";
import { WatchlistButton } from "@/components/WatchlistButton";
import { MovieStatusActions } from "@/components/MovieStatusActions";

type MovieDetailHeroProps = {
  movie: FullMovieData;
  watchlistState: { movie_id: string; status?: string | null } | null;
  liked?: boolean;
};

export function MovieDetailHero({ movie, watchlistState, liked }: MovieDetailHeroProps) {
  const backdrop = backdropUrl(movie.backdrop_path);
  const poster = posterUrl(movie.poster_path);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f1a]">
      {movie.trailer_key ? (
        <TrailerBackground trailerKey={movie.trailer_key} title={movie.title} />
      ) : backdrop ? (
        <Image
          src={backdrop}
          alt={`${movie.title} backdrop`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#05050a] via-[#05050a]/82 to-[#05050a]/20" />
      <div className="relative grid gap-8 p-5 md:grid-cols-[14rem_1fr] md:p-8 lg:min-h-[34rem] lg:grid-cols-[18rem_1fr] lg:p-12">
        <div className="relative aspect-[2/3] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40">
          {poster ? (
            <Image src={poster} alt={`${movie.title} poster`} fill sizes="300px" className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-zinc-500">
              Poster not available
            </div>
          )}
        </div>
        <div className="flex max-w-3xl flex-col justify-center">
          <div className="mb-4 flex flex-wrap gap-2">
            {movie.genres?.slice(0, 4).map((genre) => (
              <Link
                key={genre.id}
                href={`/search?genre=${genre.id}`}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-zinc-200 transition hover:-translate-y-0.5 hover:border-[#ff3b5c]/50 hover:bg-[#ff3b5c]/15 hover:text-white"
              >
                {genre.name}
              </Link>
            ))}
          </div>
          <h1 className="text-4xl font-black tracking-normal text-white md:text-6xl">{movie.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#ff3b5c]" />
              {movie.release_date ?? "Release N/A"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#7c5cff]" />
              {formatRuntime(movie.runtime)}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <RatingBadge source="IMDb" value={movie.imdb_rating} />
            <RatingBadge source="Rotten Tomatoes" value={movie.rotten_tomatoes_rating} />
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
            {movie.overview ?? "Overview not available."}
          </p>
          <div className="mt-7 grid gap-3 sm:flex">
            <TrailerEmbed trailerKey={movie.trailer_key} />
            <WatchlistButton
              tmdbId={movie.tmdb_id}
              movieId={watchlistState?.movie_id}
              inWatchlist={Boolean(watchlistState)}
              className="px-5 py-3"
            />
          </div>
          <div className="mt-4">
            <MovieStatusActions
              tmdbId={movie.tmdb_id}
              movieId={watchlistState?.movie_id}
              status={watchlistState?.status}
              liked={liked}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
