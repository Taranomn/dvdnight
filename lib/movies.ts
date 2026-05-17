import "server-only";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  discoverMovies,
  getFullMovieData as fetchFullMovieData,
  getMovieImages,
  getMovieVideos,
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
};

function hasStoredRatings(movie?: Pick<StoredMovie, "imdb_rating" | "rotten_tomatoes_rating"> | null) {
  return Boolean(movie?.imdb_rating || movie?.rotten_tomatoes_rating);
}

function mergeWithStoredRatings(movie: FullMovieData, stored?: StoredMovie | null) {
  if (!stored) return movie;
  return {
    ...movie,
    imdb_id: movie.imdb_id ?? stored.imdb_id,
    imdb_rating: movie.imdb_rating ?? stored.imdb_rating,
    rotten_tomatoes_rating: movie.rotten_tomatoes_rating ?? stored.rotten_tomatoes_rating,
  };
}

function storedMovieIsUsable(movie?: StoredMovie | null) {
  return Boolean(movie?.title && movie.movie_cast && movie.movie_crew);
}

async function storedMovieToFullMovie(movie: StoredMovie): Promise<FullMovieData> {
  const [videos, images] = await Promise.all([
    getMovieVideos(movie.tmdb_id).catch(() => []),
    getMovieImages(movie.tmdb_id).catch(() => ({ backdrops: [], posters: [], logos: [] })),
  ]);

  return {
    tmdb_id: movie.tmdb_id,
    imdb_id: movie.imdb_id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    release_year: movie.release_year,
    runtime: movie.runtime,
    budget: movie.budget ?? null,
    revenue: movie.revenue ?? null,
    status: movie.status ?? null,
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
    cast: movie.movie_cast ?? [],
    crew: movie.movie_crew ?? [],
    videos,
    images,
    director: movie.director_names?.[0] ?? null,
  };
}

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
    movie_cast: movie.cast,
    movie_crew: movie.crew,
    updated_at: new Date().toISOString(),
  };
}

export async function getFullMovieData(tmdbId: number): Promise<FullMovieData> {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("movies").select("*").eq("tmdb_id", tmdbId).maybeSingle();
  const storedMovie = existing as StoredMovie | null;

  if (storedMovieIsUsable(storedMovie)) {
    return storedMovieToFullMovie(storedMovie as StoredMovie);
  }

  const fullMovie = mergeWithStoredRatings(await fetchFullMovieData(tmdbId), storedMovie);
  const { error } = await admin.from("movies").upsert(toMovieUpsert(fullMovie), { onConflict: "tmdb_id" });
  if (error) throw new Error(error.message);

  return fullMovie;
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

export async function getStoredMoviesByTmdbIds(tmdbIds: number[]) {
  const uniqueIds = Array.from(new Set(tmdbIds.filter(Number.isFinite)));
  if (!uniqueIds.length) return new Map<number, StoredMovie>();

  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Map<number, StoredMovie>();
  const { data } = await supabase.from("movies").select("*").in("tmdb_id", uniqueIds);
  return new Map((data ?? []).map((movie) => [movie.tmdb_id as number, movie as StoredMovie]));
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
  const selectedTmdbIds = selected
    .map((movie) => Number("tmdb_id" in movie ? movie.tmdb_id : movie.id))
    .filter(Number.isFinite);
  const storedByTmdbId = await getStoredMoviesByTmdbIds(selectedTmdbIds).catch(() => new Map<number, StoredMovie>());

  const enriched = await Promise.all(
    selected.map(async (movie) => {
      const tmdbId = Number("tmdb_id" in movie ? movie.tmdb_id : movie.id);
      if (!Number.isFinite(tmdbId)) return movie;
      const stored = storedByTmdbId.get(tmdbId);
      if (stored && (hasStoredRatings(stored) || storedMovieIsUsable(stored))) return { ...movie, ...stored };
      if (("imdb_rating" in movie && movie.imdb_rating) || ("rotten_tomatoes_rating" in movie && movie.rotten_tomatoes_rating)) return movie;

      try {
        return await getFullMovieData(tmdbId);
      } catch {
        return stored ? { ...movie, ...stored } : movie;
      }
    }),
  );

  return [...enriched, ...movies.slice(limit)] as Array<T | FullMovieData>;
}
