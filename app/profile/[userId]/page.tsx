import { notFound } from "next/navigation";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import { MovieGrid } from "@/components/MovieGrid";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/server";
import { getConversation } from "@/lib/social";
import type { StoredMovie, WatchlistItem } from "@/types/movie";
import type { Profile } from "@/types/user";

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

export default async function FriendProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const viewer = await requireUser();
  const { userId } = await params;
  const allowed = await canViewProfile(viewer.id, userId);
  if (!allowed) notFound();

  const admin = createAdminClient();
  const [{ data: profile }, { data: watchlistRows }, { data: likeRows }, messages] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("watchlist").select("*, movies(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("movie_likes").select("*, movies(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    getConversation(viewer.id, userId).catch(() => []),
  ]);
  if (!profile) notFound();

  const typedProfile = profile as Profile;
  const watchlist = (watchlistRows ?? []) as WatchlistItem[];
  const watched = watchlist.filter((item) => item.status === "watched").map((item) => item.movies);
  const wantToWatch = watchlist.filter((item) => item.status !== "watched").map((item) => item.movies);
  const liked = (likeRows ?? []).map((row) => row.movies).filter(Boolean) as StoredMovie[];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <section className="glass rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff] text-4xl font-black">
            {typedProfile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={typedProfile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (typedProfile.display_name || typedProfile.username || "M").slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black">{typedProfile.display_name || typedProfile.username || "Movie friend"}</h1>
            <p className="mt-1 text-zinc-400">@{typedProfile.username || "no-username"}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-3xl font-black">{wantToWatch.length}</div>
            <div className="text-sm text-zinc-400">Wishlist</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-3xl font-black">{watched.length}</div>
            <div className="text-sm text-zinc-400">Watched</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-3xl font-black">{liked.length}</div>
            <div className="text-sm text-zinc-400">Liked</div>
          </div>
        </div>
      </section>
      {viewer.id !== userId ? <DirectMessagePanel friendId={userId} viewerId={viewer.id} messages={messages} /> : null}

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Wishlist</h2>
        {wantToWatch.length ? <MovieGrid movies={wantToWatch} /> : <p className="text-zinc-400">No wishlist movies yet.</p>}
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Watched</h2>
        {watched.length ? <MovieGrid movies={watched} /> : <p className="text-zinc-400">No watched movies yet.</p>}
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Liked</h2>
        {liked.length ? <MovieGrid movies={liked} /> : <p className="text-zinc-400">No liked movies yet.</p>}
      </section>
    </div>
  );
}
