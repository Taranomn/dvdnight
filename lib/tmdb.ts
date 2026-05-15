import "server-only";

import type {
  CastMember,
  CrewMember,
  FullMovieData,
  Genre,
  MovieSummary,
  MovieVideo,
  MovieImage,
  PersonCredit,
  PersonDetails,
  PersonSearchResult,
} from "@/types/movie";
import { yearFromDate } from "@/lib/utils";
import { getOmdbRatings } from "@/lib/omdb";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbVideo = MovieVideo;

async function tmdbFetch<T>(path: string, params?: Record<string, string | number | undefined>) {
  const bearer = process.env.TMDB_BEARER_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!bearer && !apiKey) {
    throw new Error("TMDB credentials are missing. Add TMDB_BEARER_TOKEN or TMDB_API_KEY.");
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("language", "en-US");
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });
  if (!bearer && apiKey) url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function searchMovies(query: string, page = 1) {
  if (!query.trim()) return [];
  const data = await tmdbFetch<{ results: MovieSummary[] }>("/search/movie", {
    query,
    page,
    include_adult: "false",
  });
  return data.results;
}

export async function searchPeople(query: string, page = 1) {
  if (!query.trim()) return [];
  const data = await tmdbFetch<{ results: PersonSearchResult[] }>("/search/person", {
    query,
    page,
    include_adult: "false",
  });

  return data.results
    .filter((person) => ["Acting", "Directing"].includes(person.known_for_department ?? ""))
    .slice(0, 8);
}

export async function getTrendingMovies(page = 1) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>("/trending/movie/week", { page });
  return data.results;
}

export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>("/movie/popular", { page });
  return data.results;
}

export async function getTopRatedMovies(page = 1) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>("/movie/top_rated", { page });
  return data.results;
}

export async function getUpcomingMovies(page = 1) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>("/movie/upcoming", { page });
  return data.results;
}

export async function getNowPlayingMovies(page = 1) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>("/movie/now_playing", { page });
  return data.results;
}

export async function discoverMovies(params: Record<string, string | number | undefined>) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>("/discover/movie", {
    sort_by: "popularity.desc",
    include_adult: "false",
    ...params,
  });
  return data.results;
}

export async function getGenres() {
  const data = await tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
  return data.genres;
}

export async function getSimilarMovies(tmdbId: number) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>(`/movie/${tmdbId}/similar`);
  return data.results;
}

export async function getMovieRecommendations(tmdbId: number) {
  const data = await tmdbFetch<{ results: MovieSummary[] }>(`/movie/${tmdbId}/recommendations`);
  return data.results;
}

export async function getMovieKeywords(tmdbId: number) {
  const data = await tmdbFetch<{ keywords: { id: number; name: string }[] }>(`/movie/${tmdbId}/keywords`);
  return data.keywords;
}

export async function getSmartSimilarMovies(tmdbId: number) {
  const [details, credits, keywords, recommendations, similar] = await Promise.all([
    getMovieDetails(tmdbId),
    getMovieCredits(tmdbId),
    getMovieKeywords(tmdbId).catch(() => []),
    getMovieRecommendations(tmdbId).catch(() => []),
    getSimilarMovies(tmdbId).catch(() => []),
  ]);
  const directorIds = credits.crew.filter((member) => member.job === "Director").map((member) => member.id).slice(0, 2);
  const castIds = credits.cast.slice(0, 4).map((member) => member.id);
  const genreIds = details.genres?.map((genre) => genre.id) ?? [];
  const keywordIds = keywords.slice(0, 8).map((keyword) => keyword.id);

  const [genreMatches, directorMatches, castMatches, keywordMatches] = await Promise.all([
    genreIds.length
      ? discoverMovies({ with_genres: genreIds.slice(0, 3).join(","), sort_by: "vote_average.desc", "vote_count.gte": 500 })
      : Promise.resolve([]),
    directorIds.length
      ? discoverMovies({ with_crew: directorIds.join("|"), sort_by: "popularity.desc" })
      : Promise.resolve([]),
    castIds.length
      ? discoverMovies({ with_cast: castIds.join("|"), sort_by: "popularity.desc" })
      : Promise.resolve([]),
    keywordIds.length
      ? discoverMovies({ with_keywords: keywordIds.join("|"), sort_by: "popularity.desc" })
      : Promise.resolve([]),
  ]);

  const scores = new Map<number, { movie: MovieSummary; score: number; reasons: Set<string> }>();
  function add(movie: MovieSummary, score: number, reason: string) {
    if (movie.id === tmdbId) return;
    const current = scores.get(movie.id) ?? { movie, score: 0, reasons: new Set<string>() };
    current.score += score + (movie.vote_average ?? 0) * 1.8 + (movie.popularity ?? 0) * 0.02;
    current.reasons.add(reason);
    scores.set(movie.id, current);
  }

  recommendations.forEach((movie, index) => add(movie, 120 - index * 2, "TMDB recommendation"));
  similar.forEach((movie, index) => add(movie, 65 - index, "similar audience"));
  genreMatches.forEach((movie, index) => add(movie, 45 - index * 0.5, "genre match"));
  directorMatches.forEach((movie, index) => add(movie, 80 - index, "same director"));
  castMatches.forEach((movie, index) => add(movie, 35 - index * 0.5, "shared cast"));
  keywordMatches.forEach((movie, index) => add(movie, 55 - index * 0.75, "keyword match"));

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.movie)
    .slice(0, 24);
}

