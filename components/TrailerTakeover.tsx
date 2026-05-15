"use client";

import { Play, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function TrailerBackground({ trailerKey, title }: { trailerKey?: string | null; title: string }) {
  if (!trailerKey) return null;
  return (
    <iframe
      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&playsinline=1`}
      title={`${title} background trailer`}
      allow="autoplay; encrypted-media"
      className="absolute left-1/2 top-1/2 h-[120%] w-[220%] -translate-x-1/2 -translate-y-1/2 opacity-35 md:h-[150%] md:w-[150%]"
    />
  );
}

export function TrailerTakeoverButton({
  trailerKey,
  title,
  className,
}: {
  trailerKey?: string | null;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!trailerKey) {
    return (
      <div className={cn("rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400", className)}>
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
        <div className="trailer-backdrop fixed inset-0 z-50 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&modestbranding=1&playsinline=1`}
            title={`${title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="trailer-takeover-screen absolute inset-0 h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
          <button
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/50 p-3 text-white backdrop-blur transition hover:scale-105 hover:bg-white/15"
            aria-label="Close trailer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      ) : null}
    </>
  );
}
