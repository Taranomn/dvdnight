import { Star, UsersRound } from "lucide-react";
import type { MovieCommunityStats as MovieCommunityStatsType } from "@/lib/social";

export function MovieCommunityStats({ stats }: { stats: MovieCommunityStatsType }) {
  return (
    <section className="glass rounded-3xl p-5 md:p-7">
      <h2 className="text-2xl font-bold">Movie Night Community</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
          <UsersRound className="h-5 w-5 text-[#00c896]" />
          <div className="mt-3 text-3xl font-black">{stats.watchedCount}</div>
          <div className="text-sm text-zinc-400">users watched this</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
          <Star className="h-5 w-5 fill-current text-[#f5c518]" />
          <div className="mt-3 text-3xl font-black">{stats.averageRating ?? "N/A"}</div>
          <div className="text-sm text-zinc-400">
            user average rating{stats.ratingCount ? ` from ${stats.ratingCount} reviews` : ""}
          </div>
        </div>
      </div>
    </section>
  );
}
