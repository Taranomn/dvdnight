import Link from "next/link";
import { Send, UserRound } from "lucide-react";
import { shareMovieToFriendAction } from "@/lib/actions";
import type { Friendship } from "@/types/friend";

export function ShareMoviePanel({
  friends,
  signedIn,
  tmdbId,
}: {
  friends: Friendship[];
  signedIn: boolean;
  tmdbId: number;
}) {
  return (
    <section className="glass rounded-3xl p-5 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Share With A Friend</h2>
          <p className="mt-1 text-sm text-zinc-400">Send this movie into a chat so you can plan what to watch.</p>
        </div>
        <Send className="h-5 w-5 shrink-0 text-[#ff3b5c]" />
      </div>

      {!signedIn ? (
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-sm text-zinc-300">
          Sign in to share movies with friends.
          <Link href="/login" className="ml-2 font-semibold text-[#ff3b5c]">
            Log in
          </Link>
        </div>
      ) : null}

      {signedIn && !friends.length ? (
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-sm text-zinc-300">
          Add friends first, then you can share movies directly into messages.
          <Link href="/friends" className="ml-2 font-semibold text-[#ff3b5c]">
            Find friends
          </Link>
        </div>
      ) : null}

      {signedIn && friends.length ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {friends.slice(0, 6).map((friendship) => {
            const friend = friendship.friend;
            const name = friend.display_name || friend.username || "Movie friend";
            return (
              <form key={friendship.id} action={shareMovieToFriendAction.bind(null, friend.id, tmdbId)}>
                <button className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#ff3b5c]/45 hover:bg-[#ff3b5c]/10">
                  {friend.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff]">
                      <UserRound className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{name}</span>
                    <span className="block truncate text-xs text-zinc-500">@{friend.username || "friend"}</span>
                  </span>
                  <Send className="h-4 w-4 shrink-0 text-[#ff3b5c]" />
                </button>
              </form>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
