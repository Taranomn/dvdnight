"use client";

import { CheckCircle2, Heart, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addMovieAction, markWatchedByTmdbAction, toggleMovieLikeAction } from "@/lib/actions";
import { hasSession } from "@/lib/client-auth";
import { LoginPromptModal } from "@/components/LoginPromptModal";

export function CompactMovieActions({ tmdbId }: { tmdbId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState<{ title: string; description: string; actionLabel: string } | null>(null);

  function run(action: () => Promise<void>, promptCopy: { title: string; description: string; actionLabel: string }) {
    startTransition(async () => {
      if (!(await hasSession())) {
        setPrompt(promptCopy);
        return;
      }
      await action();
      router.refresh();
    });
  }

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
        })}
          className="secondary-button min-h-10 px-2 py-2 text-[#ff3b5c]"
        >
          <Heart className="h-4 w-4" />
        </button>
        <button
        aria-label="Mark watched"
        disabled={isPending}
        onClick={() => run(() => markWatchedByTmdbAction(tmdbId), {
          title: "Track watched movies",
          description: "Create an account to remember what you have watched.",
          actionLabel: "Sign Up",
        })}
          className="secondary-button min-h-10 min-w-0 px-2 py-2 text-xs leading-tight text-[#00c896]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">Watched</span>
        </button>
      </div>
      <button
        aria-label="Add to watchlist"
        disabled={isPending}
        onClick={() => run(() => addMovieAction(tmdbId), {
          title: "Save this movie",
          description: "Create an account to save movies to your watchlist.",
          actionLabel: "Sign Up",
        })}
        className="primary-button min-h-10 min-w-0 px-2 py-2 text-xs leading-tight"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span className="truncate">Wishlist</span>
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
