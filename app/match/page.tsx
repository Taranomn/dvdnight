import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { getFriends } from "@/lib/friends";
import { requireUser } from "@/lib/supabase/server";

export default async function MatchPage() {
  const user = await requireUser();
  const friends = await getFriends(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Match</h1>
      <p className="mt-2 text-zinc-400">Tap a friend to discover the movies you both saved.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {friends.length ? (
          friends.map((friendship) => (
            <Link
              key={friendship.id}
              href={`/match/${friendship.friend.id}`}
              className="glass rounded-3xl p-5 transition hover:-translate-y-1 hover:border-[#ff3b5c]/40"
            >
              <h2 className="text-xl font-bold">{friendship.friend.display_name || friendship.friend.username}</h2>
              <p className="mt-1 text-sm text-zinc-400">@{friendship.friend.username}</p>
            </Link>
          ))
        ) : (
          <EmptyState title="No friends to match yet" message="Add a friend first, then compare your Watch Lists." href="/friends" action="Find friends" />
        )}
      </div>
    </div>
  );
}
