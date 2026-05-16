import "server-only";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { upsertMovieByTmdbId } from "@/lib/movies";
import { updateUserTasteProfile } from "@/lib/recommendations";
import type { WatchlistItem } from "@/types/movie";

export type WatchlistStatus = "want_to_watch" | "watched" | "watched_watchlist";

export function isWatchedStatus(status?: string | null) {
  return status === "watched" || status === "watched_watchlist";
}

export function isWatchlistStatus(status?: string | null) {
  return status === "want_to_watch" || status === "watched_watchlist";
}

export async function logActivity(userId: string, type: string, movieId?: string | null, metadata?: Record<string, unknown>) {
  const admin = createAdminClient();
  await admin.from("user_activity").insert({
    user_id: userId,
    movie_id: movieId ?? null,
    activity_type: type,
    metadata: metadata ?? {},
  });
}

export async function logInteraction(userId: string, movieId: string, interactionType: string, source = "manual") {
  const admin = createAdminClient();
  await admin.from("user_movie_interactions").insert({
    user_id: userId,
    movie_id: movieId,
    interaction_type: interactionType,
    source,
  });
  await updateUserTasteProfile(userId).catch(() => undefined);
}

export async function addToWatchlist(userId: string, tmdbId: number) {
  const movie = await upsertMovieByTmdbId(tmdbId);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("watchlist")
    .select("id,status")
    .eq("user_id", userId)
    .eq("movie_id", movie.id)
    .maybeSingle();

  const nextStatus: WatchlistStatus = existing?.status === "watched" ? "watched_watchlist" : "want_to_watch";
  const { error } = existing
    ? await admin.from("watchlist").update({ status: existing.status === "watched_watchlist" ? "watched_watchlist" : nextStatus }).eq("id", existing.id)
    : await admin.from("watchlist").insert({
      user_id: userId,
      movie_id: movie.id,
      status: nextStatus,
    });

  if (error) throw new Error(error.message);
  await logActivity(userId, "watchlist_added", movie.id, { tmdb_id: tmdbId });
  await logInteraction(userId, movie.id, "watchlist", "watchlist");
  return movie;
}

export async function removeFromWatchlist(userId: string, movieId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: existing } = await supabase
    .from("watchlist")
    .select("id,status")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .maybeSingle();
  const { error } = existing?.status === "watched_watchlist"
    ? await supabase.from("watchlist").update({ status: "watched" }).eq("id", existing.id)
    : await supabase.from("watchlist").delete().eq("user_id", userId).eq("movie_id", movieId);
  if (error) throw new Error(error.message);
  await logActivity(userId, "watchlist_removed", movieId);
}

export async function setWatchlistStatus(userId: string, movieId: string, status: WatchlistStatus) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("watchlist").update({ status }).eq("user_id", userId).eq("movie_id", movieId);
  if (error) throw new Error(error.message);
  await logActivity(userId, isWatchedStatus(status) ? "movie_watched" : "watchlist_added", movieId);
  if (isWatchedStatus(status)) await logInteraction(userId, movieId, "watched", "manual");
}

export async function markWatchedByTmdbId(userId: string, tmdbId: number) {
  const movie = await upsertMovieByTmdbId(tmdbId);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("watchlist")
    .select("id,status")
    .eq("user_id", userId)
    .eq("movie_id", movie.id)
    .maybeSingle();

  const nextStatus: WatchlistStatus = existing?.status === "want_to_watch" || existing?.status === "watched_watchlist" ? "watched_watchlist" : "watched";
  const { error } = existing
    ? await admin.from("watchlist").update({ status: nextStatus }).eq("id", existing.id)
    : await admin.from("watchlist").insert({ user_id: userId, movie_id: movie.id, status: nextStatus });
  if (error) throw new Error(error.message);
  await logActivity(userId, "movie_watched", movie.id, { tmdb_id: tmdbId });
  await logInteraction(userId, movie.id, "watched", "manual");
  return movie;
}

export async function toggleMovieLike(userId: string, tmdbId: number) {
  const movie = await upsertMovieByTmdbId(tmdbId);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("movie_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("movie_id", movie.id)
    .maybeSingle();

  if (existing) {
    const { error } = await admin.from("movie_likes").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
    await logActivity(userId, "movie_unliked", movie.id);
    return { liked: false, movie };
  }

  const { error } = await admin.from("movie_likes").insert({ user_id: userId, movie_id: movie.id });
  if (error) throw new Error(error.message);
  await logActivity(userId, "movie_liked", movie.id);
  await logInteraction(userId, movie.id, "liked", "manual");
  return { liked: true, movie };
}

export async function saveMovieInteractionByTmdbId(userId: string, tmdbId: number, interactionType: string, source = "manual") {
  const movie = await upsertMovieByTmdbId(tmdbId);
  await logInteraction(userId, movie.id, interactionType, source);
  return movie;
}

export async function isMovieLiked(userId: string | null | undefined, tmdbId: number) {
  if (!userId) return false;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("movie_likes")
    .select("id, movies!inner(tmdb_id)")
    .eq("user_id", userId)
    .eq("movies.tmdb_id", tmdbId)
    .maybeSingle();
  return Boolean(data);
}

export async function getLikedMovies(userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("movie_likes")
    .select("*, movies(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.movies);
}

export async function getUserWatchlist(userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("watchlist")
    .select("*, movies(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as WatchlistItem[];
}

export async function isMovieInWatchlist(userId: string | null | undefined, tmdbId: number) {
  if (!userId) return null;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("watchlist")
    .select("id, movie_id, status, movies!inner(tmdb_id)")
    .eq("user_id", userId)
    .eq("movies.tmdb_id", tmdbId)
    .maybeSingle();
  return data ? { id: data.id as string, movie_id: data.movie_id as string, status: data.status as string } : null;
}
