import "server-only";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type { FriendRequest, Friendship } from "@/types/friend";
import type { Profile } from "@/types/user";

export async function searchUsers(query: string, currentUserId: string) {
  if (query.trim().length < 2) return [];
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const term = `%${query.trim()}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", currentUserId)
    .or(`username.ilike.${term},display_name.ilike.${term},email.ilike.${term}`);

  if (error) return [];
  return (data ?? []) as Profile[];
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) throw new Error("You cannot send a friend request to yourself.");
  const admin = createAdminClient();

  const { data: existingFriendship } = await admin
    .from("friendships")
    .select("id")
    .eq("user_id", senderId)
    .eq("friend_id", receiverId)
    .maybeSingle();
  if (existingFriendship) throw new Error("Already friends.");

  const { data: reverseRequest } = await admin
    .from("friend_requests")
    .select("id")
    .eq("sender_id", receiverId)
    .eq("receiver_id", senderId)
    .eq("status", "pending")
    .maybeSingle();
  if (reverseRequest) throw new Error("This user has already sent you a request.");

  const { error } = await admin.from("friend_requests").upsert(
    {
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sender_id,receiver_id" },
  );
  if (error) throw new Error(error.message);
}

export async function acceptFriendRequest(userId: string, requestId: string) {
  const admin = createAdminClient();
  const { data: request, error: requestError } = await admin
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .single();
  if (requestError) throw new Error(requestError.message);

  const { error } = await admin.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
  if (error) throw new Error(error.message);

  const { error: friendshipError } = await admin.from("friendships").upsert(
    [
      { user_id: request.sender_id, friend_id: request.receiver_id },
      { user_id: request.receiver_id, friend_id: request.sender_id },
    ],
    { onConflict: "user_id,friend_id" },
  );
  if (friendshipError) throw new Error(friendshipError.message);
}

export async function declineFriendRequest(userId: string, requestId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("receiver_id", userId);
  if (error) throw new Error(error.message);
}

export async function removeFriend(userId: string, friendId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("friendships")
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
  if (error) throw new Error(error.message);
}

export async function getFriends(userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("friendships")
    .select("*, friend:profiles!friendships_friend_id_fkey(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Friendship[];
}

export async function getFriendRequests(userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { incoming: [], outgoing: [] };
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*, sender:profiles!friend_requests_sender_id_fkey(*), receiver:profiles!friend_requests_receiver_id_fkey(*)")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const requests = (data ?? []) as FriendRequest[];
  return {
    incoming: requests.filter((request) => request.receiver_id === userId),
    outgoing: requests.filter((request) => request.sender_id === userId),
  };
}
