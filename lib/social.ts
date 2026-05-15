import "server-only";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { upsertMovieByTmdbId } from "@/lib/movies";
import type { Profile } from "@/types/user";

export type MovieComment = {
  id: string;
  movie_id: string;
  user_id: string;
  body: string;
  rating: number | null;
  parent_id: string | null;
  created_at: string;
  profiles?: Profile;
};

export type DirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
};

export async function getMovieComments(tmdbId: number) {
  const admin = createAdminClient();
  const { data: movie } = await admin.from("movies").select("id").eq("tmdb_id", tmdbId).maybeSingle();
  if (!movie) return [];

  const { data, error } = await admin
    .from("movie_comments")
    .select("*, profiles(*)")
    .eq("movie_id", movie.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MovieComment[];
}

export async function createMovieComment(userId: string, tmdbId: number, body: string, rating?: number | null) {
  const text = body.trim();
  if (!text) return;
  const movie = await upsertMovieByTmdbId(tmdbId);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase!.from("movie_comments").insert({
    user_id: userId,
    movie_id: movie.id,
    body: text.slice(0, 1200),
    rating: typeof rating === "number" && Number.isFinite(rating) ? rating : null,
  });
  if (error) throw new Error(error.message);
}

export async function getConversation(userId: string, friendId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*, sender:profiles!direct_messages_sender_id_fkey(*), receiver:profiles!direct_messages_receiver_id_fkey(*)")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as DirectMessage[];
}

export async function sendDirectMessage(senderId: string, receiverId: string, body: string) {
  const text = body.trim();
  if (!text) return;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase!.from("direct_messages").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    body: text.slice(0, 1000),
  });
  if (error) throw new Error(error.message);
}
