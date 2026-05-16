"use client";

import { CheckCircle2, Heart, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { addMovieAction, markWatchedByTmdbAction, toggleMovieLikeAction } from "@/lib/actions";
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
}: {
  tmdbId: number;
  initialLiked?: boolean;
  initialStatus?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState<{ title: string; description: string; actionLabel: string } | null>(null);
  const [liked, setLiked] = useState(initialLiked);
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/movie-status?tmdbId=${tmdbId}`, { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: MovieStatusPayload | null) => {
        if (ignore || !payload) return;
        setLiked(Boolean(payload.liked));
        setStatus(payload.watchlist?.status ?? null);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [tmdbId]);

  function run(action: () => Promise<void>, promptCopy: { title: string; description: string; actionLabel: string }, after?: () => void) {
    startTransition(async () => {
      if (!(await hasSession())) {
        setPrompt(promptCopy);
        return;
      }
      after?.();
      await action();
      router.refresh();
    });
  }

  const isWatched = status === "watched";
  const isWanted = status === "want_to_watch";

  return (
    <div className="mt-3 grid gap-2">
      <div className="grid grid-cols-[2.75rem_1fr] gap-2">
        <button
        aria-label="Like movie"
        disabled={isPending}
        onClick={() => run(() => toggleMovieLikeAction(tmdbId).then(() => undefined), {
          title: "Personalize your recommendations",
          description: "Sign in to teach MovieMatch what you like.",
          actionLabel: "Sign In",
        }, () => setLiked((value) => !value))}
          className={cn("secondary-button min-h-10 px-2 py-2 text-[#ff3b5c]", liked && "border-[#ff3b5c]/60 bg-[#ff3b5c]/15 shadow-[0_0_18px_rgba(255,59,92,0.18)]")}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        </button>
        <button
        aria-label="Mark watched"
        disabled={isPending}
        onClick={() => run(() => markWatchedByTmdbAction(tmdbId), {
          title: "Track watched movies",
          description: "Create an account to remember what you have watched.",
          actionLabel: "Sign Up",
        }, () => setStatus("watched"))}
          className="secondary-button min-h-10 min-w-0 px-2 py-2 text-xs leading-tight text-zinc-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{isWatched ? "Watch Again" : "Watch"}</span>
        </button>
      </div>
      <button
        aria-label="Add to Want to Watch"
        disabled={isPending}
        onClick={() => run(() => addMovieAction(tmdbId), {
          title: "Save this movie",
          description: "Create an account to save movies you want to watch.",
          actionLabel: "Sign Up",
        }, () => setStatus("want_to_watch"))}
        className={cn("min-h-10 min-w-0 px-2 py-2 text-xs leading-tight", isWanted ? "secondary-button border-white/10 bg-white/[0.045] text-zinc-300" : "primary-button")}
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span className="truncate">{isWanted ? "Already in Want" : "Want to Watch"}</span>
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
