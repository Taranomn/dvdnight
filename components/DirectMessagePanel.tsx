import { Send } from "lucide-react";
import { sendDirectMessageAction } from "@/lib/actions";
import type { DirectMessage } from "@/lib/social";

export function DirectMessagePanel({
  friendId,
  viewerId,
  messages,
}: {
  friendId: string;
  viewerId: string;
  messages: DirectMessage[];
}) {
  return (
    <section className="glass mt-8 rounded-[2rem] p-5 md:p-6">
      <h2 className="text-2xl font-bold">Messages</h2>
      <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => {
          const mine = message.sender_id === viewerId;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 ${mine ? "bg-[#ff3b5c] text-white" : "bg-white/[0.06] text-zinc-200"}`}>
                {message.body}
                <div className={`mt-1 text-[0.65rem] ${mine ? "text-white/70" : "text-zinc-500"}`}>
                  {new Date(message.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
        {!messages.length ? <p className="text-sm text-zinc-500">No messages yet.</p> : null}
      </div>
      <form action={sendDirectMessageAction.bind(null, friendId)} className="mt-4 flex gap-2">
        <input
          name="body"
          required
          maxLength={1000}
          placeholder="Send a message..."
          className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm outline-none focus:border-[#ff3b5c]/60"
        />
        <button className="primary-button h-12 px-4" aria-label="Send message">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
