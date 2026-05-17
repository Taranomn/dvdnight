import "server-only";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  discoverMovies,
  getFullMovieData,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
  searchMovies,
  searchPeople,
} from "@/lib/tmdb";
import type { DisplayMovie, FullMovieData, StoredMovie } from "@/types/movie";

export {
  discoverMovies,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
  searchMovies,
  searchPeople,
  getFullMovieData,
};

export function toMovieUpsert(movie: FullMovieData) {
  return {
    tmdb_id: movie.tmdb_id,
    imdb_id: movie.imdb_id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date || null,
    release_year: movie.release_year,
    runtime: movie.runtime,
    budget: movie.budget,
    revenue: movie.revenue,
    status: movie.status,
    genres: movie.genres,
    genre_ids: movie.genre_ids,
    director_ids: movie.director_ids,
    director_names: movie.director_names,
    writer_ids: movie.writer_ids,
    writer_names: movie.writer_names,
    cast_ids: movie.cast_ids,
    cast_names: movie.cast_names,
    keyword_ids: movie.keyword_ids,
    keyword_names: movie.keyword_names,
    original_language: movie.original_language,
    tmdb_rating: movie.tmdb_rating,
    tmdb_vote_count: movie.tmdb_vote_count,
    imdb_rating: movie.imdb_rating,
    rotten_tomatoes_rating: movie.rotten_tomatoes_rating,
    popularity: movie.popularity,
    adult: movie.adult,
    trailer_key: movie.trailer_key,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertMovieByTmdbId(tmdbId: number) {
  const admin = createAdminClient();
  const fullMovie = await getFullMovieData(tmdbId);
  const { data, error } = await admin
    .from("movies")
    .upsert(toMovieUpsert(fullMovie), { onConflict: "tmdb_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as StoredMovie;
}

export async function getStoredMovieByTmdbId(tmdbId: number) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from("movies").select("*").eq("tmdb_id", tmdbId).maybeSingle();
  return data as StoredMovie | null;
}

export async function getImdbRatedMovies(page = 1) {
  const baseMovies = await getTopRatedMovies(page);
  const enriched = await enrichMoviesWithRatings(baseMovies, 20);

  return enriched
    .sort((a, b) => {
      const ar = "imdb_rating" in a ? (a.imdb_rating ?? 0) : 0;
      const br = "imdb_rating" in b ? (b.imdb_rating ?? 0) : 0;
      return br - ar;
    });
}

export async function enrichMoviesWithRatings<T extends DisplayMovie>(movies: T[], limit = 18) {
  const selected = movies.slice(0, limit);
  const enriched = await Promise.all(
    selected.map(async (movie) => {
      const alreadyEnriched = "imdb_rating" in movie || "rotten_tomatoes_rating" in movie;
      if (alreadyEnriched) return movie;
      const tmdbId = Number("tmdb_id" in movie ? movie.tmdb_id : movie.id);
      if (!Number.isFinite(tmdbId)) return movie;
      try {
        return await getFullMovieData(tmdbId);
      } catch {
        return movie;
      }
    }),
  );

  return [...enriched, ...movies.slice(limit)] as Array<T | FullMovieData>;
}