export async function getMovieDetails(tmdbId: number) {
  return tmdbFetch<{
    id: number;
    imdb_id?: string | null;
    title: string;
    overview?: string | null;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string | null;
    runtime?: number | null;
    budget?: number | null;
    revenue?: number | null;
    status?: string | null;
    genres?: Genre[];
    vote_average?: number | null;
    vote_count?: number | null;
    original_language?: string | null;
    popularity?: number | null;
    adult?: boolean | null;
  }>(`/movie/${tmdbId}`);
}

export async function getMovieVideos(tmdbId: number) {
  const data = await tmdbFetch<{ results: TmdbVideo[] }>(`/movie/${tmdbId}/videos`);
  return data.results;
}

export async function getMovieCredits(tmdbId: number) {
  return tmdbFetch<{ cast: CastMember[]; crew: CrewMember[] }>(`/movie/${tmdbId}/credits`);
}

export async function getMovieImages(tmdbId: number) {
  return tmdbFetch<{ backdrops: MovieImage[]; posters: MovieImage[]; logos: MovieImage[] }>(`/movie/${tmdbId}/images`, {
    include_image_language: "en,null",
  });
}

export async function getMovieExternalIds(tmdbId: number) {
  return tmdbFetch<{ imdb_id?: string | null }>(`/movie/${tmdbId}/external_ids`);
}

export async function getPersonDetails(personId: number) {
  return tmdbFetch<PersonDetails>(`/person/${personId}`);
}

export async function getPersonMovieCredits(personId: number) {
  return tmdbFetch<{ cast: PersonCredit[]; crew: PersonCredit[] }>(`/person/${personId}/movie_credits`);
}

export function selectTrailer(videos: TmdbVideo[]) {
  const youtubeTrailers = videos.filter((video) => video.site === "YouTube" && video.type === "Trailer" && video.key);
  return youtubeTrailers.find((video) => video.official)?.key ?? youtubeTrailers[0]?.key ?? null;
}

export async function getFullMovieData(tmdbId: number): Promise<FullMovieData> {
  const [details, videos, credits, externalIds, images] = await Promise.all([
    getMovieDetails(tmdbId),
    getMovieVideos(tmdbId),
    getMovieCredits(tmdbId),
    getMovieExternalIds(tmdbId),
    getMovieImages(tmdbId).catch(() => ({ backdrops: [], posters: [], logos: [] })),
  ]);

  const imdbId = externalIds.imdb_id ?? details.imdb_id ?? null;
  const omdb = imdbId ? await getOmdbRatings(imdbId) : { imdbRating: null, rottenTomatoesRating: null };
  const directors = credits.crew.filter((member) => member.job === "Director");
  const writers = credits.crew.filter((member) => ["Writer", "Screenplay", "Story"].includes(member.job));
  const keywords = await getMovieKeywords(tmdbId).catch(() => []);
  const director = directors[0]?.name ?? null;

  return {
    tmdb_id: details.id,
    imdb_id: imdbId,
    title: details.title,
    overview: details.overview ?? null,
    poster_path: details.poster_path ?? null,
    backdrop_path: details.backdrop_path ?? null,
    release_date: details.release_date ?? null,
    release_year: yearFromDate(details.release_date),
    runtime: details.runtime ?? null,
    budget: details.budget ?? null,
    revenue: details.revenue ?? null,
    status: details.status ?? null,
    genres: details.genres ?? null,
    genre_ids: details.genres?.map((genre) => genre.id) ?? null,
    director_ids: directors.map((member) => member.id),
    director_names: directors.map((member) => member.name),
    writer_ids: writers.map((member) => member.id),
    writer_names: writers.map((member) => member.name),
    cast_ids: credits.cast.slice(0, 12).map((member) => member.id),
    cast_names: credits.cast.slice(0, 12).map((member) => member.name),
    keyword_ids: keywords.map((keyword) => keyword.id),
    keyword_names: keywords.map((keyword) => keyword.name),
    original_language: details.original_language ?? null,
    tmdb_rating: details.vote_average ? Number(details.vote_average.toFixed(1)) : null,
    tmdb_vote_count: details.vote_count ?? null,
    imdb_rating: omdb.imdbRating,
    rotten_tomatoes_rating: omdb.rottenTomatoesRating,
    popularity: details.popularity ?? null,
    adult: details.adult ?? null,
    trailer_key: selectTrailer(videos),
    cast: credits.cast,
    crew: credits.crew,
    videos,
    images,
    director,
  };
}
