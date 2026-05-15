import "server-only";

import { discoverMovies, enrichMoviesWithRatings, getPopularMovies, getTopRatedMovies, getTrendingMovies, upsertMovieByTmdbId } from "@/lib/movies";
import { createAdminClient } from "@/lib/supabase/server";
import type { DisplayMovie, StoredMovie } from "@/types/movie";

export type TasteProfile = {
  user_id: string;
  genre_weights: Record<string, number>;
  director_weights: Record<string, number>;
  actor_weights: Record<string, number>;
  writer_weights: Record<string, number>;
  keyword_weights: Record<string, number>;
  language_weights: Record<string, number>;
  decade_weights: Record<string, number>;
  runtime_weights: Record<string, number>;
  rating_preference: number | null;
};

export type Recommendation = {
  movie: DisplayMovie;
  reason: string;
  score: number;
};

const interactionWeights: Record<string, number> = {
  liked: 5,
  onboarding_like: 5,
  watched: 2,
  onboarding_seen: 2,
  watchlist: 3,
  trailer_watched: 2,
  clicked: 1,
  onboarding_not_seen: 0,
  onboarding_skip: 0,
  disliked: -5,
  onboarding_dislike: -5,
  not_interested: -4,
  onboarding_not_interested: -4,
};

function add(weights: Record<string, number>, key: string | number | null | undefined, amount: number) {
  if (key === null || key === undefined || amount === 0) return;
  const value = String(key);
  weights[value] = (weights[value] ?? 0) + amount;
}

