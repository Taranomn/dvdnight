import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { discoverMovies } from "@/lib/movies";
import { getMovieCredits, getSmartSimilarMovies } from "@/lib/tmdb";
import { isWatchedStatus, isWatchlistStatus } from "@/lib/watchlist";
import type { MovieSummary, StoredMovie, WatchlistItem } from "@/types/movie";

type TasteMovie = {
  movie: StoredMovie;
  weight: number;
  source: "liked" | "watched" | "watchlist";
};

function addScore(
  scores: Map<number, { movie: MovieSummary | StoredMovie; score: number }>,
  movie: MovieSummary | StoredMovie,
  score: number,
) {
  const tmdbId = "tmdb_id" in movie ? movie.tmdb_id : movie.id;
  const current = scores.get(tmdbId);
  if (!current || score > current.score) scores.set(tmdbId, { movie, score });
}

export async function getExploreRecommendations({
  userId,
  watchlist,
  liked,
  refresh = "",
}: {
  userId: string;
  watchlist: WatchlistItem[];
  liked: StoredMovie[];
  refresh?: string;
}) {
  const watched = watchlist.filter((item) => isWatchedStatus(item.status)).map((item) => item.movies);
  const savedWatchlist = watchlist.filter((item) => isWatchlistStatus(item.status)).map((item) => item.movies);
  const seeds: TasteMovie[] = [
    ...liked.map((movie) => ({ movie, weight: 10, source: "liked" as const })),
    ...watched.map((movie) => ({ movie, weight: 7, source: "watched" as const })),
    ...savedWatchlist.map((movie) => ({ movie, weight: 3, source: "watchlist" as const })),
  ];

  const admin = createAdminClient();
  const { data: blockedRows } = await admin
    .from("user_movie_interactions")
    .select("interaction_type, movies(tmdb_id)")
    .eq("user_id", userId)
    .in("interaction_type", ["disliked", "onboarding_dislike", "not_interested", "onboarding_not_interested"]);
  const blockedTmdbIds = new Set(
    (blockedRows ?? [])
      .map((row) => (row.movies as { tmdb_id?: number } | null)?.tmdb_id)
      .filter((id): id is number => typeof id === "number"),
  );
  const seenTmdbIds = new Set([...seeds.map((seed) => seed.movie.tmdb_id), ...blockedTmdbIds]);
  const seenMovieIds = new Set([
    ...watchlist.map((item) => item.movie_id),
    ...liked.map((movie) => movie.id),
  ]);
  const genreCounts = new Map<number, { name: string; count: number }>();
  const scores = new Map<number, { movie: MovieSummary | StoredMovie; score: number }>();

  for (const seed of seeds) {
    for (const genre of seed.movie.genres ?? []) {
      const current = genreCounts.get(genre.id) ?? { name: genre.name, count: 0 };
      genreCounts.set(genre.id, { ...current, count: current.count + seed.weight });
    }
  }

  const primarySeeds = seeds.slice(0, 6);
  const creditResults = await Promise.all(
    primarySeeds.map(async (seed) => {
      try {
        const credits = await getMovieCredits(seed.movie.tmdb_id);
        return { seed, credits };
      } catch {
        return null;
      }
    }),
  );

  const directorIds = new Map<number, number>();
  const writerIds = new Map<number, number>();
  const castIds = new Map<number, number>();
  for (const result of creditResults) {
    if (!result) continue;
    const { seed, credits } = result;
    credits.crew
      .filter((member) => member.job === "Director")
      .slice(0, 2)
      .forEach((member) => directorIds.set(member.id, (directorIds.get(member.id) ?? 0) + seed.weight * 2.2));
    credits.crew
      .filter((member) => ["Writer", "Screenplay", "Story"].includes(member.job))
      .slice(0, 3)
      .forEach((member) => writerIds.set(member.id, (writerIds.get(member.id) ?? 0) + seed.weight * 1.8));
    credits.cast
      .slice(0, 5)
      .forEach((member) => castIds.set(member.id, (castIds.get(member.id) ?? 0) + seed.weight));
  }

  const topGenres = [...genreCounts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 4);
  const topDirectors = [...directorIds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topWriters = [...writerIds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topCast = [...castIds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const pools = await Promise.all([
    ...primarySeeds.slice(0, 4).map((seed) => getSmartSimilarMovies(seed.movie.tmdb_id).catch(() => [])),
    topGenres.length
      ? discoverMovies({ with_genres: topGenres.map(([id]) => id).join(","), sort_by: "popularity.desc", "vote_count.gte": 300 })
      : Promise.resolve([]),
    topGenres[0]
      ? discoverMovies({ with_genres: String(topGenres[0][0]), sort_by: "vote_average.desc", "vote_count.gte": 600 })
      : Promise.resolve([]),
    topDirectors.length
      ? discoverMovies({ with_crew: topDirectors.map(([id]) => id).join("|"), sort_by: "popularity.desc" })
      : Promise.resolve([]),
    topWriters.length
      ? discoverMovies({ with_crew: topWriters.map(([id]) => id).join("|"), sort_by: "popularity.desc" })
      : Promise.resolve([]),
    topCast.length
      ? discoverMovies({ with_cast: topCast.map(([id]) => id).join("|"), sort_by: "popularity.desc" })
      : Promise.resolve([]),
  ]);

  pools.forEach((pool, poolIndex) => {
    pool.forEach((movie, index) => {
      if (seenTmdbIds.has(movie.id)) return;
      const genreBoost = (movie.genre_ids ?? []).reduce((sum, id) => sum + (genreCounts.get(id)?.count ?? 0), 0);
      const poolBoost = Math.max(80 - poolIndex * 7, 20);
      addScore(scores, movie, poolBoost + genreBoost * 9 + (movie.vote_average ?? 0) * 3 + (movie.popularity ?? 0) * 0.04 - index * 0.03);
    });
  });

  const [{ data: otherWatchlist }, { data: otherLikes }] = await Promise.all([
    admin.from("watchlist").select("user_id, movie_id, status, movies(*)").neq("user_id", userId).limit(1000),
    admin.from("movie_likes").select("user_id, movie_id, movies(*)").neq("user_id", userId).limit(1000),
  ]);
  const userOverlap = new Map<string, number>();
  for (const row of [...(otherWatchlist ?? []), ...(otherLikes ?? [])]) {
    if (seenMovieIds.has(row.movie_id as string)) {
      userOverlap.set(row.user_id as string, (userOverlap.get(row.user_id as string) ?? 0) + 1);
    }
  }
  for (const row of [...(otherWatchlist ?? []), ...(otherLikes ?? [])]) {
    const movie = row.movies as unknown as StoredMovie | null;
    const overlap = userOverlap.get(row.user_id as string) ?? 0;
    if (!movie || overlap < 2 || seenMovieIds.has(row.movie_id as string) || seenTmdbIds.has(movie.tmdb_id)) continue;
    addScore(scores, movie, 35 + overlap * 28 + (movie.imdb_rating ?? movie.tmdb_rating ?? 0) * 2.5);
  }

  const jitter = refresh ? Number.parseInt(refresh.slice(-5), 10) || 0 : 0;
  const recommendations = [...scores.values()]
    .sort((a, b) => {
      const aj = jitter ? ((a.movie.title.length * 13 + jitter) % 17) / 100 : 0;
      const bj = jitter ? ((b.movie.title.length * 13 + jitter) % 17) / 100 : 0;
      return b.score + bj - (a.score + aj);
    })
    .map((item) => item.movie)
    .slice(0, 60);

  if (recommendations.length) {
    return { recommendations, topGenres };
  }

  const popular = await discoverMovies({ sort_by: "popularity.desc", "vote_count.gte": 500 });
  return { recommendations: popular, topGenres };
}
