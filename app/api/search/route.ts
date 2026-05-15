import { NextResponse } from "next/server";
import { discoverMovies, enrichMoviesWithRatings, getFullMovieData, searchMovies, searchPeople } from "@/lib/movies";
import { getMovieDetails } from "@/lib/tmdb";
import type { DisplayMovie } from "@/types/movie";

function rottenToNumber(value?: string | null) {
  if (!value) return 0;
  const parsed = Number(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed / 10 : 0;
}

function bestSearchRating(movie: DisplayMovie) {
  if ("imdb_rating" in movie && movie.imdb_rating) return Number(movie.imdb_rating);
  if ("rotten_tomatoes_rating" in movie) return rottenToNumber(movie.rotten_tomatoes_rating);
  return 0;
}

function sortByBestSearchRating<T extends DisplayMovie>(movies: T[]) {
  return [...movies].sort((a, b) => bestSearchRating(b) - bestSearchRating(a));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const genre = searchParams.get("genre") || "";
  const year = searchParams.get("year") || "";
  const rating = searchParams.get("rating") || "";
  const runtime = searchParams.get("runtime") || "";
  const sort = searchParams.get("sort") || "popularity.desc";
  const hasFilters = Boolean(genre || year || rating || runtime);
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2 && !hasFilters) {
    const results = sortByBestSearchRating(await enrichMoviesWithRatings(await discoverMovies({ sort_by: "vote_count.desc", "vote_count.gte": 1000 }), 18));
    return NextResponse.json({ results, people: [] });
  }

  try {
    const peoplePromise = trimmedQuery.length >= 2 ? searchPeople(trimmedQuery).catch(() => []) : Promise.resolve([]);
    let results = trimmedQuery
      ? await searchMovies(trimmedQuery)
      : await discoverMovies({
          with_genres: genre || undefined,
          "primary_release_year": year || undefined,
          "vote_average.gte": rating || undefined,
          "vote_count.gte": rating ? 200 : undefined,
          "with_runtime.lte": runtime || undefined,
          sort_by: sort,
        });
    const people = await peoplePromise;

    if (trimmedQuery && hasFilters) {
      results = results.filter((movie) => {
        const genreOk = genre ? movie.genre_ids?.includes(Number(genre)) : true;
        const yearOk = year ? movie.release_date?.startsWith(year) : true;
        const ratingOk = rating ? (movie.vote_average ?? 0) >= Number(rating) : true;
        return genreOk && yearOk && ratingOk;
      });

      if (runtime) {
        const withRuntime = await Promise.all(
          results.slice(0, 24).map(async (movie) => {
            try {
              const details = await getMovieDetails(movie.id);
              return (details.runtime ?? 9999) <= Number(runtime) ? movie : null;
            } catch {
              return null;
            }
          }),
        );
        results = withRuntime.filter((movie): movie is NonNullable<typeof movie> => Boolean(movie));
      }

      if (sort === "vote_average.desc") results.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
      if (sort === "primary_release_date.desc") results.sort((a, b) => String(b.release_date ?? "").localeCompare(String(a.release_date ?? "")));
      if (sort === "popularity.desc") results.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    }

    if (sort === "imdb_rating.desc") {
      const enriched = await Promise.all(
        results.slice(0, 18).map(async (movie) => {
          try {
            return await getFullMovieData(movie.id);
          } catch {
            return movie;
          }
        }),
      );
      return NextResponse.json({ results: sortByBestSearchRating(enriched), people });
    }

    return NextResponse.json({ results: await enrichMoviesWithRatings(results.slice(0, 18), 18), people });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed.", results: [], people: [] },
      { status: 500 },
    );
  }
}
