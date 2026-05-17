"use client";

import { CheckCircle2, Heart, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { addMovieAction, markWatchedByTmdbAction, removeMovieAction, setWatchlistStatusAction, toggleMovieLikeAction } from "@/lib/actions";
import { hasSession } from "@/lib/client-auth";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { cn } from "@/lib/utils";

type MovieStatusPayload = {
  liked: boolean;
  watchlist: { id?: string; movie_id: string; status?: string | null } | null;
};

export function CompactMovieActions({
  tmdbId,
  initialLiked = false,
  initialStatus,
  initialMovieId,
}: {
  tmdbId: number;
  initialLiked?: boolean;
  initialStatus?: string | null;
  initialMovieId?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState<{ title: string; description: string; actionLabel: string } | null>(null);
  const [liked, setLiked] = useState(initialLiked);
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);
  const [movieId, setMovieId] = useState<string | null>(initialMovieId ?? null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/movie-status?tmdbId=${tmdbId}`, { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: MovieStatusPayload | null) => {
        if (ignore || !payload) return;
        setLiked(Boolean(payload.liked));
        setStatus(payload.watchlist?.status ?? null);
        setMovieId(payload.watchlist?.movie_id ?? null);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [tmdbId]);

  function run(action: () => Promise<unknown>, promptCopy: { title: string; description: string; actionLabel: string }) {
    startTransition(async () => {
      if (!(await hasSession())) {
        setPrompt(promptCopy);
        return;
      }
      await action();
      router.refresh();
    });
  }

  const isWatched = status === "watched" || status === "watched_watchlist";
  const isInWatchlist = status === "want_to_watch" || status === "watched_watchlist";

  return (
    <div className="mt-3 grid gap-2">
      <div className="grid grid-cols-[2.75rem_1fr] gap-2">
        <button
          aria-label={liked ? "Unlike movie" : "Like movie"}
          disabled={isPending}
          onClick={() => run(async () => {
            await toggleMovieLikeAction(tmdbId);
            setLiked((value) => !value);
          }, {
            title: "Personalize your recommendations",
            description: "Sign in to teach MovieMatch what you like.",
            actionLabel: "Sign In",
          })}
          className={cn("secondary-button min-h-10 px-2 py-2 text-[#ff3b5c]", liked && "border-[#ff3b5c]/60 bg-[#ff3b5c]/15 shadow-[0_0_18px_rgba(255,59,92,0.18)]")}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        </button>
        <button
          aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
          disabled={isPending}
          onClick={() => run(async () => {
            if (isWatched && movieId) {
              if (isInWatchlist) {
                await setWatchlistStatusAction(movieId, "want_to_watch", tmdbId);
                setStatus("want_to_watch");
              } else {
                await removeMovieAction(movieId, tmdbId);
                setStatus(null);
                setMovieId(null);
              }
              return;
            }
            if (movieId) {
              const nextStatus = isInWatchlist ? "watched_watchlist" : "watched";
              await setWatchlistStatusAction(movieId, nextStatus, tmdbId);
              setStatus(nextStatus);
              return;
            }
            const result = await markWatchedByTmdbAction(tmdbId);
            setMovieId(result.movieId);
            setStatus("watched");
          }, {
            title: "Track watched movies",
            description: "Create an account to remember what you have watched.",
            actionLabel: "Sign Up",
          })}
          className={cn("secondary-button min-h-10 min-w-0 px-2 py-2 text-xs leading-tight text-[#00c896]", isWatched && "border-[#00c896]/60 bg-[#00c896]/10")}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{isWatched ? "Watched" : "Watch"}</span>
        </button>
      </div>
      <button
        aria-label={isInWatchlist ? "Remove from Watch List" : "Add to Watch List"}
        disabled={isPending}
        onClick={() => run(async () => {
          if (isInWatchlist && movieId) {
            await removeMovieAction(movieId, tmdbId);
            setStatus(isWatched ? "watched" : null);
            if (!isWatched) setMovieId(null);
            return;
          }
          const result = await addMovieAction(tmdbId);
          setMovieId(result.movieId);
          setStatus(isWatched ? "watched_watchlist" : "want_to_watch");
        }, {
          title: "Save this movie",
          description: "Create an account to save movies to your watch list.",
          actionLabel: "Sign Up",
        })}
        className={cn(
          "min-h-10 min-w-0 px-2 py-2 text-xs leading-tight",
          isWatched || isInWatchlist ? "secondary-button border-white/10 bg-white/[0.045] text-zinc-300" : "primary-button",
        )}
      >
        {isWatched ? <RotateCcw className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
        <span className="truncate">{isWatched && !isInWatchlist ? "Watch Again" : isInWatchlist ? "Added to Watch List" : "Watch List"}</span>
      </button>
      <LoginPromptModal
        open={Boolean(prompt)}
        onClose={() => setPrompt(null)}
        title={prompt?.title ?? ""}
        description={prompt?.description ?? ""}
        actionLabel={prompt?.actionLabel}
        redirectTo={typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"}
      />
    </div>
  );
}
