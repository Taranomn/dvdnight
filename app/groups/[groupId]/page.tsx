import { CommonMovieCard } from "@/components/CommonMovieCard";
import { EmptyState } from "@/components/EmptyState";
import { MatchControls } from "@/components/MatchControls";
import { addGroupMemberAction } from "@/lib/actions";
import { getFriends } from "@/lib/friends";
import { getGroupCommonWatchlist } from "@/lib/match";
import { requireUser } from "@/lib/supabase/server";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await requireUser();
  const { groupId } = await params;
  const [{ group, members, movies }, friends] = await Promise.all([getGroupCommonWatchlist(groupId), getFriends(user.id)]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">{group?.name || "Group Match"}</h1>
      <p className="mt-2 text-zinc-400">
        {members.length} members have {movies.length} movies in common.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {members.map((member) => {
          const profile = member.profile as { display_name?: string | null; username?: string | null } | null;
          return (
            <span key={member.user_id as string} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-zinc-300">
              {profile?.display_name || profile?.username || "Member"}
            </span>
          );
        })}
      </div>
      <form action={addGroupMemberAction.bind(null, groupId)} className="glass mt-6 grid gap-3 rounded-3xl p-4 sm:grid-cols-[1fr_auto]">
        <select name="friendId" className="h-12 rounded-2xl border border-white/10 bg-[#0b0f1a] px-4">
          <option value="">Add a friend to group</option>
          {friends.map((friendship) => (
            <option key={friendship.friend.id} value={friendship.friend.id}>
              {friendship.friend.display_name || friendship.friend.username}
            </option>
          ))}
        </select>
        <button className="primary-button px-5 py-3">Add Member</button>
      </form>
      <div className="mt-6">
        <MatchControls movies={movies} />
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {movies.length ? (
          movies.map((movie) => <CommonMovieCard key={movie.id} movie={movie} />)
        ) : (
          <EmptyState title="No group matches yet" message="Everyone needs at least one shared movie in Want to Watch." />
        )}
      </div>
    </div>
  );
}
