"use client";

import { useState } from "react";
import type { DisplayMovie } from "@/types/movie";
import { ExploreDeck } from "@/components/ExploreDeck";
import { InfiniteMovieGrid } from "@/components/InfiniteMovieGrid";

export function ExploreModes({
  movies,
  list,
  params,
}: {
  movies: DisplayMovie[];
  list: string;
  params?: Record<string, string | number | undefined>;
}) {
  const [mode, setMode] = useState<"grid" | "cards">("grid");

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Because of your taste</h2>
        <div className="glass grid grid-cols-2 rounded-2xl p-1">
          <button
            onClick={() => setMode("grid")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === "grid" ? "bg-[#ff3b5c] text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Grid
          </button>
          <button
            onClick={() => setMode("cards")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === "cards" ? "bg-[#ff3b5c] text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Card Mode
          </button>
        </div>
      </div>
      {mode === "cards" ? (
        <ExploreDeck initialMovies={movies.slice(0, 10)} />
      ) : (
        <InfiniteMovieGrid initialMovies={movies.slice(0, 18)} list={list} params={params} actionVariant="compact" />
      )}
    </section>
  );
}