function decadeForYear(year?: number | null) {
  if (!year) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

function runtimeBucket(runtime?: number | null) {
  if (!runtime) return null;
  if (runtime < 95) return "short";
  if (runtime <= 130) return "medium";
  return "long";
}

function comparableRating(movie: DisplayMovie) {
  const imdb = "imdb_rating" in movie ? movie.imdb_rating : null;
  const tmdb = "tmdb_rating" in movie ? movie.tmdb_rating : "vote_average" in movie ? movie.vote_average : null;
  const rt = "rotten_tomatoes_rating" in movie ? movie.rotten_tomatoes_rating : null;
  if (imdb) return Number(imdb);
  if (tmdb) return Number(tmdb);
  if (rt) return Number(String(rt).replace("%", "")) / 10;
  return 0;
}

export async function getUserInteractions(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_movie_interactions")
    .select("*, movies(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function recordMovieInteraction(userId: string, tmdbId: number, interactionType: string, source = "manual") {
  const movie = await upsertMovieByTmdbId(tmdbId);
  const admin = createAdminClient();
  const { error } = await admin.from("user_movie_interactions").insert({
    user_id: userId,
    movie_id: movie.id,
    interaction_type: interactionType,
    source,
  });
  if (error) throw new Error(error.message);
  await updateUserTasteProfile(userId);
  return movie;
}

export async function buildUserTasteProfile(userId: string): Promise<TasteProfile> {
  const rows = await getUserInteractions(userId);
  const profile: TasteProfile = {
    user_id: userId,
    genre_weights: {},
    director_weights: {},
    actor_weights: {},
    writer_weights: {},
    keyword_weights: {},
    language_weights: {},
    decade_weights: {},
    runtime_weights: {},
    rating_preference: null,
  };
  let ratingTotal = 0;
  let ratingWeight = 0;

  for (const row of rows) {
    const movie = row.movies as StoredMovie | null;
    const weight = interactionWeights[row.interaction_type as string] ?? 0;
    if (!movie || weight === 0) continue;
    for (const genre of movie.genres ?? []) add(profile.genre_weights, genre.name, weight);
    for (const id of movie.director_ids ?? []) add(profile.director_weights, id, weight * 1.5);
    for (const id of movie.cast_ids ?? []) add(profile.actor_weights, id, weight);
    for (const id of movie.writer_ids ?? []) add(profile.writer_weights, id, weight * 1.2);
    for (const id of movie.keyword_ids ?? []) add(profile.keyword_weights, id, weight);
    add(profile.language_weights, movie.original_language, weight);
    add(profile.decade_weights, decadeForYear(movie.release_year), weight);
    add(profile.runtime_weights, runtimeBucket(movie.runtime), weight);
    const rating = comparableRating(movie);
    if (rating && weight > 0) {
      ratingTotal += rating * weight;
      ratingWeight += weight;
    }
  }

  profile.rating_preference = ratingWeight ? Number((ratingTotal / ratingWeight).toFixed(1)) : null;
  return profile;
}

export async function updateUserTasteProfile(userId: string) {
  const profile = await buildUserTasteProfile(userId);
  const admin = createAdminClient();
  const { error } = await admin.from("user_taste_profiles").upsert(
    {
      ...profile,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
  return profile;
}

export async function getRecommendationsForUser(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("user_taste_profiles").select("*").eq("user_id", userId).maybeSingle();
  return (data as TasteProfile | null) ?? updateUserTasteProfile(userId);
}

export function calculateMovieScore(tasteProfile: TasteProfile, candidateMovie: DisplayMovie) {
  let score = 0;
  if ("adult" in candidateMovie && candidateMovie.adult) return -999;
  const genreNames = "genres" in candidateMovie ? candidateMovie.genres?.map((genre) => genre.name) ?? [] : [];
  for (const genre of genreNames) score += (tasteProfile.genre_weights[genre] ?? 0) * 4;
  if ("director_ids" in candidateMovie) for (const id of candidateMovie.director_ids ?? []) score += (tasteProfile.director_weights[String(id)] ?? 0) * 10;
  if ("writer_ids" in candidateMovie) for (const id of candidateMovie.writer_ids ?? []) score += (tasteProfile.writer_weights[String(id)] ?? 0) * 6;
  if ("cast_ids" in candidateMovie) for (const id of candidateMovie.cast_ids ?? []) score += (tasteProfile.actor_weights[String(id)] ?? 0) * 5;
  if ("keyword_ids" in candidateMovie) for (const id of candidateMovie.keyword_ids ?? []) score += (tasteProfile.keyword_weights[String(id)] ?? 0) * 3;
  if ("original_language" in candidateMovie && candidateMovie.original_language) score += (tasteProfile.language_weights[candidateMovie.original_language] ?? 0) * 2;
  if ("release_year" in candidateMovie) score += tasteProfile.decade_weights[decadeForYear(candidateMovie.release_year) ?? ""] ? 2 : 0;
  score += Math.min(comparableRating(candidateMovie), 10);
  const popularity = "popularity" in candidateMovie ? candidateMovie.popularity ?? 0 : 0;
  const voteCount = "tmdb_vote_count" in candidateMovie ? candidateMovie.tmdb_vote_count ?? 0 : "vote_count" in candidateMovie ? Number(candidateMovie.vote_count ?? 0) : 0;
  score += Math.min(popularity / 30, 5);
  score += Math.min(voteCount / 1000, 5);
  if (voteCount && voteCount < 80) score -= 5;
  return score;
}

export function explainRecommendation(tasteProfile: TasteProfile, movie: DisplayMovie) {
  const genre = "genres" in movie ? movie.genres?.find((item) => (tasteProfile.genre_weights[item.name] ?? 0) > 0)?.name : null;
  if (genre) return `Because you like ${genre} movies`;
  if ("director_names" in movie && movie.director_names?.[0]) return `Because this matches directors in your taste profile`;
  if (comparableRating(movie) >= 8) return "Because you seem to enjoy highly rated movies";
  return "Because it matches your movie activity";
}

export async function generateRecommendationsForUser(userId: string) {
  const profile = await getRecommendationsForUser(userId);
  const admin = createAdminClient();
  const { data: excluded } = await admin
    .from("user_movie_interactions")
    .select("interaction_type, movies(tmdb_id)")
    .eq("user_id", userId)
    .in("interaction_type", ["disliked", "onboarding_dislike", "not_interested", "onboarding_not_interested", "watched", "watchlist"]);
  const excludedIds = new Set((excluded ?? []).map((row) => (row.movies as { tmdb_id?: number } | null)?.tmdb_id).filter(Boolean));
  const genreNames = Object.entries(profile.genre_weights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  const pools = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
    getTrendingMovies(),
    discoverMovies({ sort_by: "vote_average.desc", "vote_count.gte": 150, "vote_count.lte": 2500 }),
  ]);
  const enriched = await enrichMoviesWithRatings(
    Array.from(new Map(pools.flat().map((movie) => [movie.id, movie])).values()).filter((movie) => !excludedIds.has(movie.id)),
    30,
  );
  return enriched
    .map((movie) => ({ movie, score: calculateMovieScore(profile, movie), reason: genreNames.length ? `Because you like ${genreNames.join(", ")}` : explainRecommendation(profile, movie) }))
    .filter((item) => item.score > -100)
    .sort((a, b) => b.score - a.score);
}

export async function generateExploreSections(userId: string) {
  const recommendations = await generateRecommendationsForUser(userId);
  return [
    { title: "Recommended For You", movies: recommendations.slice(0, 18) },
    { title: "Highly Rated Picks", movies: recommendations.filter((item) => comparableRating(item.movie) >= 8).slice(0, 12) },
    { title: "Hidden Gems For You", movies: recommendations.filter((item) => ("tmdb_vote_count" in item.movie ? (item.movie.tmdb_vote_count ?? 0) < 2500 : true)).slice(0, 12) },
  ];
}
