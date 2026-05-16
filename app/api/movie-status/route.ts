import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { isMovieInWatchlist, isMovieLiked } from "@/lib/watchlist";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const tmdbId = Number(searchParams.get("tmdbId"));

  if (!user || !Number.isFinite(tmdbId)) {
    return NextResponse.json({ liked: false, watchlist: null });
  }

  const [watchlist, liked] = await Promise.all([
    isMovieInWatchlist(user.id, tmdbId),
    isMovieLiked(user.id, tmdbId),
  ]);

  return NextResponse.json({
    liked,
    watchlist,
  });
}
