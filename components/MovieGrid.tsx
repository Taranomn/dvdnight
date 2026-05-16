"use client";

import { useEffect, useMemo, useState } from "react";
import type { DisplayMovie } from "@/types/movie";
import { MovieCard } from "@/components/MovieCard";
import { cn } from "@/lib/utils";

type MovieGridProps = {
  movies: DisplayMovie[];
  showWatchlistButton?: boolean;
  actionVariant?: "watchlist" | "compact" | "none";
  className?: string;
};

type MovieStatus = {
  liked: boolean;
  watchlist: { id?: string; movie_id: string; status?: string | null } | null;
};

function getTmdbId(movie: DisplayMovie) {
  return "tmdb_id" in movie ? movie.tmdb_id : movie.id;
}

export function MovieGrid({ movies, showWatchlistButton = true, actionVariant = "compact", className }: MovieGridProps) {
  const ids = useMemo(() => Array.from(new Set(movies.map(getTmdbId).filter(Number.isFinite))).slice(0, 80), [movies]);
  const [statuses, setStatuses] = useState<Record<string, MovieStatus>>({});

  useEffect(() => {
    if (!ids.length) return;
    let ignore = false;
    const url = new URL("/api/movie-status", window.location.origin);
    url.searchParams.set("tmdbIds", ids.join(","));
    fetch(url, { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { statuses?: Record<string, MovieStatus> } | null) => {
        if (ignore || !payload?.statuses) return;
        setStatuses(payload.statuses);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [ids]);

  return (
    <div className={cn("grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6", className)}>
      {movies.map((movie) => {
        const tmdbId = getTmdbId(movie);
        const status = statuses[String(tmdbId)];
        return (
          <MovieCard
            key={tmdbId}
            movie={movie}
            showWatchlistButton={showWatchlistButton}
            actionVariant={actionVariant}
            initialLiked={status?.liked}
            initialStatus={status?.watchlist?.status}
          />
        );
      })}
    </div>
  );
}
