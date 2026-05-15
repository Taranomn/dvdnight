import { Star } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";
import { RottenTomatoesIcon } from "@/components/RottenTomatoesIcon";

type RatingBadgeProps = {
  source: "IMDb" | "Rotten Tomatoes";
  value?: number | string | null;
  compact?: boolean;
};

export function RatingBadge({ source, value, compact }: RatingBadgeProps) {
  const display = typeof value === "number" ? formatRating(value) : value && value !== "N/A" ? value : "N/A";
  const color = source === "IMDb" ? "text-[#f5c518]" : "text-[#ff4b4b]";

  return (
    <div className="inline-flex min-w-0 items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.045] px-1 py-2">
      {source === "Rotten Tomatoes" ? (
        <RottenTomatoesIcon className={cn("h-3.5 w-3.5 shrink-0", color)} />
      ) : (
        <Star className={cn("h-3 w-3 shrink-0 fill-current", color)} />
      )}
      <div className="min-w-0 leading-none">
        <div className="whitespace-nowrap text-[0.62rem] font-bold text-white">{display}</div>
        {!compact ? <div className="mt-1 text-[0.65rem] text-zinc-400">{source}</div> : null}
      </div>
    </div>
  );
}
