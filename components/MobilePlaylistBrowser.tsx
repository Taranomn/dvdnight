"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode, TouchEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bookmark, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Heart, Info, Star, ThumbsDown, X } from "lucide-react";
import { addMovieAction, dislikeMovieAction, favoriteMovieAction, toggleMovieLikeAction } from "@/lib/actions";
import { hasSession } from "@/lib/client-auth";
import { backdropUrl, cn, formatRating, posterUrl, yearFromDate } from "@/lib/utils";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { RottenTomatoesIcon } from "@/components/RottenTomatoesIcon";
import type { DisplayMovie } from "@/types/movie";

type PlaylistCategory = {
  slug: string;
  title: string;
  description: string;
};

type LoadedPlaylist = PlaylistCategory & {
  movies: DisplayMovie[];
};

type PromptCopy = {
  title: string;
  description: string;
  actionLabel: string;
};

type MobilePlaylistBrowserProps = {
  categories: PlaylistCategory[];
  initialSlug: string;
  initialMovies: DisplayMovie[];
};

const EMPTY_MOVIES: DisplayMovie[] = [];

function getTmdbId(movie: DisplayMovie) {
  return "tmdb_id" in movie ? movie.tmdb_id : movie.id;
}

function getYear(movie: DisplayMovie) {
  return "release_year" in movie ? movie.release_year : yearFromDate(movie.release_date);
}

function getImdb(movie: DisplayMovie) {
  return "imdb_rating" in movie ? movie.imdb_rating : null;
}

function getRotten(movie: DisplayMovie) {
  return "rotten_tomatoes_rating" in movie ? movie.rotten_tomatoes_rating : null;
}

