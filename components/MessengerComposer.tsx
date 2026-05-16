"use client";

import { Bookmark, Dices, Plus, Send, Shuffle, Smile, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  sendDirectMessageAction,
  sendHighestRatedCommonMovieAction,
  sendMatchInviteAction,
  sendRandomCommonMovieAction,
  sendWatchlistInviteAction,
} from "@/lib/actions";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button h-12 w-12 shrink-0 rounded-2xl p-0" disabled={pending} aria-label="Send message">
      <Send className="h-4 w-4" />
    </button>
  );
}

export function MessengerComposer({ friendId }: { friendId: string }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { label: "Random Pick", icon: Dices, action: sendRandomCommonMovieAction.bind(null, friendId) },
    { label: "Highest Rated", icon: Sparkles, action: sendHighestRatedCommonMovieAction.bind(null, friendId) },
    { label: "Suggest Common", icon: Users, action: sendMatchInviteAction.bind(null, friendId) },
    { label: "Want List Invite", icon: Bookmark, action: sendWatchlistInviteAction.bind(null, friendId) },
  ];

  return (
    <div className="relative border-t border-white/10 bg-[#05050a]/95 px-3 py-3 backdrop-blur-2xl sm:px-4">
      {open ? (
        <div className="absolute bottom-[calc(100%+0.75rem)] left-3 right-3 rounded-[1.5rem] border border-white/10 bg-[#0b0f1a]/95 p-3 shadow-2xl shadow-black/70 backdrop-blur-2xl sm:left-4 sm:right-auto sm:w-[26rem]">
          <div className="grid grid-cols-2 gap-2">
            {actions.map((item) => {
              const Icon = item.icon;
              return (
                <form key={item.label} action={item.action}>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex min-h-20 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-3 text-sm font-semibold text-zinc-200 transition hover:-translate-y-1 hover:border-[#ff3b5c]/50 hover:bg-[#ff3b5c]/10"
                  >
                    <Icon className="h-6 w-6 text-[#ff3b5c]" />
                    {item.label}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      ) : null}
      <form
        action={sendDirectMessageAction.bind(null, friendId)}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="secondary-button h-12 w-12 shrink-0 rounded-full p-0"
          aria-label="More actions"
          aria-expanded={open}
        >
          {open ? <Shuffle className="h-5 w-5 text-[#ff3b5c]" /> : <Plus className="h-5 w-5 text-[#ff3b5c]" />}
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
        <SendButton />
      </form>
    </div>
  );
}
