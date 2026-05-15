"use client";

import { useMemo, useState } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { cn } from "@/lib/utils";
import type { DisplayMovie } from "@/types/movie";

type SortMode = "popularity" | "rating" | "newest" | "oldest" | "title";

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "A-Z" },
];

function comparableRating(movie: DisplayMovie) {
  const imdb = "imdb_rating" in movie ? movie.imdb_rating : null;
  if (imdb) return Number(imdb);
  const rotten = "rotten_tomatoes_rating" in movie ? movie.rotten_tomatoes_rating : null;
  if (rotten) return Number(String(rotten).replace("%", "")) / 10;
  return "vote_average" in movie ? Number(movie.vote_average ?? 0) : Number(("tmdb_rating" in movie ? movie.tmdb_rating : 0) ?? 0);
}

export function SortableFilmography({ movies }: { movies: DisplayMovie[] }) {
  const [sort, setSort] = useState<SortMode>("popularity");
  const sorted = useMemo(() => {
    return [...movies].sort((a, b) => {
      if (sort === "newest") return String(b.release_date ?? "").localeCompare(String(a.release_date ?? ""));
      if (sort === "oldest") return String(a.release_date ?? "").localeCompare(String(b.release_date ?? ""));
      if (sort === "rating") return comparableRating(b) - comparableRating(a);
      if (sort === "title") return a.title.localeCompare(b.title);
      return Number(b.popularity ?? 0) - Number(a.popularity ?? 0);
    });
  }, [movies, sort]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSort(option.value)}
            className={cn(
              "secondary-button px-3 py-2 text-sm",
              sort === option.value ? "border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-white" : "",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <MovieGrid movies={sorted} />
      </div>
    </>
  );
}
