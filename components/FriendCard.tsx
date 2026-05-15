import Link from "next/link";
import { UserRound, Users } from "lucide-react";
import type { Friendship } from "@/types/friend";
import { removeFriendAction } from "@/lib/actions";

export function FriendCard({ friendship }: { friendship: Friendship }) {
  const friend = friendship.friend;
  return (
    <article className="glass flex items-center gap-4 rounded-2xl p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff]">
        <UserRound className="h-6 w-6" />
      </div>
      <Link href={`/profile/${friend.id}`} className="min-w-0 flex-1 transition hover:text-[#ff3b5c]">
        <h3 className="truncate font-bold">{friend.display_name || friend.username || "Movie friend"}</h3>
        <p className="truncate text-sm text-zinc-400">@{friend.username || "no-username"}</p>
      </Link>
      <Link href={`/match/${friend.id}`} className="primary-button px-4 py-2 text-sm">
        <Users className="h-4 w-4" />
        Match
      </Link>
      <form action={removeFriendAction.bind(null, friend.id)}>
        <button className="secondary-button px-3 py-2 text-sm">Remove</button>
      </form>
    </article>
  );
}
