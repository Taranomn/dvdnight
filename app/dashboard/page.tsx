import Link from "next/link";
import { getFriends } from "@/lib/friends";
import { requireUser } from "@/lib/supabase/server";
import { getUserWatchlist } from "@/lib/watchlist";

export default async function DashboardPage() {
  const user = await requireUser();
  const [watchlist, friends] = await Promise.all([getUserWatchlist(user.id), getFriends(user.id)]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Dashboard</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Link href="/watchlist" className="glass rounded-3xl p-6">
          <div className="text-4xl font-black">{watchlist.length}</div>
          <div className="mt-2 text-zinc-400">Want to Watch</div>
        </Link>
        <Link href="/friends" className="glass rounded-3xl p-6">
          <div className="text-4xl font-black">{friends.length}</div>
          <div className="mt-2 text-zinc-400">Friends</div>
        </Link>
        <Link href="/match" className="glass rounded-3xl p-6">
          <div className="text-4xl font-black">Match</div>
          <div className="mt-2 text-zinc-400">Find a shared movie</div>
        </Link>
      </div>
    </div>
  );
}
