import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StoredMovie } from "@/types/movie";

export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
export const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function posterUrl(path?: string | null) {
  return path ? `${TMDB_POSTER_BASE}${path}` : null;
}

export function backdropUrl(path?: string | null) {
  return path ? `${TMDB_BACKDROP_BASE}${path}` : null;
}

export function yearFromDate(date?: string | null) {
  return date ? new Date(date).getFullYear() : null;
}

export function formatRuntime(minutes?: number | null) {
  if (!minutes) return "Runtime N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours ? `${hours}h ` : ""}${mins}m`;
}

export function formatRating(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "N/A";
}

export function getBestComparableRating(movie: Pick<StoredMovie, "imdb_rating" | "tmdb_rating" | "rotten_tomatoes_rating">) {
  if (movie.imdb_rating) return Number(movie.imdb_rating);
  if (movie.rotten_tomatoes_rating) {
    return Number(movie.rotten_tomatoes_rating.replace("%", "")) / 10;
  }
  return 0;
}

export function ratingSource(movie: Pick<StoredMovie, "imdb_rating" | "tmdb_rating" | "rotten_tomatoes_rating">) {
  if (movie.imdb_rating) return "IMDb rating";
  if (movie.rotten_tomatoes_rating) return "Rotten Tomatoes rating";
  return "available ratings";
}
