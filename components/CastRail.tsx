"use client";

import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { useState } from "react";
import type { FullMovieData } from "@/types/movie";

export function CastRail({ movie }: { movie: FullMovieData }) {
  const [expanded, setExpanded] = useState(false);
  const director = movie.crew.find((member) => member.job === "Director");
  const people = [
    ...(director ? [{ id: director.id, name: director.name, character: "Director", profile_path: director.profile_path }] : []),
    ...movie.cast
      .filter((member) => member.id !== director?.id)
      .map((member) => ({ id: member.id, name: member.name, character: member.character || "Cast", profile_path: member.profile_path })),
  ];
  const visiblePeople = expanded ? people : people.slice(0, 6);

  return (
    <aside className="glass self-start rounded-3xl p-4 md:p-5">
      <h2 className="text-2xl font-bold">Cast</h2>
      <p className="mt-1 text-sm text-zinc-500">Director first, then featured performers.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {visiblePeople.map((person) => (
          <Link
            key={`${person.id}-${person.character}`}
            href={`/people/${person.id}`}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 transition hover:-translate-y-1 hover:border-[#ff3b5c]/40"
          >
            <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-white/[0.05]">
              {person.profile_path ? (
                <Image src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} alt={person.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-600">
                  <UserRound className="h-9 w-9" />
                </div>
              )}
            </div>
            <div className="mt-3 line-clamp-2 text-center text-sm font-bold text-white">{person.name}</div>
            <div className="mt-1 line-clamp-2 text-center text-xs text-zinc-500">{person.character}</div>
          </Link>
        ))}
      </div>
      {people.length > 6 ? (
        <button onClick={() => setExpanded((value) => !value)} className="secondary-button mt-5 w-full px-4 py-3 text-sm">
          {expanded ? "Show less" : `See more cast (${people.length - 6})`}
        </button>
      ) : null}
    </aside>
  );
}
