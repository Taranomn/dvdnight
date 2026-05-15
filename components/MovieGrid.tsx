import type { DisplayMovie } from "@/types/movie";
import { MovieCard } from "@/components/MovieCard";

type MovieGridProps = {
  movies: DisplayMovie[];
  showWatchlistButton?: boolean;
  actionVariant?: "watchlist" | "compact" | "none";
};

export function MovieGrid({ movies, showWatchlistButton = true, actionVariant = "compact" }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard
          key={"tmdb_id" in movie ? movie.tmdb_id : movie.id}
          movie={movie}
          showWatchlistButton={showWatchlistButton}
          actionVariant={actionVariant}
        />
      ))}
    </div>
  );
}
