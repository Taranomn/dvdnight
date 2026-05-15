import { LiveMovieSearch } from "@/components/LiveMovieSearch";
import { enrichMoviesWithRatings, getImdbRatedMovies, searchMovies } from "@/lib/movies";
import { getGenres } from "@/lib/tmdb";
import type { DisplayMovie } from "@/types/movie";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; genre?: string }> }) {
  const { q = "", genre = "" } = await searchParams;
  let movies: DisplayMovie[] = [];
  const genres = await getGenres().catch(() => []);
  try {
    movies = q ? await enrichMoviesWithRatings(await searchMovies(q), 18) : await getImdbRatedMovies();
  } catch (caught) {
    console.error(caught);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Search</h1>
      <p className="mt-2 text-zinc-400">Results update as you type. No enter key required.</p>
      <div className="mt-6">
        <LiveMovieSearch initialQuery={q} initialResults={movies} genres={genres} initialGenre={genre} />
      </div>
    </div>
  );
}
