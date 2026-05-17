"use client";

import { Bookmark, Heart, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addMovieAction, markWatchedByTmdbAction, removeMovieAction, setWatchlistStatusAction, toggleMovieLikeAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { hasSession } from "@/lib/client-auth";
import { LoginPromptModal } from "@/components/LoginPromptModal";

type MovieStatusActionsProps = {
  tmdbId: number;
  movieId?: string | null;
  status?: string | null;
  liked?: boolean;
};

export function MovieStatusActions({ tmdbId, movieId, status, liked }: MovieStatusActionsProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(Boolean(liked));
  const [currentStatus, setCurrentStatus] = useState<string | null>(status ?? null);
  const [currentMovieId, setCurrentMovieId] = useState<string | null>(movieId ?? null);
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState<{ title: string; description: string; actionLabel: string } | null>(null);
  const isWatched = currentStatus === "watched" || currentStatus === "watched_watchlist";
  const isInWatchlist = currentStatus === "want_to_watch" || currentStatus === "watched_watchlist";

  return (
    <div className="flex flex-wrap gap-3">
      <button
        className={cn("secondary-button px-4 py-3", isLiked && "border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-[#ff3b5c]")}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            if (!(await hasSession())) {
              setPrompt({
                title: "Personalize your recommendations",
                description: "Sign in to teach MovieMatch what you like.",
                actionLabel: "Sign In",
              });
              return;
            }
            await toggleMovieLikeAction(tmdbId);
            setIsLiked((value) => !value);
            router.refresh();
          });
        }}
      >
        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        {isLiked ? "Liked" : "Like"}
      </button>
      <button
        className={cn("secondary-button px-4 py-3", isInWatchlist && "border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-[#ff3b5c]")}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            if (!(await hasSession())) {
              setPrompt({
                title: "Save this movie",
                description: "Create an account to save movies to your watch list.",
                actionLabel: "Sign Up",
              });
              return;
            }
            if (isInWatchlist && currentMovieId) {
              await removeMovieAction(currentMovieId, tmdbId);
              setCurrentStatus(isWatched ? "watched" : null);
              if (!isWatched) setCurrentMovieId(null);
              router.refresh();
              return;
            }
            const result = await addMovieAction(tmdbId);
            setCurrentMovieId(result.movieId);
            setCurrentStatus(isWatched ? "watched_watchlist" : "want_to_watch");
            router.refresh();
          });
        }}
      >
        <Bookmark className={cn("h-4 w-4", isInWatchlist && "fill-current")} />
        {isInWatchlist ? "Added to Watch List" : "Watch List"}
      </button>
      <button
        className={cn("secondary-button px-4 py-3", isWatched && "border-[#00c896]/50 bg-[#00c896]/10 text-[#00c896]")}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            if (!(await hasSession())) {
              setPrompt({
                title: "Track watched movies",
                description: "Create an account to remember what you have watched.",
                actionLabel: "Sign Up",
              });
              return;
            }
            if (isWatched && currentMovieId) {
              if (isInWatchlist) {
                await setWatchlistStatusAction(currentMovieId, "want_to_watch", tmdbId);
                setCurrentStatus("want_to_watch");
              } else {
                await removeMovieAction(currentMovieId, tmdbId);
                setCurrentStatus(null);
                setCurrentMovieId(null);
              }
              router.refresh();
              return;
            }
            if (currentMovieId) {
              const nextStatus = isInWatchlist ? "watched_watchlist" : "watched";
              await setWatchlistStatusAction(currentMovieId, nextStatus, tmdbId);
              setCurrentStatus(nextStatus);
            } else {
              const result = await markWatchedByTmdbAction(tmdbId);
              setCurrentMovieId(result.movieId);
              setCurrentStatus(isInWatchlist ? "watched_watchlist" : "watched");
            }
            router.refresh();
          });
        }}
      >
        <CheckCircle2 className={cn("h-4 w-4", isWatched && "fill-current")} />
        {isWatched ? "Watched" : "Mark Watched"}
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
