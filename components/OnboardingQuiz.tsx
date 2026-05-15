"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import type { FullMovieData } from "@/types/movie";
import { posterUrl, yearFromDate } from "@/lib/utils";
import { completeOnboardingAction, saveOnboardingAnswerAction, skipOnboardingAction } from "@/lib/actions";
import { RatingBadge } from "@/components/RatingBadge";

const options = [
  { key: "onboarding_like", label: "Like" },
  { key: "onboarding_dislike", label: "Dislike" },
  { key: "onboarding_seen", label: "Seen It" },
  { key: "onboarding_not_seen", label: "Haven't Seen It" },
  { key: "onboarding_not_interested", label: "Not Interested" },
  { key: "onboarding_skip", label: "Skip" },
] as const;

export function OnboardingQuiz({ movies }: { movies: FullMovieData[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [answeredMovies, setAnsweredMovies] = useState<FullMovieData[]>([]);
  const [isPending, startTransition] = useTransition();
  const movie = movies[index];
  const summary = useMemo(() => {
    const genreCounts = new Map<string, number>();
    const directorCounts = new Map<string, number>();
    const actorCounts = new Map<string, number>();
    answeredMovies.forEach((item) => {
      item.genres?.forEach((genre) => genreCounts.set(genre.name, (genreCounts.get(genre.name) ?? 0) + 1));
      item.director_names?.forEach((name) => directorCounts.set(name, (directorCounts.get(name) ?? 0) + 1));
      item.cast_names?.slice(0, 3).forEach((name) => actorCounts.set(name, (actorCounts.get(name) ?? 0) + 1));
    });
    const top = (map: Map<string, number>) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
    return { genres: top(genreCounts), directors: top(directorCounts), actors: top(actorCounts) };
  }, [answeredMovies]);

  if (!movie) {
    return (
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <div className="glass rounded-[2rem] p-8">
          <h1 className="text-3xl font-black">Your taste profile is ready</h1>
          <p className="mt-3 text-zinc-400">
            Looks like you enjoy {summary.genres.length ? summary.genres.join(", ") : "highly rated movies"}.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Summary title="Top genres" items={summary.genres} />
            <Summary title="Top directors" items={summary.directors} />
            <Summary title="Top actors" items={summary.actors} />
          </div>
          <form action={completeOnboardingAction} className="mt-6">
            <button className="primary-button h-12 w-full">Explore Recommendations</button>
          </form>
        </div>
      </div>
    );
  }

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function next() {
    const values = selected.size ? [...selected] : ["onboarding_skip"];
    startTransition(async () => {
      await saveOnboardingAnswerAction(movie.tmdb_id, values);
      if (values.some((value) => ["onboarding_like", "onboarding_seen"].includes(value))) {
        setAnsweredMovies((current) => [...current, movie]);
      }
      setSelected(new Set());
      setIndex((value) => value + 1);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-black">Build your taste profile</h1>
          <p className="mt-2 text-zinc-400">Question {index + 1} of {movies.length}</p>
        </div>
        <form action={skipOnboardingAction}>
          <button className="secondary-button px-4 py-3 text-sm">Skip quiz</button>
        </form>
      </div>
      <div className="glass grid gap-6 rounded-[2rem] p-5 md:grid-cols-[16rem_1fr] md:p-8">
        <div className="relative aspect-[2/3] overflow-hidden rounded-3xl bg-white/[0.04]">
          {posterUrl(movie.poster_path) ? <Image src={posterUrl(movie.poster_path)!} alt={movie.title} fill sizes="260px" className="object-cover" /> : null}
        </div>
        <div>
          <p className="text-sm text-zinc-500">{yearFromDate(movie.release_date) ?? "Year N/A"}</p>
          <h2 className="mt-2 text-4xl font-black">{movie.title}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {movie.genres?.map((genre) => <span key={genre.id} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs">{genre.name}</span>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <RatingBadge source="IMDb" value={movie.imdb_rating} />
            <RatingBadge source="Rotten Tomatoes" value={movie.rotten_tomatoes_rating} />
          </div>
          <p className="mt-5 line-clamp-4 text-sm leading-7 text-zinc-300">{movie.overview}</p>
          <p className="mt-4 text-sm text-zinc-400">Director: {movie.director_names?.join(", ") || "Not available"}</p>
          <p className="mt-1 text-sm text-zinc-400">Cast: {movie.cast_names?.slice(0, 4).join(", ") || "Not available"}</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {options.map((option) => (
              <button key={option.key} onClick={() => toggle(option.key)} className={`secondary-button px-4 py-3 text-sm ${selected.has(option.key) ? "border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-white" : ""}`}>
                {option.label}
              </button>
            ))}
          </div>
          <button onClick={next} disabled={isPending} className="primary-button mt-6 h-12 w-full">
            {index === movies.length - 1 ? "See Taste Summary" : "Next Movie"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{items.length ? items.join(", ") : "Still learning"}</p>
    </div>
  );
}