export function MobilePlaylistBrowser({ categories, initialSlug, initialMovies }: MobilePlaylistBrowserProps) {
  const router = useRouter();
  const initialIndex = Math.max(0, categories.findIndex((category) => category.slug === initialSlug));
  const [playlistIndex, setPlaylistIndex] = useState(initialIndex);
  const [movieIndexes, setMovieIndexes] = useState<Record<string, number>>({ [initialSlug]: 0 });
  const [loadedPlaylists, setLoadedPlaylists] = useState<Record<string, LoadedPlaylist>>({
    [initialSlug]: {
      ...categories[initialIndex],
      movies: initialMovies,
    },
  });
  const [selectedActions, setSelectedActions] = useState<Record<string, Set<string>>>({});
  const [prompt, setPrompt] = useState<PromptCopy | null>(null);
  const [isPending, startTransition] = useTransition();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const activeCategory = categories[playlistIndex] ?? categories[0];
  const activePlaylist = loadedPlaylists[activeCategory.slug];
  const activeMovies = activePlaylist?.movies ?? EMPTY_MOVIES;
  const movieIndex = Math.min(movieIndexes[activeCategory.slug] ?? 0, Math.max(activeMovies.length - 1, 0));
  const movie = activeMovies[movieIndex];
  const tmdbId = movie ? getTmdbId(movie) : null;
  const actionKey = tmdbId ? `${activeCategory.slug}-${tmdbId}` : activeCategory.slug;
  const selected = selectedActions[actionKey] ?? new Set<string>();

  useEffect(() => {
    if (loadedPlaylists[activeCategory.slug]) return;
    let cancelled = false;
    fetch(`/api/movies?list=${encodeURIComponent(activeCategory.slug)}&page=1`)
      .then((response) => response.json())
      .then((payload: { results?: DisplayMovie[] }) => {
        if (cancelled) return;
        setLoadedPlaylists((current) => ({
          ...current,
          [activeCategory.slug]: {
            ...activeCategory,
            movies: payload.results ?? [],
          },
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedPlaylists((current) => ({
          ...current,
          [activeCategory.slug]: {
            ...activeCategory,
            movies: [],
          },
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory, loadedPlaylists]);

  const nearbyMovies = useMemo(() => {
    if (!activeMovies.length) return [];
    return [-1, 0, 1].map((offset) => {
      const index = (movieIndex + offset + activeMovies.length) % activeMovies.length;
      return { movie: activeMovies[index], offset, index };
    });
  }, [activeMovies, movieIndex]);

  function moveMovie(direction: 1 | -1) {
    if (!activeMovies.length) return;
    setMovieIndexes((current) => ({
      ...current,
      [activeCategory.slug]: (movieIndex + direction + activeMovies.length) % activeMovies.length,
    }));
  }

  function movePlaylist(direction: 1 | -1) {
    setPlaylistIndex((current) => (current + direction + categories.length) % categories.length);
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 42) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      moveMovie(dx < 0 ? 1 : -1);
      return;
    }
    movePlaylist(dy < 0 ? 1 : -1);
  }

  function markSelected(name: string) {
    setSelectedActions((current) => {
      const next = new Set(current[actionKey] ?? []);
      next.add(name);
      return { ...current, [actionKey]: next };
    });
  }

  function runAction(name: string, action: () => Promise<void>, promptCopy: PromptCopy) {
    if (!tmdbId) return;
    startTransition(async () => {
      if (!(await hasSession())) {
        setPrompt(promptCopy);
        return;
      }
      markSelected(name);
      await action();
      router.refresh();
    });
  }

  function closeBrowser() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  const background = movie ? backdropUrl(movie.backdrop_path) ?? posterUrl(movie.poster_path) : null;

  return (
    <section
      className="relative z-30 -mt-4 h-[calc(100dvh-5.75rem)] overflow-hidden bg-[#05050a] text-white md:hidden"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={onTouchEnd}
    >
      {background ? (
        <Image src={background} alt="" fill priority sizes="100vw" className="object-cover opacity-25 blur-sm scale-105" />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,59,92,0.23),transparent_18rem),linear-gradient(180deg,rgba(5,5,10,0.66),#05050a_76%)]" />
      <div className="relative flex h-full flex-col px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={closeBrowser}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl transition active:scale-95"
            aria-label="Close lists"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 px-3 text-center">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#ff3b5c]">Lists</p>
            <h1 className="truncate text-lg font-black">{activeCategory.title}</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-black text-zinc-300">
            {playlistIndex + 1}/{categories.length}
          </div>
        </header>

        <div className="mt-3 flex items-center justify-center gap-2">
          {categories.map((category, index) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setPlaylistIndex(index)}
              aria-label={category.title}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === playlistIndex ? "w-8 bg-[#ff3b5c] shadow-[0_0_18px_rgba(255,59,92,0.65)]" : "w-2 bg-white/25",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-500">
          <button type="button" onClick={() => movePlaylist(-1)} className="flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-2 active:scale-95">
            <ChevronUp className="h-3.5 w-3.5" />
            Previous shelf
          </button>
          <button type="button" onClick={() => movePlaylist(1)} className="flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-2 active:scale-95">
            Next shelf
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative mt-4 min-h-0 flex-1">
          {!activePlaylist ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-[#ff3b5c]" />
            </div>
          ) : movie ? (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between text-white/40">
                <ChevronLeft className="h-8 w-8" />
                <ChevronRight className="h-8 w-8" />
              </div>
              <div className="relative mx-auto flex h-full max-w-sm items-center justify-center">
                {nearbyMovies.map(({ movie: shelfMovie, offset, index }) => {
                  const poster = posterUrl(shelfMovie.poster_path);
                  const current = offset === 0;
                  return (
                    <article
                      key={`${getTmdbId(shelfMovie)}-${index}`}
                      className={cn(
                        "absolute w-[78%] max-w-[20rem] transition-all duration-300 ease-out",
                        current
                          ? "z-20 translate-x-0 scale-100 opacity-100"
                          : offset < 0
                            ? "z-10 -translate-x-[68%] scale-[0.82] opacity-35"
                            : "z-10 translate-x-[68%] scale-[0.82] opacity-35",
                      )}
                    >
                      <div
                        className={cn(
                          "relative aspect-[2/3] overflow-hidden rounded-[2rem] border bg-[#0b0f1a] shadow-2xl transition",
                          current ? "border-[#ff3b5c]/50 shadow-[#ff3b5c]/20" : "border-white/10 shadow-black/40",
                        )}
                      >
                        {poster ? (
                          <Image src={poster} alt={`${shelfMovie.title} poster`} fill sizes="80vw" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-500">Poster not available</div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent p-4">
                          <div className="flex items-center justify-between gap-3 text-sm font-black">
                            <span className="inline-flex items-center gap-1 text-[#f5c518]">
                              <Star className="h-4 w-4 fill-current" />
                              {typeof getImdb(shelfMovie) === "number" ? formatRating(getImdb(shelfMovie)) : "N/A"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#ff4b4b]">
                              <RottenTomatoesIcon className="h-4 w-4" />
                              {getRotten(shelfMovie) ?? "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
              This shelf is still waiting for movies.
            </div>
          )}
        </div>

        {movie ? (
          <footer className="shrink-0 pb-1">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0b0f1a]/72 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="line-clamp-1 text-2xl font-black">{movie.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {getYear(movie) ?? "Year N/A"} · {movieIndex + 1} of {activeMovies.length}
                  </p>
                </div>
                <Link href={`/movies/${tmdbId}`} className="secondary-button shrink-0 rounded-2xl px-3 py-2 text-xs">
                  More Info
                </Link>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-300">{movie.overview || activeCategory.description}</p>
              <div className="mt-4 grid grid-cols-5 gap-2">
                <ActionButton
                  active={selected.has("like")}
                  disabled={isPending}
                  label="Like"
                  icon={<Heart className="h-5 w-5" />}
                  onClick={() =>
                    runAction("like", () => toggleMovieLikeAction(tmdbId!), {
                      title: "Personalize your recommendations",
                      description: "Sign in to teach Movie Night what you like.",
                      actionLabel: "Sign In",
                    })
                  }
                />
                <ActionButton
                  active={selected.has("dislike")}
                  disabled={isPending}
                  label="Dislike"
                  icon={<ThumbsDown className="h-5 w-5" />}
                  onClick={() =>
                    runAction("dislike", () => dislikeMovieAction(tmdbId!, "explore"), {
                      title: "Personalize your recommendations",
                      description: "Sign in to teach Movie Night what you do not want to see.",
                      actionLabel: "Sign In",
                    })
                  }
                />
                <ActionButton
                  active={selected.has("want")}
                  disabled={isPending}
                  label="Want"
                  icon={<Bookmark className="h-5 w-5" />}
                  onClick={() =>
                    runAction("want", () => addMovieAction(tmdbId!), {
                      title: "Save this movie",
                      description: "Create an account to save movies you want to watch.",
                      actionLabel: "Sign Up",
                    })
                  }
                />
                <ActionButton
                  active={selected.has("favorite")}
                  disabled={isPending}
                  label="Favorite"
                  icon={<Star className="h-5 w-5" />}
                  onClick={() =>
                    runAction("favorite", () => favoriteMovieAction(tmdbId!), {
                      title: "Save favorites",
                      description: "Sign in to keep your favorite movie picks.",
                      actionLabel: "Sign In",
                    })
                  }
                />
                <Link
                  href={`/movies/${tmdbId}`}
                  className="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] text-[0.64rem] font-bold text-zinc-300 transition active:scale-95"
                >
                  <Info className="h-5 w-5" />
                  Info
                </Link>
              </div>
            </div>
          </footer>
        ) : null}
      </div>
      <LoginPromptModal
        open={Boolean(prompt)}
        onClose={() => setPrompt(null)}
        title={prompt?.title ?? ""}
        description={prompt?.description ?? ""}
        actionLabel={prompt?.actionLabel}
        redirectTo={typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"}
      />
    </section>
  );
}

function ActionButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] text-[0.64rem] font-bold text-zinc-300 transition active:scale-95 disabled:opacity-60",
        active && "border-[#ff3b5c]/60 bg-[#ff3b5c]/18 text-white shadow-[0_0_26px_rgba(255,59,92,0.24)]",
      )}
    >
      <span className={cn("transition", active && "scale-110 text-[#ff3b5c]")}>{icon}</span>
      {label}
    </button>
  );
}
