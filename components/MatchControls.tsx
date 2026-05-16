"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dices, Trophy } from "lucide-react";
import type { StoredMovie } from "@/types/movie";
import { getBestComparableRating, posterUrl, ratingSource } from "@/lib/utils";
import { RatingBadge } from "@/components/RatingBadge";
import { TrailerEmbed } from "@/components/TrailerEmbed";

export function MatchControls({ movies }: { movies: StoredMovie[] }) {
  const [selected, setSelected] = useState<StoredMovie | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const highest = useMemo(
    () => [...movies].sort((a, b) => getBestComparableRating(b) - getBestComparableRating(a))[0] ?? null,
    [movies],
  );

  if (!movies.length) return null;

  return (
    <div className="space-y-5">
      <div className="glass grid gap-3 rounded-3xl p-3 sm:grid-cols-3">
        <button
          className="secondary-button px-4 py-3"
          onClick={() => {
            setSelected(null);
            setReason(null);
          }}
        >
          Choose Manually
        </button>
        <button
          className="primary-button px-4 py-3"
          onClick={() => {
            setSelected(movies[Math.floor(Math.random() * movies.length)]);
            setReason("Randomly selected from your shared Watch List");
          }}
        >
          <Dices className="h-4 w-4" />
          Pick Random
        </button>
        <button
          className="secondary-button px-4 py-3"
          onClick={() => {
            setSelected(highest);
            setReason(highest ? `Selected based on ${ratingSource(highest)}` : null);
          }}
        >
          <Trophy className="h-4 w-4" />
          Highest Rated
        </button>
      </div>
      {selected ? (
        <div className="animate-fade-up animate-soft-pulse relative overflow-hidden rounded-[2rem] border border-[#ff3b5c]/30 bg-[#0b0f1a] p-5 shadow-2xl shadow-[#ff3b5c]/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,59,92,0.22),transparent_18rem),radial-gradient(circle_at_80%_10%,rgba(124,92,255,0.22),transparent_16rem)]" />
          <div className="relative grid gap-5 sm:grid-cols-[10rem_1fr]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/[0.04]">
              {posterUrl(selected.poster_path) ? (
                <Image
                  src={posterUrl(selected.poster_path)!}
                  alt={`${selected.title} poster`}
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-[#ff3b5c]">{reason}</p>
              <h2 className="mt-2 text-3xl font-black">{selected.title}</h2>
              <p className="mt-1 text-zinc-400">{selected.release_year ?? "Year N/A"}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <RatingBadge source="IMDb" value={selected.imdb_rating} />
                <RatingBadge source="Rotten Tomatoes" value={selected.rotten_tomatoes_rating} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="primary-button px-4 py-3"
                  onClick={() => {
                    setSelected(movies[Math.floor(Math.random() * movies.length)]);
                    setReason("Randomly selected from your shared Watch List");
                  }}
                >
                  Again
                </button>
                <Link href={`/movies/${selected.tmdb_id}`} className="secondary-button px-4 py-3">
                  View Details
                </Link>
                <TrailerEmbed trailerKey={selected.trailer_key} className="px-4 py-3" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
