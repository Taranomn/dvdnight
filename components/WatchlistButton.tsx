"use client";

import { useState, useTransition } from "react";
import { Bookmark, Check, Plus } from "lucide-react";
import { addMovieAction, removeMovieAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { hasSession } from "@/lib/client-auth";
import { LoginPromptModal } from "@/components/LoginPromptModal";

type WatchlistButtonProps = {
  tmdbId: number;
  movieId?: string | null;
  inWatchlist?: boolean;
  className?: string;
};

export function WatchlistButton({ tmdbId, movieId, inWatchlist, className }: WatchlistButtonProps) {
  const [saved, setSaved] = useState(Boolean(inWatchlist));
  const [currentMovieId, setCurrentMovieId] = useState(movieId ?? null);
  const [isPending, startTransition] = useTransition();
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <>
      <button
        className={cn(saved ? "secondary-button" : "primary-button", "px-4 py-3 text-center disabled:opacity-60", className)}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            if (!(await hasSession())) {
              setShowPrompt(true);
              return;
            }
            if (saved && currentMovieId) {
              await removeMovieAction(currentMovieId, tmdbId);
              setSaved(false);
              setCurrentMovieId(null);
            } else {
              await addMovieAction(tmdbId);
              setSaved(true);
            }
          });
        }}
      >
        {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {isPending ? "Saving..." : saved ? "Want to Watch" : "Want to Watch"}
        <Bookmark className="h-4 w-4" />
      </button>
      <LoginPromptModal
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        title="Save this movie"
        description="Create an account to save movies you want to watch."
        actionLabel="Sign Up"
        redirectTo={typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"}
      />
    </>
  );
}
