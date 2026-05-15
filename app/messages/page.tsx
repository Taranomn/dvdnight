import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { getFriends } from "@/lib/friends";
import { requireUser } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const user = await requireUser();
  const friends = await getFriends(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8">
      <div>
        <h1 className="text-4xl font-black">Messages</h1>
        <p className="mt-2 text-zinc-400">Open a friend profile to chat about what to watch next.</p>
      </div>
      <div className="mt-8 grid gap-3">
        {friends.map((friendship) => (
          <Link
            key={friendship.id}
            href={`/profile/${friendship.friend_id}`}
            className="glass flex items-center justify-between gap-4 rounded-3xl p-4 transition hover:-translate-y-1 hover:border-[#ff3b5c]/50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ff3b5c]/20 font-bold">
                {(friendship.friend.display_name || friendship.friend.username || "M").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold">{friendship.friend.display_name || friendship.friend.username || "Movie friend"}</div>
                <div className="truncate text-sm text-zinc-500">@{friendship.friend.username || "friend"}</div>
              </div>
            </div>
            <MessageCircle className="h-5 w-5 text-[#ff3b5c]" />
          </Link>
        ))}
        {!friends.length ? (
          <EmptyState title="No message threads yet" message="Add friends first, then you can chat from their profile." href="/friends" action="Find friends" />
        ) : null}
      </div>
    </div>
  );
}
