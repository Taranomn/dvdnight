import Link from "next/link";
import { UserRound } from "lucide-react";
import type { Friendship } from "@/types/friend";

export function FriendCard({ friendship }: { friendship: Friendship }) {
  const friend = friendship.friend;
  return (
    <Link href={`/profile/${friend.id}`} className="glass flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-[#ff3b5c]/40 hover:bg-white/[0.06]">
      {friend.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={friend.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff]">
          <UserRound className="h-6 w-6" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold">{friend.display_name || friend.username || "Movie friend"}</h3>
        <p className="truncate text-sm text-zinc-400">@{friend.username || "no-username"}</p>
      </div>
    </Link>
  );
}
