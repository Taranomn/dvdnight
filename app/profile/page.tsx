import { updateProfileAction } from "@/lib/actions";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { getFriends } from "@/lib/friends";
import { createServerSupabaseClient, requireUser } from "@/lib/supabase/server";
import { getUserWatchlist } from "@/lib/watchlist";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const [{ data: profile }, watchlist, friends] = await Promise.all([
    supabase!.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getUserWatchlist(user.id),
    getFriends(user.id),
  ]);
  const genres = Array.from(new Set(watchlist.flatMap((item) => item.movies.genres?.map((genre) => genre.name) ?? []))).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8">
      <section className="glass rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <ProfileImageUploader userId={user.id} avatarUrl={profile?.avatar_url} />
          <div>
            <h1 className="text-4xl font-black">{profile?.display_name || "Movie fan"}</h1>
            <p className="mt-1 text-zinc-400">@{profile?.username || "username"}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-3xl font-black">{watchlist.length}</div>
            <div className="text-sm text-zinc-400">Watchlist movies</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-3xl font-black">{friends.length}</div>
            <div className="text-sm text-zinc-400">Friends</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-3xl font-black">{genres.length}</div>
            <div className="text-sm text-zinc-400">Favorite genres</div>
          </div>
        </div>
        {genres.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <span key={genre} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-zinc-300">
                {genre}
              </span>
            ))}
          </div>
        ) : null}
      </section>
      <section className="glass mt-6 rounded-[2rem] p-6">
        <h2 className="text-2xl font-bold">Edit Profile</h2>
        <form action={updateProfileAction} className="mt-4 grid gap-4">
          <input name="displayName" defaultValue={profile?.display_name ?? ""} placeholder="Display name" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
          <input name="username" defaultValue={profile?.username ?? ""} placeholder="Username" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
          <button className="primary-button h-12 w-fit px-6">Save Profile</button>
        </form>
      </section>
    </div>
  );
}
