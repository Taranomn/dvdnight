import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MessengerAvatar } from "@/components/MessengerAvatar";
import { MessengerComposer } from "@/components/MessengerComposer";
import { getConversation, getFriendProfileForMessage, markConversationRead } from "@/lib/social";
import { requireUser } from "@/lib/supabase/server";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function MessageThreadPage({ params }: { params: Promise<{ friendId: string }> }) {
  const user = await requireUser();
  const { friendId } = await params;
  const [friend, messages] = await Promise.all([
    getFriendProfileForMessage(user.id, friendId),
    getConversation(user.id, friendId).catch(() => []),
  ]);
  if (!friend) notFound();
  await markConversationRead(user.id, friendId).catch(() => undefined);
  const name = friend.display_name || friend.username || "Movie friend";

  return (
    <div className="fixed inset-x-0 bottom-[5.35rem] top-0 z-20 flex flex-col overflow-hidden border-y border-white/[0.06] bg-[#05050a] shadow-2xl shadow-black/40 md:bottom-0 md:left-64 md:right-0 md:border-y-0 md:border-l">
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

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(255,59,92,0.12),transparent_28rem),#05050a] px-4 py-6">
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

      <MessengerComposer friendId={friendId} />
    </div>
  );
}
