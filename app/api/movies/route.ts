import { NextResponse } from "next/server";
import {
  discoverMovies,
  enrichMoviesWithRatings,
  getImdbRatedMovies,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
  searchMovies,
} from "@/lib/movies";

async function loadList(list: string, page: number) {
  if (list === "trending") return getTrendingMovies(page);
  if (list === "popular") return getPopularMovies(page);
  if (list === "imdb-top-250") return getImdbRatedMovies(page);
  if (list === "top-rated") return getTopRatedMovies(page);
  if (list === "upcoming") return getUpcomingMovies(page);
  if (list === "now-playing") return getNowPlayingMovies(page);
  if (list === "rotten-favorites") return discoverMovies({ page, sort_by: "vote_average.desc", "vote_count.gte": 1000 });
  if (list === "modern-classics") return discoverMovies({ page, sort_by: "vote_average.desc", "vote_count.gte": 1500, "primary_release_date.gte": "1990-01-01" });
  if (list === "cult-night") return discoverMovies({ page, sort_by: "popularity.desc", with_genres: "27,53,878" });
  return getPopularMovies(page);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const list = searchParams.get("list") ?? "popular";
  const query = searchParams.get("q") ?? "";

  try {
    if (query.trim()) {
      const results = await searchMovies(query, page);
      return NextResponse.json({ results: await enrichMoviesWithRatings(results, 18) });
    }

    const discoverParams = {
      page,
      with_genres: searchParams.get("genre") || undefined,
      "primary_release_year": searchParams.get("year") || undefined,
      "vote_average.gte": searchParams.get("rating") || undefined,
      "with_runtime.lte": searchParams.get("runtime") || undefined,
      sort_by: searchParams.get("sort") || undefined,
    };
    const hasFilters = Object.values(discoverParams).some((value, index) => index > 0 && Boolean(value));
    const results = hasFilters ? await discoverMovies(discoverParams) : await loadList(list, page);
    return NextResponse.json({ results: await enrichMoviesWithRatings(results, 18) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Movie request failed.", results: [] },
      { status: 500 },
    );
  }
}
