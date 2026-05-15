import Link from "next/link";
import { addMovieToCuratedListAction, createCuratedListAction } from "@/lib/actions";
import { createServerSupabaseClient, requireUser } from "@/lib/supabase/server";

export default async function AdminPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <div className="glass rounded-[2rem] p-8">
          <h1 className="text-3xl font-black">Admin Access Required</h1>
          <p className="mt-3 text-zinc-400">
            Set your profile role to admin in Supabase SQL Editor to use this panel:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/40 p-4 text-sm text-zinc-300">
            update public.profiles set role = &apos;admin&apos; where email = &apos;you@example.com&apos;;
          </pre>
        </div>
      </div>
    );
  }

  const [{ data: lists }, { data: profiles }, { data: movies }] = await Promise.all([
    supabase!.from("curated_lists").select("*").order("created_at", { ascending: false }),
    supabase!.from("profiles").select("id, username, display_name, role, created_at").order("created_at", { ascending: false }).limit(20),
    supabase!.from("movies").select("*").order("updated_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Admin Panel</h1>
      <p className="mt-2 text-zinc-400">Manage curated playlists, cached movies, and users.</p>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <form action={createCuratedListAction} className="glass rounded-3xl p-5">
          <h2 className="text-2xl font-bold">Create Playlist</h2>
          <div className="mt-4 grid gap-3">
            <input name="title" required placeholder="Playlist title" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
            <input name="slug" required placeholder="playlist-slug" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
            <textarea name="description" placeholder="Description" className="min-h-24 rounded-2xl border border-white/10 bg-white/[0.055] p-4 outline-none" />
            <button className="primary-button h-12 px-5">Save Playlist</button>
          </div>
        </form>

        <form action={addMovieToCuratedListAction} className="glass rounded-3xl p-5">
          <h2 className="text-2xl font-bold">Add Movie to Playlist</h2>
          <div className="mt-4 grid gap-3">
            <select name="listId" required className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4">
              <option value="">Choose playlist</option>
              {(lists ?? []).map((list) => (
                <option key={list.id} value={list.id}>{list.title}</option>
              ))}
            </select>
            <input name="tmdbId" required inputMode="numeric" placeholder="TMDB movie ID" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
            <input name="position" inputMode="numeric" placeholder="Position" className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none" />
            <button className="primary-button h-12 px-5">Add Movie</button>
          </div>
        </form>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-3xl p-5 lg:col-span-1">
          <h2 className="text-xl font-bold">Playlists</h2>
          <div className="mt-4 space-y-3">
            {(lists ?? []).map((list) => (
              <Link key={list.id} href={`/lists/${list.slug}`} className="block rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="font-semibold">{list.title}</div>
                <div className="text-sm text-zinc-500">/{list.slug}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <h2 className="text-xl font-bold">Recent Users</h2>
          <div className="mt-4 space-y-2 text-sm">
            {(profiles ?? []).map((item) => (
              <div key={item.id} className="flex justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <span>{item.display_name || item.username || "User"}</span>
                <span className="text-zinc-500">{item.role}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <h2 className="text-xl font-bold">Cached Movies</h2>
          <div className="mt-4 space-y-2 text-sm">
            {(movies ?? []).map((movie) => (
              <Link key={movie.id} href={`/movies/${movie.tmdb_id}`} className="block rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                {movie.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
