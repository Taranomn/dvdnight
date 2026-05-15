import type { DisplayMovie } from "@/types/movie";
import { MovieGrid } from "@/components/MovieGrid";

export function SimilarMoviesPanel({ movies }: { movies: DisplayMovie[] }) {
  return (
    <section className="glass rounded-3xl p-5 md:p-7">
      <h2 className="text-2xl font-bold">Similar Movies</h2>
      <p className="mt-2 text-sm text-zinc-500">Picked from recommendations, shared cast, directors, keywords, and audience overlap.</p>
      <div className="mt-6">
        {movies.length ? (
          <MovieGrid movies={movies.slice(0, 8)} className="gap-y-14 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" />
        ) : (
          <p className="text-zinc-400">No similar movies found.</p>
        )}
      </div>
    </section>
  );
}
