"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, requireUser } from "@/lib/supabase/server";
import { acceptFriendRequest, declineFriendRequest, removeFriend, sendFriendRequest } from "@/lib/friends";
import { getCommonWatchlist, pickHighestRatedMovie, pickRandomMovie } from "@/lib/match";
import { upsertMovieByTmdbId } from "@/lib/movies";
import { addToWatchlist, removeFromWatchlist, saveMovieInteractionByTmdbId, setWatchlistStatus, toggleMovieLike } from "@/lib/watchlist";
import { updateUserTasteProfile } from "@/lib/recommendations";
import { createMovieComment, sendDirectMessage } from "@/lib/social";

function getPublicOrigin(headerStore: Headers) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredOrigin) return configuredOrigin;

  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  const host = headerStore.get("host");
  if (host) return `https://${host}`;

  return "http://localhost:3000";
}

export async function signUpAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/signup?error=Supabase%20is%20not%20configured");

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "");
  const displayName = String(formData.get("displayName") ?? username);
  const redirectTo = String(formData.get("redirectTo") ?? "/onboarding");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      username,
      display_name: displayName,
    });
  }

  redirect(redirectTo || "/onboarding");
}

export async function loginAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/login?error=Supabase%20is%20not%20configured");

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(redirectTo || "/dashboard");
}

export async function signInWithGoogleAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/login?error=Supabase%20is%20not%20configured");

  const headerStore = await headers();
  const origin = getPublicOrigin(headerStore);
  const redirectTo = String(formData.get("redirectTo") ?? "/explore");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function addMovieAction(tmdbId: number) {
  const user = await requireUser();
  await addToWatchlist(user.id, tmdbId);
  revalidatePath("/");
  revalidatePath(`/movies/${tmdbId}`);
  revalidatePath("/watchlist");
}

export async function removeMovieAction(movieId: string, tmdbId?: number) {
  const user = await requireUser();
  await removeFromWatchlist(user.id, movieId);
  revalidatePath("/watchlist");
  if (tmdbId) revalidatePath(`/movies/${tmdbId}`);
}

export async function setWatchlistStatusAction(movieId: string, status: "want_to_watch" | "watched", tmdbId?: number) {
  const user = await requireUser();
  await setWatchlistStatus(user.id, movieId, status);
  revalidatePath("/watchlist");
  if (tmdbId) revalidatePath(`/movies/${tmdbId}`);
  revalidatePath("/explore");
}

export async function markWatchedByTmdbAction(tmdbId: number) {
  const user = await requireUser();
  const movie = await addToWatchlist(user.id, tmdbId);
  await setWatchlistStatus(user.id, movie.id, "watched");
  revalidatePath("/watchlist");
  revalidatePath("/explore");
  revalidatePath(`/movies/${tmdbId}`);
}

export async function toggleMovieLikeAction(tmdbId: number) {
  const user = await requireUser();
  await toggleMovieLike(user.id, tmdbId);
  revalidatePath(`/movies/${tmdbId}`);
  revalidatePath("/explore");
}

export async function dislikeMovieAction(tmdbId: number, source = "manual") {
  const user = await requireUser();
  await saveMovieInteractionByTmdbId(user.id, tmdbId, "disliked", source);
  revalidatePath("/explore");
  revalidatePath(`/movies/${tmdbId}`);
}

export async function notInterestedMovieAction(tmdbId: number, source = "manual") {
  const user = await requireUser();
  await saveMovieInteractionByTmdbId(user.id, tmdbId, "not_interested", source);
  revalidatePath("/explore");
}

export async function saveOnboardingAnswerAction(tmdbId: number, interactionTypes: string[]) {
  const user = await requireUser();
  for (const type of interactionTypes) {
    await saveMovieInteractionByTmdbId(user.id, tmdbId, type, "onboarding");
  }
}

export async function completeOnboardingAction() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  await updateUserTasteProfile(user.id);
  await supabase?.from("profiles").update({
    onboarding_completed: true,
    onboarding_skipped: false,
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", user.id);
  revalidatePath("/explore");
  redirect("/explore");
}

export async function skipOnboardingAction() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  await supabase?.from("profiles").update({
    onboarding_completed: false,
    onboarding_skipped: true,
  }).eq("id", user.id);
  redirect("/explore");
}

export async function sendFriendRequestAction(receiverId: string) {
  const user = await requireUser();
  await sendFriendRequest(user.id, receiverId);
  revalidatePath("/friends");
}

export async function acceptFriendRequestAction(requestId: string) {
  const user = await requireUser();
  await acceptFriendRequest(user.id, requestId);
  revalidatePath("/friends");
  revalidatePath("/friends/requests");
}

export async function declineFriendRequestAction(requestId: string) {
  const user = await requireUser();
  await declineFriendRequest(user.id, requestId);
  revalidatePath("/friends");
  revalidatePath("/friends/requests");
}

export async function removeFriendAction(friendId: string) {
  const user = await requireUser();
  await removeFriend(user.id, friendId);
  revalidatePath("/friends");
  revalidatePath("/match");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const username = String(formData.get("username") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const avatarUrl = String(formData.get("avatarUrl") ?? "");
  await supabase
    ?.from("profiles")
    .update({
      username,
      display_name: displayName,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);
  revalidatePath("/profile");
}

export async function createGroupAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || !supabase) return;

  const { data: group, error } = await supabase.from("groups").insert({ owner_id: user.id, name }).select("*").single();
  if (error) throw new Error(error.message);
  await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id });
  revalidatePath("/groups");
}

