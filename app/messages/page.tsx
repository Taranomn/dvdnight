import Link from "next/link";
import { Edit3, Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { MessengerAvatar } from "@/components/MessengerAvatar";
import { getFriends } from "@/lib/friends";
import { getMessageThreads } from "@/lib/social";
import { requireUser } from "@/lib/supabase/server";

function formatWhen(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { weekday: "short" });
}

export default async function MessagesPage() {
  const user = await requireUser();
  const threadResult = await getMessageThreads(user.id)
    .then((threads) => ({ threads, loadError: false }))
    .catch(async () => {
    const friends = await getFriends(user.id).catch(() => []);
      return {
        loadError: true,
        threads: friends.map((friendship) => ({
          friend: friendship.friend,
          lastMessage: null,
          unreadCount: 0,
        })),
      };
    });
  const { threads, loadError } = threadResult;

  return (
    <div className="mx-auto min-h-[calc(100dvh-6rem)] max-w-4xl px-4 pb-8 md:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-normal">Messages</h1>
          <p className="mt-2 text-lg text-zinc-400">Plan what to watch together</p>
        </div>
        <Link href="/friends" className="secondary-button h-14 w-14 rounded-3xl p-0 text-[#ff3b5c]" aria-label="New message">
          <Edit3 className="h-6 w-6" />
        </Link>
      </div>

      <div className="mt-7 flex h-16 items-center gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.06] px-5 shadow-2xl shadow-black/30">
        <Search className="h-6 w-6 text-zinc-500" />
        <input
          placeholder="Search friends or movies..."
          className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-zinc-500"
        />
      </div>

      <div className="mt-7 space-y-4">
        {loadError ? (
          <div className="rounded-3xl border border-[#ff3b5c]/30 bg-[#ff3b5c]/10 p-4 text-sm text-zinc-200">
            Messages need the social database migration before conversations can load fully. I am showing your friends so you can still open a chat.
          </div>
        ) : null}
        {threads.map((thread) => {
          const name = thread.friend.display_name || thread.friend.username || "Movie friend";
          const mine = thread.lastMessage?.sender_id === user.id;
          const preview = thread.lastMessage ? `${mine ? "You: " : ""}${thread.lastMessage.body}` : "Start planning your next movie night.";
          return (
            <Link
              key={thread.friend.id}
              href={`/messages/${thread.friend.id}`}
              className="group flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#ff3b5c]/50 hover:bg-white/[0.07]"
            >
              <MessengerAvatar profile={thread.friend} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-2xl font-black">{name}</h2>
                  <span className="shrink-0 text-sm text-zinc-400">{formatWhen(thread.lastMessage?.created_at)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-lg leading-7 text-zinc-400">
                  {mine ? <span className="text-[#ff3b5c]">You: </span> : null}
                  {thread.lastMessage?.body ?? preview}
                </p>
              </div>
              {thread.unreadCount ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff3b5c] text-sm font-black text-white shadow-lg shadow-[#ff3b5c]/30">
                  {thread.unreadCount}
                </div>
              ) : null}
            </Link>
          );
        })}
        {!threads.length ? (
          <EmptyState title="No message threads yet" message="Add friends first, then start planning what to watch together." href="/friends" action="Find friends" />
        ) : null}
      </div>
    </div>
  );
}
