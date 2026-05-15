import "server-only";

import { getFullMovieData } from "@/lib/movies";

const onboardingTmdbIds = [
  155, // The Dark Knight
  13, // Forrest Gump
  550, // Fight Club
  27205, // Inception
  680, // Pulp Fiction
  603, // The Matrix
  11, // Star Wars
  129, // Spirited Away
  424, // Schindler's List
  238, // The Godfather
];

export async function getOnboardingMovies() {
  const movies = await Promise.all(onboardingTmdbIds.map((id) => getFullMovieData(id).catch(() => null)));
  return movies.filter((movie): movie is NonNullable<typeof movie> => Boolean(movie)).slice(0, 10);
}
