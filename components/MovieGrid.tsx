import type { DisplayMovie } from "@/types/movie";
import { MovieCard } from "@/components/MovieCard";
import { cn } from "@/lib/utils";

type MovieGridProps = {
  movies: DisplayMovie[];
  showWatchlistButton?: boolean;
  actionVariant?: "watchlist" | "compact" | "none";
  className?: string;
};

export function MovieGrid({ movies, showWatchlistButton = true, actionVariant = "compact", className }: MovieGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6", className)}>
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
