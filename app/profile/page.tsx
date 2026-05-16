import Link from "next/link";
import { LogOut, Pencil, Sparkles } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { logoutAction, updateProfileAction } from "@/lib/actions";
import { getFriends } from "@/lib/friends";
import { createAdminClient, createServerSupabaseClient, requireUser } from "@/lib/supabase/server";
import { getLikedMovies, getUserWatchlist } from "@/lib/watchlist";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const admin = createAdminClient();
  const [{ data: profile }, watchlist, friends, liked, { count: reviewCount }] = await Promise.all([
    supabase!.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getUserWatchlist(user.id),
    getFriends(user.id),
    getLikedMovies(user.id),
    admin.from("movie_comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const watched = watchlist.filter((item) => item.status === "watched").map((item) => item.movies);
  const wantToWatch = watchlist.filter((item) => item.status !== "watched").map((item) => item.movies);
  const genres = Array.from(new Set(watchlist.flatMap((item) => item.movies.genres?.map((genre) => genre.name) ?? []))).slice(0, 6);
  const recent = [...watched, ...liked, ...wantToWatch].slice(0, 6);

  const statCards = [
    { label: "Want to Watch", value: wantToWatch.length, href: `/profile/${user.id}/lists/want-to-watch` },
    { label: "Watched", value: watched.length, href: `/profile/${user.id}/lists/watched` },
    { label: "Liked", value: liked.length, href: `/profile/${user.id}/lists/liked` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f1a]">
        <div className="h-36 bg-[radial-gradient(circle_at_20%_20%,rgba(255,59,92,0.55),transparent_22rem),radial-gradient(circle_at_90%_0%,rgba(124,92,255,0.35),transparent_24rem),#05050a]" />
        <div className="-mt-14 p-5 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-5">
              <ProfileImageUploader userId={user.id} avatarUrl={profile?.avatar_url} />
              <div className="pb-2">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ff3b5c]">Movie profile</p>
                <h1 className="mt-2 text-4xl font-black">{profile?.display_name || "Movie fan"}</h1>
                <p className="mt-1 text-zinc-400">@{profile?.username || "username"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/onboarding" className="secondary-button px-4 py-3 text-sm">
                <Sparkles className="h-4 w-4" />
                Improve Picks
              </Link>
              <form action={logoutAction}>
                <button className="secondary-button px-4 py-3 text-sm" type="submit">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {statCards.map((stat) => (
              <Link key={stat.label} href={stat.href} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-[#ff3b5c]/40">
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="mt-1 text-sm text-zinc-400">{stat.label}</div>
              </Link>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link href="/friends" className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-[#ff3b5c]/40">
              <div className="text-2xl font-black">{friends.length}</div>
              <div className="mt-1 text-sm text-zinc-400">Friends</div>
            </Link>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl font-black">{reviewCount ?? 0}</div>
              <div className="mt-1 text-sm text-zinc-400">Reviews</div>
            </div>
          </div>
          {genres.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {genres.map((genre) => (
                <span key={genre} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-zinc-300">
                  {genre}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-[2rem] p-6">
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-[#ff3b5c]" />
            <h2 className="text-2xl font-bold">Edit Profile</h2>
          </div>
          <form action={updateProfileAction} className="mt-4 grid gap-4">
            <input name="displayName" defaultValue={profile?.display_name ?? ""} placeholder="Display name" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
            <input name="username" defaultValue={profile?.username ?? ""} placeholder="Username" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
            <button className="primary-button h-12 w-fit px-6">Save Profile</button>
          </form>
        </div>
        <div className="glass rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Recent Movie Activity</h2>
          <p className="mt-1 text-sm text-zinc-400">A quick shelf from what you watched, liked, and saved.</p>
          <div className="mt-5">
            {recent.length ? (
              <MovieGrid movies={recent} actionVariant="compact" className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3" />
            ) : (
              <p className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm text-zinc-400">
                Your movie story is still on the opening credits. Add a few films and this becomes useful.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
