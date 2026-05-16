import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { MovieGrid } from "@/components/MovieGrid";
import { createAdminClient, requireUser } from "@/lib/supabase/server";
import type { StoredMovie, WatchlistItem } from "@/types/movie";
import type { Profile } from "@/types/user";

const listMeta = {
  "want-to-watch": {
    title: "Want to Watch",
    empty: "No movies saved for later yet.",
  },
  watched: {
    title: "Watched",
    empty: "No watched movies yet.",
  },
  liked: {
    title: "Liked",
    empty: "No liked movies yet.",
  },
};

async function canViewProfile(viewerId: string, profileId: string) {
  if (viewerId === profileId) return true;
  const admin = createAdminClient();
  const { data } = await admin
    .from("friendships")
    .select("id")
    .eq("user_id", viewerId)
    .eq("friend_id", profileId)
    .maybeSingle();
  return Boolean(data);
}

export default async function ProfileMovieListPage({
  params,
}: {
  params: Promise<{ userId: string; type: keyof typeof listMeta }>;
}) {
  const viewer = await requireUser();
  const { userId, type } = await params;
  const meta = listMeta[type];
  if (!meta || !(await canViewProfile(viewer.id, userId))) notFound();

  const admin = createAdminClient();
  const [{ data: profile }, { data: watchlistRows }, { data: likeRows }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("watchlist").select("*, movies(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    type === "liked"
      ? admin.from("movie_likes").select("*, movies(*)").eq("user_id", userId).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  if (!profile) notFound();

  const typedProfile = profile as Profile;
  const watchlist = (watchlistRows ?? []) as WatchlistItem[];
  const movies =
    type === "liked"
      ? ((likeRows ?? []).map((row) => row.movies).filter(Boolean) as StoredMovie[])
      : watchlist
          .filter((item) => (type === "watched" ? item.status === "watched" : item.status !== "watched"))
          .map((item) => item.movies);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <Link href={`/profile/${userId}`} className="secondary-button mb-6 w-fit px-4 py-2 text-sm">
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ff3b5c]">
            {typedProfile.display_name || typedProfile.username || "Movie friend"}
          </p>
          <h1 className="mt-2 text-4xl font-black">{meta.title}</h1>
          <p className="mt-2 text-zinc-400">{movies.length} movies</p>
        </div>
      </div>
      <div className="mt-8">
        {movies.length ? (
          <MovieGrid movies={movies} actionVariant="compact" />
        ) : (
          <EmptyState title={meta.empty} message="The credits have not rolled here yet." href="/search" action="Find movies" />
        )}
      </div>
    </div>
  );
}
