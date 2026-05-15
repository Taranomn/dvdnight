import { UserRound } from "lucide-react";
import type { FriendRequest } from "@/types/friend";
import { acceptFriendRequestAction, declineFriendRequestAction } from "@/lib/actions";

export function FriendRequestCard({ request }: { request: FriendRequest }) {
  const profile = request.sender;
  return (
    <article className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <UserRound className="h-6 w-6 text-[#ff3b5c]" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold">{profile?.display_name || profile?.username || "Movie friend"}</h3>
        <p className="truncate text-sm text-zinc-400">@{profile?.username || "no-username"}</p>
      </div>
      <form action={acceptFriendRequestAction.bind(null, request.id)}>
        <button className="primary-button px-4 py-2 text-sm">Accept</button>
      </form>
      <form action={declineFriendRequestAction.bind(null, request.id)}>
        <button className="secondary-button px-4 py-2 text-sm">Decline</button>
      </form>
    </article>
  );
}
