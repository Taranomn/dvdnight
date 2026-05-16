"use client";

import Link from "next/link";
import { Check, Copy, Send, Share2, UserRound, X } from "lucide-react";
import { useState } from "react";
import { shareMovieToFriendAction } from "@/lib/actions";
import type { Friendship } from "@/types/friend";

export function ShareMovieButton({
  friends,
  movieTitle,
  signedIn,
  tmdbId,
}: {
  friends: Friendship[];
  movieTitle: string;
  signedIn: boolean;
  tmdbId: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="secondary-button px-4 py-3 text-sm">
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="max-h-[min(34rem,calc(100dvh-2rem))] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b0f1a] p-4 shadow-2xl shadow-black/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Share Movie</h2>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{movieTitle}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white" aria-label="Close share modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-bold transition hover:border-[#ff3b5c]/45 hover:bg-[#ff3b5c]/10"
            >
              {copied ? <Check className="h-4 w-4 text-[#00c896]" /> : <Copy className="h-4 w-4 text-[#ff3b5c]" />}
              {copied ? "Copied" : "Copy Link"}
            </button>

            {!signedIn ? (
              <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-zinc-300">
                Sign in to send this movie to friends.
                <Link href="/login" className="ml-2 font-semibold text-[#ff3b5c]">
                  Log in
                </Link>
              </div>
            ) : null}

            {signedIn && !friends.length ? (
              <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-zinc-300">
                Add friends first to send movies in chat.
                <Link href="/friends" className="ml-2 font-semibold text-[#ff3b5c]">
                  Find friends
                </Link>
              </div>
            ) : null}

            {signedIn && friends.length ? (
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {friends.map((friendship) => {
                  const friend = friendship.friend;
                  if (!friend?.id) return null;
                  const name = friend.display_name || friend.username || "Movie friend";
                  return (
                    <form key={friendship.id} action={shareMovieToFriendAction.bind(null, friend.id, tmdbId)} onSubmit={() => setOpen(false)}>
                      <button className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3 text-left transition hover:border-[#ff3b5c]/45 hover:bg-[#ff3b5c]/10">
                        {friend.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={friend.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff]">
                            <UserRound className="h-4 w-4" />
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
          </div>
        </div>
      ) : null}
    </>
  );
}
