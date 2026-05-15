"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrailerEmbed({ trailerKey, className }: { trailerKey?: string | null; className?: string }) {
  const [open, setOpen] = useState(false);

  if (!trailerKey) {
    return (
      <div className={cn("rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-400", className)}>
        Trailer not available
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("primary-button px-5 py-3", className)}>
        <Play className="h-4 w-4 fill-current" />
        Watch Trailer
      </button>
      {open ? (
        <div className="trailer-backdrop fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/85 px-3 py-16 backdrop-blur-md sm:p-6">
          <div className="trailer-forward glass relative w-full max-w-5xl rounded-3xl p-2 sm:p-3">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white p-2 text-black sm:-right-3 sm:-top-3"
              aria-label="Close trailer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title="Movie trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
