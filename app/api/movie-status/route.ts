import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { isMovieInWatchlist, isMovieLiked } from "@/lib/watchlist";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const tmdbIds = searchParams
    .get("tmdbIds")
    ?.split(",")
    .map((value) => Number(value))
    .filter(Number.isFinite);
  const tmdbId = Number(searchParams.get("tmdbId"));

  if (!user) {
    return NextResponse.json(tmdbIds?.length ? { statuses: {} } : { liked: false, watchlist: null }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (tmdbIds?.length) {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const admin = createAdminClient();
    const { data: watchlistRows } = await admin
      .from("watchlist")
      .select("id, movie_id, status, movies!inner(tmdb_id)")
      .eq("user_id", user.id)
      .in("movies.tmdb_id", tmdbIds);
    const { data: likeRows } = await admin
      .from("movie_likes")
      .select("id, movie_id, movies!inner(tmdb_id)")
      .eq("user_id", user.id)
      .in("movies.tmdb_id", tmdbIds);

    const statuses: Record<string, { liked: boolean; watchlist: { id?: string; movie_id: string; status?: string | null } | null }> = {};
    for (const id of tmdbIds) statuses[id] = { liked: false, watchlist: null };
    for (const row of watchlistRows ?? []) {
      const movie = Array.isArray(row.movies) ? row.movies[0] : row.movies;
      if (!movie?.tmdb_id) continue;
      statuses[String(movie.tmdb_id)] = {
        ...(statuses[String(movie.tmdb_id)] ?? { liked: false }),
        watchlist: { id: row.id as string, movie_id: row.movie_id as string, status: row.status as string | null },
      };
    }
    for (const row of likeRows ?? []) {
      const movie = Array.isArray(row.movies) ? row.movies[0] : row.movies;
      if (!movie?.tmdb_id) continue;
      statuses[String(movie.tmdb_id)] = {
        ...(statuses[String(movie.tmdb_id)] ?? { watchlist: null }),
        liked: true,
      };
    }
    return NextResponse.json({ statuses }, { headers: { "Cache-Control": "no-store" } });
  }

  if (!user || !Number.isFinite(tmdbId)) {
    return NextResponse.json({ liked: false, watchlist: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const [watchlist, liked] = await Promise.all([
    isMovieInWatchlist(user.id, tmdbId),
    isMovieLiked(user.id, tmdbId),
  ]);

  return NextResponse.json(
    {
      liked,
      watchlist,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
