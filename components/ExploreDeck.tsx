"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Heart, Plus, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DisplayMovie, MovieSummary } from "@/types/movie";
import { markWatchedByTmdbAction, toggleMovieLikeAction, addMovieAction } from "@/lib/actions";
import { formatRating, posterUrl, yearFromDate } from "@/lib/utils";

function getTmdbId(movie: DisplayMovie) {
  return "tmdb_id" in movie ? movie.tmdb_id : movie.id;
}

function getImdb(movie: DisplayMovie) {
  return "imdb_rating" in movie ? movie.imdb_rating : null;
}

function getRotten(movie: DisplayMovie) {
  return "rotten_tomatoes_rating" in movie ? movie.rotten_tomatoes_rating : null;
}

export function ExploreDeck({ initialMovies }: { initialMovies: DisplayMovie[] }) {
  const [movies, setMovies] = useState(initialMovies);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(2);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const movie = movies[index];

  async function loadMoreIfNeeded(nextIndex: number) {
    if (nextIndex < movies.length - 4) return;
    const response = await fetch(`/api/movies?list=popular&page=${page}`);
    const data = (await response.json()) as { results: MovieSummary[] };
    setMovies((current) => [...current, ...(data.results ?? [])]);
    setPage((value) => value + 1);
  }

  function next() {
    const nextIndex = Math.min(index + 1, movies.length - 1);
    setIndex(nextIndex);
    void loadMoreIfNeeded(nextIndex);
  }

  if (!movie) return null;
  const poster = posterUrl(movie.poster_path);
  const tmdbId = getTmdbId(movie);
  const imdb = getImdb(movie);
  const rotten = getRotten(movie);

  return (
    <div className="glass overflow-hidden rounded-[2rem] p-4 md:p-6">
      <div className="grid gap-5 md:grid-cols-[16rem_1fr]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-3xl bg-white/[0.04] shadow-2xl shadow-black/40">
          {poster ? <Image src={poster} alt={`${movie.title} poster`} fill sizes="280px" className="object-cover" /> : null}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ff3b5c]">Card mode</p>
          <h2 className="mt-3 text-4xl font-black">{movie.title}</h2>
          <p className="mt-2 text-zinc-400">
            {yearFromDate(movie.release_date) ?? "Year N/A"} · IMDb {formatRating(imdb)} · RT {rotten ?? "N/A"}
          </p>
          <p className="mt-5 line-clamp-5 max-w-2xl text-sm leading-7 text-zinc-300">{movie.overview}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              className="secondary-button px-4 py-3"
              disabled={isPending}
              onClick={() => startTransition(async () => { await toggleMovieLikeAction(tmdbId); next(); router.refresh(); })}
            >
              <Heart className="h-4 w-4" /> Like
            </button>
            <button
              className="primary-button px-4 py-3"
              disabled={isPending}
              onClick={() => startTransition(async () => { await addMovieAction(tmdbId); next(); router.refresh(); })}
            >
              <Plus className="h-4 w-4" /> Watchlist
            </button>
            <button
              className="secondary-button px-4 py-3"
              disabled={isPending}
              onClick={() => startTransition(async () => { await markWatchedByTmdbAction(tmdbId); next(); router.refresh(); })}
            >
              <CheckCircle2 className="h-4 w-4" /> Watched
            </button>
            <button className="secondary-button px-4 py-3" onClick={next}>
              <SkipForward className="h-4 w-4" /> Next
            </button>
          </div>
          <Link href={`/movies/${tmdbId}`} className="mt-4 text-sm font-semibold text-[#ff3b5c]">More details</Link>
        </div>
      </div>
    </div>
  );
}
