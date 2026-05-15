"use client";

import { useState } from "react";
import type { DisplayMovie } from "@/types/movie";
import { MovieGrid } from "@/components/MovieGrid";
import { cn } from "@/lib/utils";

type Signal = {
  key: "watchlist" | "liked" | "watched";
  label: string;
  helper: string;
  movies: DisplayMovie[];
};

export function ExploreSignalPanel({ signals }: { signals: Signal[] }) {
  const [active, setActive] = useState<Signal["key"] | null>(null);
  const activeSignal = signals.find((signal) => signal.key === active);

  return (
    <section className="mt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {signals.map((signal) => (
          <button
            key={signal.key}
            type="button"
            onClick={() => setActive((value) => (value === signal.key ? null : signal.key))}
            className={cn(
              "glass rounded-3xl p-5 text-left transition hover:-translate-y-1 hover:border-[#ff3b5c]/50",
              active === signal.key && "border-[#ff3b5c]/60 bg-[#ff3b5c]/10",
            )}
          >
            <div className="text-3xl font-black">{signal.movies.length}</div>
            <div className="text-sm text-zinc-400">{signal.label}</div>
            <div className="mt-2 text-xs text-zinc-500">{signal.helper}</div>
          </button>
        ))}
      </div>

      {activeSignal ? (
        <div className="glass mt-4 rounded-[2rem] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{activeSignal.label}</h2>
              <p className="mt-1 text-sm text-zinc-500">{activeSignal.helper}</p>
            </div>
            <button type="button" onClick={() => setActive(null)} className="secondary-button px-4 py-2 text-sm">
              Close
            </button>
          </div>
          {activeSignal.movies.length ? (
            <MovieGrid movies={activeSignal.movies} actionVariant="compact" />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-sm text-zinc-400">
              Nothing here yet.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
