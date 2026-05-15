"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { DisplayMovie, MovieSummary } from "@/types/movie";
import { MovieGrid } from "@/components/MovieGrid";

export function InfiniteMovieGrid({
  initialMovies,
  list,
  params,
  actionVariant,
}: {
  initialMovies: DisplayMovie[];
  list: string;
  params?: Record<string, string | number | undefined>;
  actionVariant?: "watchlist" | "compact" | "none";
}) {
  const [movies, setMovies] = useState<DisplayMovie[]>(initialMovies);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || isPending || !hasMore) return;
      startTransition(async () => {
        const url = new URL("/api/movies", window.location.origin);
        url.searchParams.set("list", list);
        url.searchParams.set("page", String(page));
        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, String(value));
        });
        const response = await fetch(url);
        const data = (await response.json()) as { results: MovieSummary[] };
        if (!data.results?.length) {
          setHasMore(false);
          return;
        }
        setMovies((current) => {
          const seen = new Set(current.map((movie) => ("tmdb_id" in movie ? movie.tmdb_id : movie.id)));
          return [...current, ...data.results.filter((movie) => !seen.has(movie.id))];
        });
        setPage((value) => value + 1);
      });
    }, { rootMargin: "900px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isPending, list, page, params]);

  return (
    <div>
      <MovieGrid movies={movies} actionVariant={actionVariant} />
      <div ref={sentinelRef} className="flex h-24 items-center justify-center text-sm text-zinc-500">
        {isPending ? "Loading more movies..." : hasMore ? "Scroll for more" : "End of this reel"}
      </div>
    </div>
  );
}
