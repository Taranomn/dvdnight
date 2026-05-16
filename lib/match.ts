import "server-only";

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getBestComparableRating } from "@/lib/utils";
import { isWatchlistStatus } from "@/lib/watchlist";
import type { StoredMovie, WatchlistItem } from "@/types/movie";

async function getUserWatchlistAdmin(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("watchlist")
    .select("*, movies(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WatchlistItem[];
}

async function assertFriendship(userId: string, friendId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("friendships")
    .select("id")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();
  return Boolean(data);
}

export async function getCommonWatchlist(userId: string, friendId: string) {
  if (!(await assertFriendship(userId, friendId))) return [];
  const [mine, theirs] = await Promise.all([getUserWatchlistAdmin(userId), getUserWatchlistAdmin(friendId)]);
  const theirMovieIds = new Set(theirs.filter((item) => isWatchlistStatus(item.status)).map((item) => item.movie_id));
  return mine
    .filter((item) => isWatchlistStatus(item.status) && theirMovieIds.has(item.movie_id))
    .map((item) => item.movies)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function pickRandomMovie(commonMovies: StoredMovie[]) {
  if (!commonMovies.length) return null;
  return commonMovies[Math.floor(Math.random() * commonMovies.length)];
}

export function pickHighestRatedMovie(commonMovies: StoredMovie[]) {
  return [...commonMovies].sort((a, b) => getBestComparableRating(b) - getBestComparableRating(a))[0] ?? null;
}

export async function getProfileById(profileId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  return data;
}

export async function getGroupCommonWatchlist(groupId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { group: null, members: [], movies: [] };
  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, profile:profiles(*)")
    .eq("group_id", groupId);
  const memberIds = (members ?? []).map((member) => member.user_id as string);
  if (!memberIds.length) return { group, members: members ?? [], movies: [] };

  const lists = await Promise.all(memberIds.map((id) => getUserWatchlistAdmin(id)));
  const [first = []] = lists;
  const otherSets = lists.slice(1).map((list) => new Set(list.filter((item) => isWatchlistStatus(item.status)).map((item) => item.movie_id)));
  const movies = first
    .filter((item) => isWatchlistStatus(item.status) && otherSets.every((set) => set.has(item.movie_id)))
    .map((item) => item.movies)
    .sort((a, b) => a.title.localeCompare(b.title));

  return { group, members: members ?? [], movies };
}
