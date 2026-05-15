"use client";

import { Film, Mic, Plus, Send, Smile } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { sendDirectMessageAction } from "@/lib/actions";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button h-12 w-12 shrink-0 rounded-2xl p-0" disabled={pending} aria-label="Send message">
      <Send className="h-4 w-4" />
    </button>
  );
}

export function MessengerComposer({ friendId }: { friendId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="border-t border-white/10 bg-[#05050a]/95 px-4 py-3 backdrop-blur-2xl">
      <form
        ref={formRef}
        action={async (formData) => {
          await sendDirectMessageAction(friendId, formData);
          formRef.current?.reset();
        }}
        className="flex items-center gap-2"
      >
        <button type="button" className="secondary-button h-12 w-12 shrink-0 rounded-full p-0" aria-label="More actions">
          <Plus className="h-5 w-5 text-[#ff3b5c]" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.075] px-4">
          <input
            name="body"
            required
            maxLength={1000}
            placeholder="Message..."
            className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-500"
          />
          <Smile className="h-5 w-5 shrink-0 text-zinc-400" />
        </div>
        <button type="button" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#ff3b5c] sm:flex" aria-label="Share movie">
          <Film className="h-5 w-5" />
        </button>
        <button type="button" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#ff3b5c] sm:flex" aria-label="Voice message">
          <Mic className="h-5 w-5" />
        </button>
        <SendButton />
      </form>
      <div className="mt-3 grid grid-cols-4 gap-2 rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-3 text-center text-xs text-zinc-400">
        <span>Share Movie</span>
        <span>Suggest Common</span>
        <span>Random Pick</span>
        <span>Watchlist Invite</span>
      </div>
    </div>
  );
}
