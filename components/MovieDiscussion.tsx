import Link from "next/link";
import { MessageCircle, Reply, Star } from "lucide-react";
import { addMovieCommentAction } from "@/lib/actions";
import type { MovieComment } from "@/lib/social";

export function MovieDiscussion({ tmdbId, comments, signedIn }: { tmdbId: number; comments: MovieComment[]; signedIn: boolean }) {
  const topLevel = comments.filter((comment) => !comment.parent_id);
  const repliesByParent = comments.reduce<Record<string, MovieComment[]>>((groups, comment) => {
    if (comment.parent_id) groups[comment.parent_id] = [...(groups[comment.parent_id] ?? []), comment];
    return groups;
  }, {});

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
        {topLevel.map((comment) => (
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
            {signedIn ? (
              <details className="mt-3">
                <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#ff3b5c]">
                  <Reply className="h-4 w-4" />
                  Reply
                </summary>
                <form action={addMovieCommentAction.bind(null, tmdbId)} className="mt-3 flex gap-2">
                  <input type="hidden" name="parentId" value={comment.id} />
                  <input
                    name="body"
                    required
                    maxLength={800}
                    placeholder={`Reply to ${comment.profiles?.display_name || comment.profiles?.username || "this review"}...`}
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm outline-none focus:border-[#ff3b5c]/60"
                  />
                  <button className="secondary-button px-4 py-2 text-sm">Send</button>
                </form>
              </details>
            ) : null}
            {repliesByParent[comment.id]?.length ? (
              <div className="mt-4 space-y-2 border-l border-white/10 pl-3">
                {repliesByParent[comment.id].map((reply) => (
                  <div key={reply.id} className="rounded-2xl bg-white/[0.035] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold">{reply.profiles?.display_name || reply.profiles?.username || "Movie fan"}</div>
                      <div className="text-xs text-zinc-500">{new Date(reply.created_at).toLocaleDateString()}</div>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{reply.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {!topLevel.length ? <p className="text-sm text-zinc-500">No comments yet. Be the first to start the conversation.</p> : null}
      </div>
    </section>
  );
}
