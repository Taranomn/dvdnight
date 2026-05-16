"use client";

import { Bookmark, Heart, CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addMovieAction, markWatchedByTmdbAction, setWatchlistStatusAction, toggleMovieLikeAction } from "@/lib/actions";
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
  const [isLiked, setIsLiked] = useState(Boolean(liked));
  const [currentStatus, setCurrentStatus] = useState<string | null>(status ?? null);
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState<{ title: string; description: string; actionLabel: string } | null>(null);

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
          });
        }}
      >
        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        {isLiked ? "Liked" : "Like"}
      </button>
      <button
        className={cn("secondary-button px-4 py-3", currentStatus === "want_to_watch" && "border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-[#ff3b5c]")}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            if (!(await hasSession())) {
              setPrompt({
                title: "Save this movie",
                description: "Create an account to save movies you want to watch.",
                actionLabel: "Sign Up",
              });
              return;
            }
            await addMovieAction(tmdbId);
            setCurrentStatus("want_to_watch");
          });
        }}
      >
        <Bookmark className={cn("h-4 w-4", currentStatus === "want_to_watch" && "fill-current")} />
        {currentStatus === "want_to_watch" ? "Want to Watch" : "Want to Watch"}
      </button>
      <button
        className={cn("secondary-button px-4 py-3", currentStatus === "watched" && "border-[#00c896]/50 bg-[#00c896]/10 text-[#00c896]")}
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
            if (movieId) {
              await setWatchlistStatusAction(movieId, "watched", tmdbId);
              setCurrentStatus("watched");
            } else {
              await markWatchedByTmdbAction(tmdbId);
              setCurrentStatus("watched");
            }
          });
        }}
      >
        <CheckCircle2 className={cn("h-4 w-4", currentStatus === "watched" && "fill-current")} />
        {currentStatus === "watched" ? "Watched" : "Mark Watched"}
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
