import Image from "next/image";
import Link from "next/link";
import type { StoredMovie } from "@/types/movie";
import { posterUrl } from "@/lib/utils";
import { RatingBadge } from "@/components/RatingBadge";
import { TrailerEmbed } from "@/components/TrailerEmbed";

export function CommonMovieCard({ movie }: { movie: StoredMovie }) {
  const poster = posterUrl(movie.poster_path);

  return (
    <article className="glass overflow-hidden rounded-3xl p-4">
      <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/[0.04]">
          {poster ? <Image src={poster} alt={`${movie.title} poster`} fill sizes="140px" className="object-cover" /> : null}
        </div>
        <div>
          <h3 className="text-xl font-bold">{movie.title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{movie.release_year ?? "Year N/A"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <RatingBadge source="IMDb" value={movie.imdb_rating} compact />
            <RatingBadge source="Rotten Tomatoes" value={movie.rotten_tomatoes_rating} compact />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <TrailerEmbed trailerKey={movie.trailer_key} className="px-3 py-2 text-sm" />
            <Link href={`/movies/${movie.tmdb_id}`} className="secondary-button px-3 py-2 text-sm">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
