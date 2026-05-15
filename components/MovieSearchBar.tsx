"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, UserRound } from "lucide-react";
import type { DisplayMovie, PersonSearchResult } from "@/types/movie";
import { formatRating, posterUrl, yearFromDate } from "@/lib/utils";

const TMDB_PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";

function getTmdbId(movie: DisplayMovie) {
  return "tmdb_id" in movie ? movie.tmdb_id : movie.id;
}

function getImdb(movie: DisplayMovie) {
  return "imdb_rating" in movie ? movie.imdb_rating : null;
}

export function MovieSearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [movies, setMovies] = useState<DisplayMovie[]>([]);
  const [people, setPeople] = useState<PersonSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (trimmed.length < 2) {
        setMovies([]);
        setPeople([]);
        return;
      }

      startTransition(async () => {
        try {
          const url = new URL("/api/search", window.location.origin);
          url.searchParams.set("q", trimmed);
          url.searchParams.set("sort", "imdb_rating.desc");
          const response = await fetch(url, { signal: controller.signal });
          const data = (await response.json()) as { results?: DisplayMovie[]; people?: PersonSearchResult[] };
          setMovies(data.results?.slice(0, 5) ?? []);
          setPeople(data.people?.slice(0, 4) ?? []);
          setOpen(true);
        } catch (caught) {
          if ((caught as Error).name !== "AbortError") {
            setMovies([]);
            setPeople([]);
          }
        }
      });
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search movies, actors, directors..."
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#ff3b5c]/70"
      />
      {open && trimmed.length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-50 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f1a]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {isPending ? <div className="px-2 py-3 text-sm text-zinc-500">Searching...</div> : null}
          {people.length ? (
            <div>
              <div className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Cast & Directors</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition hover:bg-white/[0.06]"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                      {person.profile_path ? (
                        <Image src={`${TMDB_PROFILE_BASE_URL}${person.profile_path}`} alt={person.name} fill sizes="44px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-500">
                          <UserRound className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{person.name}</div>
                      <div className="text-xs text-[#ff3b5c]">{person.known_for_department ?? "Film"}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {movies.length ? (
            <div className={people.length ? "mt-3 border-t border-white/10 pt-3" : ""}>
              <div className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Movies</div>
              <div className="grid gap-2">
                {movies.map((movie) => {
                  const tmdbId = getTmdbId(movie);
                  const poster = posterUrl(movie.poster_path);
                  return (
                    <Link
                      key={tmdbId}
                      href={`/movies/${tmdbId}`}
                      onClick={() => setOpen(false)}
                      className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition hover:bg-white/[0.06]"
                    >
                      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
                        {poster ? <Image src={poster} alt={movie.title} fill sizes="44px" className="object-cover" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{movie.title}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                          <span>{yearFromDate(movie.release_date) ?? "Year N/A"}</span>
                          <span className="inline-flex items-center gap-1 text-[#ffc107]">
                            <Star className="h-3 w-3 fill-current" />
                            {formatRating(getImdb(movie))}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
          {!isPending && !movies.length && !people.length ? (
            <div className="px-2 py-3 text-sm text-zinc-500">No matches yet.</div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
