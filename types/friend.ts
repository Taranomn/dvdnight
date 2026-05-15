import type { Profile } from "@/types/user";

export type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
};

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend: Profile;
  watchlist_count?: number;
};
