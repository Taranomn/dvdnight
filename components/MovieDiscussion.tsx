import Link from "next/link";
import { MessageCircle, Star } from "lucide-react";
import { addMovieCommentAction } from "@/lib/actions";
import type { MovieComment } from "@/lib/social";

export function MovieDiscussion({ tmdbId, comments, signedIn }: { tmdbId: number; comments: MovieComment[]; signedIn: boolean }) {
  return (
    <section className="glass rounded-3xl p-5 md:p-7">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-[#ff3b5c]" />
        <h2 className="text-2xl font-bold">Reviews & Conversation</h2>
      </div>
      <p className="mt-2 text-sm text-zinc-500">Share a quick take, leave a rating, or start the movie-night debate.</p>

      {signedIn ? (
        <form action={addMovieCommentAction.bind(null, tmdbId)} className="mt-5 grid gap-3">
          <textarea
            name="body"
            required
            rows={4}
            maxLength={1200}
            placeholder="What did you think?"
            className="min-h-28 rounded-3xl border border-white/10 bg-white/[0.055] p-4 text-sm outline-none transition focus:border-[#ff3b5c]/60"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select name="rating" defaultValue="" className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4 text-sm">
              <option value="">No rating</option>
              {Array.from({ length: 11 }, (_, index) => (
                <option key={index} value={index}>{index}/10</option>
              ))}
            </select>
            <button className="primary-button h-12 px-5">Post</button>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm text-zinc-300">
          <Link href={`/login?redirectTo=/movies/${tmdbId}`} className="font-bold text-[#ff3b5c]">Log in</Link> to join the conversation.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold">{comment.profiles?.display_name || comment.profiles?.username || "Movie fan"}</div>
                <div className="text-xs text-zinc-500">{new Date(comment.created_at).toLocaleDateString()}</div>
              </div>
              {typeof comment.rating === "number" ? (
                <div className="inline-flex items-center gap-1 rounded-full bg-[#f5c518]/15 px-3 py-1 text-sm font-bold text-[#f5c518]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {comment.rating}/10
                </div>
              ) : null}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{comment.body}</p>
          </article>
        ))}
        {!comments.length ? <p className="text-sm text-zinc-500">No comments yet. Be the first to start the conversation.</p> : null}
      </div>
    </section>
  );
}
