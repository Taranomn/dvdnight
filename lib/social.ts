import "server-only";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { upsertMovieByTmdbId } from "@/lib/movies";
import { getFriends } from "@/lib/friends";
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

export type MovieCommunityStats = {
  watchedCount: number;
  averageRating: number | null;
  ratingCount: number;
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

export type MessageThread = {
  friend: Profile;
  lastMessage: DirectMessage | null;
  unreadCount: number;
};

export async function getStoredMovieIdForTmdb(tmdbId: number) {
  const admin = createAdminClient();
  const { data: movie } = await admin.from("movies").select("id").eq("tmdb_id", tmdbId).maybeSingle();
  return (movie?.id as string | undefined) ?? null;
}

export async function getMovieComments(tmdbId: number) {
  const admin = createAdminClient();
  const movieId = await getStoredMovieIdForTmdb(tmdbId);
  if (!movieId) return [];

  const { data, error } = await admin
    .from("movie_comments")
    .select("*, profiles(*)")
    .eq("movie_id", movieId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MovieComment[];
}

export async function getMovieCommunityStats(tmdbId: number): Promise<MovieCommunityStats> {
  const admin = createAdminClient();
  const movieId = await getStoredMovieIdForTmdb(tmdbId);
  if (!movieId) return { watchedCount: 0, averageRating: null, ratingCount: 0 };

  const [{ count: watchedCount }, { data: ratings }] = await Promise.all([
    admin
      .from("watchlist")
      .select("id", { count: "exact", head: true })
      .eq("movie_id", movieId)
      .eq("status", "watched"),
    admin
      .from("movie_comments")
      .select("rating")
      .eq("movie_id", movieId)
      .not("rating", "is", null),
  ]);
  const numericRatings = (ratings ?? [])
    .map((item) => Number(item.rating))
    .filter((rating) => Number.isFinite(rating));
  const averageRating = numericRatings.length
    ? Number((numericRatings.reduce((sum, rating) => sum + rating, 0) / numericRatings.length).toFixed(1))
    : null;

  return {
    watchedCount: watchedCount ?? 0,
    averageRating,
    ratingCount: numericRatings.length,
  };
}

export async function createMovieComment(userId: string, tmdbId: number, body: string, rating?: number | null, parentId?: string | null) {
  const text = body.trim();
  if (!text) return;
  const movie = await upsertMovieByTmdbId(tmdbId);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase!.from("movie_comments").insert({
    user_id: userId,
    movie_id: movie.id,
    body: text.slice(0, 1200),
    rating: typeof rating === "number" && Number.isFinite(rating) ? rating : null,
    parent_id: parentId || null,
  });
  if (error) throw new Error(error.message);
}

export async function getConversation(userId: string, friendId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("direct_messages")
    .select("*, sender:profiles!direct_messages_sender_id_fkey(*), receiver:profiles!direct_messages_receiver_id_fkey(*)")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as DirectMessage[];
}

export async function getMessageThreads(userId: string) {
  const friends = await getFriends(userId);
  const admin = createAdminClient();
  const threads = await Promise.all(
    friends.map(async (friendship) => {
      const friendId = friendship.friend_id;
      const [{ data: messages }, { count }] = await Promise.all([
        admin
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
          .order("created_at", { ascending: false })
          .limit(1),
        admin
          .from("direct_messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_id", friendId)
          .eq("receiver_id", userId)
          .is("read_at", null),
      ]);
      return {
        friend: friendship.friend,
        lastMessage: (messages?.[0] as DirectMessage | undefined) ?? null,
        unreadCount: count ?? 0,
      };
    }),
  );

  return threads.sort((a, b) => {
    const aTime = a.lastMessage?.created_at ?? "";
    const bTime = b.lastMessage?.created_at ?? "";
    return bTime.localeCompare(aTime);
  });
}

export async function resolveMessageFriendId(userId: string, routeId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("id", routeId).maybeSingle();
  if (profile?.id) return profile.id as string;

  const { data: friendship } = await admin
    .from("friendships")
    .select("user_id, friend_id")
    .eq("id", routeId)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .maybeSingle();

  if (!friendship) return routeId;
  return friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
}

async function canMessage(senderId: string, receiverId: string) {
  const admin = createAdminClient();
  const { data: friendship } = await admin
    .from("friendships")
    .select("id")
    .or(`and(user_id.eq.${senderId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${senderId})`)
    .maybeSingle();
  if (friendship) return true;

  const { data: request } = await admin
    .from("friend_requests")
    .select("sender_id, receiver_id")
    .eq("status", "accepted")
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .maybeSingle();

  if (!request) return false;

  await admin
    .from("friendships")
    .upsert(
      [
        { user_id: request.sender_id, friend_id: request.receiver_id },
        { user_id: request.receiver_id, friend_id: request.sender_id },
      ],
      { onConflict: "user_id,friend_id" },
    )
    .throwOnError();

  return true;
}

export async function getFriendProfileForMessage(userId: string, friendId: string) {
  const admin = createAdminClient();
  if (!(await canMessage(userId, friendId))) return null;
  const { data: profile } = await admin.from("profiles").select("*").eq("id", friendId).maybeSingle();
  return profile as Profile | null;
}

async function assertCanMessage(senderId: string, receiverId: string) {
  return canMessage(senderId, receiverId);
}

export async function sendDirectMessage(senderId: string, receiverId: string, body: string) {
  const text = body.trim();
  if (!text) return;
  if (!(await assertCanMessage(senderId, receiverId))) throw new Error("You can only message friends.");
  const admin = createAdminClient();
  const { error } = await admin.from("direct_messages").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    body: text.slice(0, 1000),
  });
  if (error) throw new Error(error.message);
}

export async function markConversationRead(userId: string, friendId: string) {
  const admin = createAdminClient();
  await admin
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", friendId)
    .eq("receiver_id", userId)
    .is("read_at", null);
}
