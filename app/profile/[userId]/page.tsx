import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Shuffle, UserMinus } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { removeFriendAction } from "@/lib/actions";
import { createAdminClient, requireUser } from "@/lib/supabase/server";
import { isWatchedStatus, isWatchlistStatus } from "@/lib/watchlist";
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
  const [{ data: profile }, { data: watchlistRows }, { data: likeRows }, { count: reviewCount }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("watchlist").select("*, movies(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("movie_likes").select("*, movies(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("movie_comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  if (!profile) notFound();

  const typedProfile = profile as Profile;
  const watchlist = (watchlistRows ?? []) as WatchlistItem[];
  const watched = watchlist.filter((item) => isWatchedStatus(item.status)).map((item) => item.movies);
  const savedWatchlist = watchlist.filter((item) => isWatchlistStatus(item.status)).map((item) => item.movies);
  const liked = (likeRows ?? []).map((row) => row.movies).filter(Boolean) as StoredMovie[];
  const recent = [...watched, ...liked, ...savedWatchlist].slice(0, 6);
  const name = typedProfile.display_name || typedProfile.username || "Movie friend";
  const stats = [
    { label: "Watch List", value: savedWatchlist.length, href: `/profile/${userId}/lists/want-to-watch` },
    { label: "Watched", value: watched.length, href: `/profile/${userId}/lists/watched` },
    { label: "Liked", value: liked.length, href: `/profile/${userId}/lists/liked` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f1a]">
        <div className="h-36 bg-[radial-gradient(circle_at_25%_15%,rgba(255,59,92,0.55),transparent_22rem),radial-gradient(circle_at_85%_10%,rgba(124,92,255,0.32),transparent_24rem),#05050a]" />
        <div className="-mt-14 p-5 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-5">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#0b0f1a] bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff] text-4xl font-black">
                {typedProfile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={typedProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="pb-2">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ff3b5c]">Movie friend</p>
                <h1 className="mt-2 text-4xl font-black">{name}</h1>
                <p className="mt-1 text-zinc-400">@{typedProfile.username || "no-username"}</p>
              </div>
            </div>
            {viewer.id !== userId ? (
              <div className="flex flex-wrap gap-3">
                <Link href={`/messages/${userId}`} className="primary-button px-4 py-3 text-sm">
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Link>
                <Link href={`/match/${userId}`} className="secondary-button px-4 py-3 text-sm">
                  <Shuffle className="h-4 w-4" />
                  Match
                </Link>
                <form action={removeFriendAction.bind(null, userId)}>
                  <button className="secondary-button px-4 py-3 text-sm">
                    <UserMinus className="h-4 w-4" />
                    Remove
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-[#ff3b5c]/40">
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="mt-1 text-sm text-zinc-400">{stat.label}</div>
              </Link>
            ))}
          </div>
          <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-2xl font-black">{reviewCount ?? 0}</div>
            <div className="mt-1 text-sm text-zinc-400">Reviews</div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <p className="mt-1 text-sm text-zinc-400">A quick look at {name}&apos;s movie taste.</p>
          </div>
        </div>
        {recent.length ? <MovieGrid movies={recent} actionVariant="compact" /> : <p className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-zinc-400">No public movie activity yet.</p>}
      </section>
    </div>
  );
}
