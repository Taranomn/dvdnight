import { CommonMovieCard } from "@/components/CommonMovieCard";
import { EmptyState } from "@/components/EmptyState";
import { MatchControls } from "@/components/MatchControls";
import { getCommonWatchlist, getProfileById } from "@/lib/match";
import { requireUser } from "@/lib/supabase/server";

export default async function FriendMatchPage({ params }: { params: Promise<{ friendId: string }> }) {
  const user = await requireUser();
  const { friendId } = await params;
  const [friend, movies] = await Promise.all([getProfileById(friendId), getCommonWatchlist(user.id, friendId)]);
  const friendName = friend?.display_name || friend?.username || "your friend";

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Match with {friendName}</h1>
      <p className="mt-2 text-zinc-400">
        You and {friendName} have {movies.length} movies in common.
      </p>
      <div className="mt-6">
        <MatchControls movies={movies} />
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {movies.length ? (
          movies.map((movie) => <CommonMovieCard key={movie.id} movie={movie} />)
        ) : (
          <EmptyState title="No common movies yet" message="Add more movies to Want to Watch to find a match." href="/search" action="Add movies" />
        )}
      </div>
    </div>
  );
}
