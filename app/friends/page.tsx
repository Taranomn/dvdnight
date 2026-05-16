import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { FriendCard } from "@/components/FriendCard";
import { UserSearch } from "@/components/UserSearch";
import { getFriendRequests, getFriends } from "@/lib/friends";
import { requireUser } from "@/lib/supabase/server";

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const [friends, requests] = await Promise.all([getFriends(user.id), getFriendRequests(user.id)]);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 md:px-8 lg:grid-cols-[1fr_24rem]">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Friends</h1>
            <p className="mt-2 text-zinc-400">Tap a friend to see their profile, messages, and matching options.</p>
          </div>
          <Link href="/friends/requests" className="secondary-button px-4 py-3">
            Requests ({requests.incoming.length})
          </Link>
        </div>
        <div className="mt-6 flex gap-2 border-b border-white/10">
          <span className="border-b-2 border-[#ff3b5c] px-4 py-3 text-sm font-semibold">All Friends</span>
          <Link href="/friends/requests" className="px-4 py-3 text-sm font-semibold text-zinc-500">
            Requests
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          {friends.length ? (
            friends.map((friendship) => <FriendCard key={friendship.id} friendship={friendship} />)
          ) : (
            <EmptyState title="No friends yet" message="Search for another user and send a friend request to start matching." />
          )}
        </div>
      </section>
      <aside>
        <UserSearch query={q} currentUserId={user.id} />
      </aside>
    </div>
  );
}