export async function addGroupMemberAction(groupId: string, formData: FormData) {
  const user = await requireUser();
  const friendId = String(formData.get("friendId") ?? "");
  if (!friendId) return;

  const supabase = await createServerSupabaseClient();
  const { data: group } = supabase
    ? await supabase.from("groups").select("id").eq("id", groupId).eq("owner_id", user.id).maybeSingle()
    : { data: null };
  if (!group) throw new Error("Only the group owner can add members.");

  const { data: friendship } = supabase
    ? await supabase.from("friendships").select("id").eq("user_id", user.id).eq("friend_id", friendId).maybeSingle()
    : { data: null };
  if (!friendship) throw new Error("Only friends can be added to a group.");

  await supabase?.from("group_members").upsert({ group_id: groupId, user_id: friendId }, { onConflict: "group_id,user_id" });
  revalidatePath(`/groups/${groupId}`);
}

export async function createCuratedListAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data: profile } = supabase
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  if (profile?.role !== "admin") throw new Error("Admin access required.");

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !slug) return;

  const { error } = await supabase!.from("curated_lists").upsert(
    {
      title,
      slug,
      description,
      created_by: user.id,
      is_public: true,
    },
    { onConflict: "slug" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath(`/lists/${slug}`);
}

export async function addMovieToCuratedListAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data: profile } = supabase
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  if (profile?.role !== "admin") throw new Error("Admin access required.");

  const listId = String(formData.get("listId") ?? "");
  const tmdbId = Number(formData.get("tmdbId") ?? "");
  if (!listId || !Number.isFinite(tmdbId)) return;
  const movie = await upsertMovieByTmdbId(tmdbId);
  const position = Number(formData.get("position") ?? 0);
  const { error } = await supabase!.from("curated_list_items").upsert(
    {
      list_id: listId,
      movie_id: movie.id,
      position,
    },
    { onConflict: "list_id,movie_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/lists/[slug]", "page");
}

export async function addMovieCommentAction(tmdbId: number, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "");
  const ratingValue = String(formData.get("rating") ?? "");
  const parentId = String(formData.get("parentId") ?? "");
  const rating = ratingValue ? Number(ratingValue) : null;
  await createMovieComment(user.id, tmdbId, body, rating, parentId || null);
  revalidatePath(`/movies/${tmdbId}`);
}

export async function sendDirectMessageAction(receiverId: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "");
  await sendDirectMessage(user.id, receiverId, body);
  revalidatePath(`/messages/${receiverId}`);
  revalidatePath("/messages");
}

export async function sendRandomCommonMovieAction(receiverId: string) {
  const user = await requireUser();
  const common = await getCommonWatchlist(user.id, receiverId);
  const movie = pickRandomMovie(common);
  const body = movie
    ? `Random pick for us: ${movie.title}${movie.release_year ? ` (${movie.release_year})` : ""}\n/movies/${movie.tmdb_id}`
    : "We do not have common watchlist movies yet. Let's add more and match again.";
  await sendDirectMessage(user.id, receiverId, body);
  revalidatePath(`/messages/${receiverId}`);
  revalidatePath("/messages");
}

export async function sendHighestRatedCommonMovieAction(receiverId: string) {
  const user = await requireUser();
  const common = await getCommonWatchlist(user.id, receiverId);
  const movie = pickHighestRatedMovie(common);
  const body = movie
    ? `Highest-rated common pick: ${movie.title}${movie.release_year ? ` (${movie.release_year})` : ""}\n/movies/${movie.tmdb_id}`
    : "We do not have a highest-rated common movie yet. Let's build our watchlists first.";
  await sendDirectMessage(user.id, receiverId, body);
  revalidatePath(`/messages/${receiverId}`);
  revalidatePath("/messages");
}

export async function sendMatchInviteAction(receiverId: string) {
  const user = await requireUser();
  await sendDirectMessage(user.id, receiverId, `Let's compare our watchlists:\n/match/${receiverId}`);
  revalidatePath(`/messages/${receiverId}`);
  revalidatePath("/messages");
}

export async function sendWatchlistInviteAction(receiverId: string) {
  const user = await requireUser();
  await sendDirectMessage(user.id, receiverId, `Check out my movie profile and watchlist:\n/profile/${user.id}`);
  revalidatePath(`/messages/${receiverId}`);
  revalidatePath("/messages");
}

export async function shareMovieToFriendAction(receiverId: string, tmdbId: number) {
  const user = await requireUser();
  const movie = await upsertMovieByTmdbId(tmdbId);
  await sendDirectMessage(
    user.id,
    receiverId,
    `I think we should watch ${movie.title}${movie.release_year ? ` (${movie.release_year})` : ""}.\n/movies/${movie.tmdb_id}`,
  );
  revalidatePath(`/messages/${receiverId}`);
  revalidatePath("/messages");
  revalidatePath(`/movies/${tmdbId}`);
}
