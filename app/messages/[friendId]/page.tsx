import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MessengerAvatar } from "@/components/MessengerAvatar";
import { MessengerComposer } from "@/components/MessengerComposer";
import { getConversation, getFriendProfileForMessage, getMessageDebugInfo, markConversationRead, resolveMessageFriendId } from "@/lib/social";
import { requireUser } from "@/lib/supabase/server";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function MessageThreadPage({ params }: { params: Promise<{ friendId: string }> }) {
  const user = await requireUser();
  const { friendId } = await params;
  const resolvedFriendId = await resolveMessageFriendId(user.id, friendId).catch(() => friendId);
  const [friend, messages] = await Promise.all([
    getFriendProfileForMessage(user.id, resolvedFriendId).catch(() => null),
    getConversation(user.id, resolvedFriendId).catch(() => []),
  ]);
  if (!friend) {
    const debug = await getMessageDebugInfo(user.id, friendId, resolvedFriendId).catch((error) => ({
      userId: user.id,
      routeId: friendId,
      resolvedFriendId,
      routeProfileExists: false,
      resolvedProfileExists: false,
      directFriendshipCount: 0,
      reverseFriendshipCount: 0,
      acceptedRequestCount: 0,
      directMessagesReadable: false,
      directMessagesCount: 0,
      errors: [error instanceof Error ? error.message : "Debug lookup failed"],
    }));
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="rounded-[2rem] border border-[#ff3b5c]/25 bg-[#0b0f1a]/90 p-5 shadow-2xl shadow-black/40 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff3b5c]">Chat Debug</p>
          <h1 className="mt-3 text-3xl font-black">Conversation could not open</h1>
          <p className="mt-2 text-zinc-400">
            This is the exact state the app sees for this chat route. Send me a screenshot of this box if it still fails.
          </p>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Signed-in user", debug.userId],
              ["Route ID", debug.routeId],
              ["Resolved friend ID", debug.resolvedFriendId],
              ["Route ID is a profile", String(debug.routeProfileExists)],
              ["Resolved profile exists", String(debug.resolvedProfileExists)],
              ["Friendship user -> friend", String(debug.directFriendshipCount)],
              ["Friendship friend -> user", String(debug.reverseFriendshipCount)],
              ["Accepted request rows", String(debug.acceptedRequestCount)],
              ["direct_messages readable", String(debug.directMessagesReadable)],
              ["Existing message count", String(debug.directMessagesCount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</div>
                <div className="mt-1 break-all font-mono text-xs text-zinc-200">{value}</div>
              </div>
            ))}
          </div>

          {debug.errors.length ? (
            <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <div className="text-sm font-bold text-red-200">Database errors</div>
              <ul className="mt-2 space-y-1 text-sm text-red-100">
                {debug.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              No database error was returned. The likely problem is: zero friendship rows and zero accepted friend request rows between these two user IDs.
            </div>
          )}

          <Link href="/messages" className="primary-button mt-6 px-5 py-3">
            Back to messages
          </Link>
        </div>
      </div>
    );
  }
  await markConversationRead(user.id, resolvedFriendId).catch(() => undefined);
  const name = friend.display_name || friend.username || "Movie friend";

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#05050a] shadow-2xl shadow-black/40 md:min-h-[calc(100dvh-2rem)]">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#05050a]/95 px-4 py-4 backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/messages" className="rounded-full p-2 text-[#ff3b5c] transition hover:bg-white/[0.06]" aria-label="Back to messages">
            <ArrowLeft className="h-7 w-7" />
          </Link>
          <MessengerAvatar profile={friend} size="md" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black">{name}</h1>
            <p className="text-sm font-semibold text-[#20df75]">Online</p>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(255,59,92,0.12),transparent_28rem),#05050a] px-4 py-6">
        <div className="mx-auto mb-6 w-fit rounded-full border border-white/[0.06] bg-white/[0.055] px-5 py-2 text-sm text-zinc-400">
          Today
        </div>
        <div className="space-y-5">
          {messages.map((message) => {
            const mine = message.sender_id === user.id;
            return (
              <div key={message.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine ? <MessengerAvatar profile={friend} size="sm" /> : null}
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`rounded-[1.6rem] px-5 py-4 text-lg leading-8 shadow-xl ${
                      mine
                        ? "rounded-br-md bg-gradient-to-br from-[#ff3b5c] to-[#b8153d] text-white shadow-[#ff3b5c]/20"
                        : "rounded-bl-md border border-white/10 bg-white/[0.075] text-white shadow-black/30"
                    }`}
                  >
                    {message.body}
                    <span className={`ml-3 whitespace-nowrap text-xs ${mine ? "text-white/70" : "text-zinc-500"}`}>
                      {formatTime(message.created_at)}
                      {mine ? " ✓✓" : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {!messages.length ? (
            <div className="mx-auto max-w-sm rounded-[2rem] border border-white/[0.06] bg-white/[0.045] p-6 text-center text-zinc-400">
              Start the conversation. Ask what they want to watch tonight.
            </div>
          ) : null}
        </div>
      </main>

      <MessengerComposer friendId={resolvedFriendId} />
    </div>
  );
}
