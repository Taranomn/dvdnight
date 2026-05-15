"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { DisplayMovie, PersonSearchResult } from "@/types/movie";
import type { Genre } from "@/types/movie";
import { MovieGrid } from "@/components/MovieGrid";

const TMDB_PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";

function getKnownFor(person: PersonSearchResult) {
  return person.known_for
    ?.map((movie) => movie.title)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

function rottenToNumber(value?: string | null) {
  if (!value) return 0;
  const parsed = Number(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed / 10 : 0;
}

function bestSearchRating(movie: DisplayMovie) {
  if ("imdb_rating" in movie && movie.imdb_rating) return Number(movie.imdb_rating);
  if ("rotten_tomatoes_rating" in movie) return rottenToNumber(movie.rotten_tomatoes_rating);
  return 0;
}

function sortByBestSearchRating(movies: DisplayMovie[]) {
  return [...movies].sort((a, b) => bestSearchRating(b) - bestSearchRating(a));
}

export function LiveMovieSearch({
  initialQuery = "",
  initialResults = [],
  genres = [],
  initialGenre = "",
}: {
  initialQuery?: string;
  initialResults?: DisplayMovie[];
  genres?: Genre[];
  initialGenre?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DisplayMovie[]>(initialResults);
  const [people, setPeople] = useState<PersonSearchResult[]>([]);
  const [error, setError] = useState("");
  const [genre, setGenre] = useState(initialGenre);
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [runtime, setRuntime] = useState("");
  const [sort, setSort] = useState("imdb_rating.desc");
  const [isPending, startTransition] = useTransition();
  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const hasFilters = Boolean(genre || year || rating || runtime);
      if (trimmed.length < 2 && !hasFilters) {
        setError("");
        setPeople([]);
        setResults(sortByBestSearchRating(initialResults));
        return;
      }

      startTransition(async () => {
        try {
          const url = new URL("/api/search", window.location.origin);
          url.searchParams.set("q", trimmed);
          if (genre) url.searchParams.set("genre", genre);
          if (year) url.searchParams.set("year", year);
          if (rating) url.searchParams.set("rating", rating);
          if (runtime) url.searchParams.set("runtime", runtime);
          if (sort) url.searchParams.set("sort", sort);
          const response = await fetch(url, { signal: controller.signal });
          const data = (await response.json()) as {
            results: DisplayMovie[];
            people?: PersonSearchResult[];
            error?: string;
          };
          setResults(sort === "imdb_rating.desc" ? sortByBestSearchRating(data.results ?? []) : (data.results ?? []));
          setPeople(data.people ?? []);
          setError(data.error ?? "");
        } catch (caught) {
          if ((caught as Error).name !== "AbortError") setError("Search failed. Try again.");
        }
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [genre, initialResults, rating, runtime, sort, trimmed, year]);

  return (
    <div>
      <div className="relative max-w-3xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search movies, actors, directors..."
          className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-12 pr-4 text-base outline-none transition focus:border-[#ff3b5c]/70"
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select value={genre} onChange={(event) => setGenre(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4 text-sm">
          <option value="">All genres</option>
          {genres.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <input value={year} onChange={(event) => setYear(event.target.value)} placeholder="Year" inputMode="numeric" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm outline-none" />
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4 text-sm">
          <option value="">Any rating</option>
          <option value="7">7+</option>
          <option value="8">8+</option>
          <option value="9">9+</option>
        </select>
        <select value={runtime} onChange={(event) => setRuntime(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4 text-sm">
          <option value="">Any length</option>
          <option value="90">Under 90m</option>
          <option value="120">Under 2h</option>
          <option value="150">Under 2h 30m</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4 text-sm">
          <option value="imdb_rating.desc">IMDb rating</option>
          <option value="popularity.desc">Popular</option>
          <option value="vote_average.desc">Highest rated</option>
          <option value="primary_release_date.desc">Newest</option>
          <option value="revenue.desc">Box office</option>
        </select>
      </div>
      {isPending ? <p className="mt-3 text-sm text-zinc-500">Searching...</p> : null}
      {error ? <div className="glass mt-5 rounded-3xl p-4 text-[#ff4b4b]">{error}</div> : null}
      {people.length ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Cast & Directors</h2>
            <p className="text-sm text-zinc-500">Open a profile to browse their movies</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="glass flex min-w-0 items-center gap-3 rounded-3xl p-3 transition duration-200 hover:-translate-y-1 hover:border-[#ff3b5c]/50"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
                  {person.profile_path ? (
                    <Image
                      src={`${TMDB_PROFILE_BASE_URL}${person.profile_path}`}
                      alt={person.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500">
                      <UserRound className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{person.name}</div>
                  <div className="mt-1 text-xs text-[#ff3b5c]">{person.known_for_department ?? "Film"}</div>
                  {getKnownFor(person) ? (
                    <div className="mt-1 line-clamp-1 text-xs text-zinc-500">{getKnownFor(person)}</div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mt-8">
        <MovieGrid movies={results} actionVariant="compact" />
      </div>
      {trimmed.length >= 2 && !results.length && !people.length && !isPending ? (
        <div className="glass mt-8 rounded-3xl p-8 text-center text-zinc-400">No movies, cast, or directors found.</div>
      ) : null}
    </div>
  );
}
