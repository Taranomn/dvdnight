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
    <div
      className={cn(
        "inline-flex min-w-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg shadow-black/20",
        compact ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-2.5",
      )}
    >
      {source === "Rotten Tomatoes" ? (
        <RottenTomatoesIcon className={cn(compact ? "h-3.5 w-3.5" : "h-[1.125rem] w-[1.125rem]", "shrink-0", color)} />
      ) : (
        <Star className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", "shrink-0 fill-current", color)} />
      )}
      <div className="min-w-0 leading-none">
        <div className={cn("whitespace-nowrap font-bold text-white", compact ? "text-xs" : "text-sm")}>{display}</div>
        {!compact ? <div className="mt-1 text-[0.68rem] text-zinc-400">{source}</div> : null}
      </div>
    </div>
  );
}
