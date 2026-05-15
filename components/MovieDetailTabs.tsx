"use client";

import Image from "next/image";
import { useState } from "react";
import type { DisplayMovie, FullMovieData } from "@/types/movie";
import { MovieGrid } from "@/components/MovieGrid";
import { TrailerEmbed } from "@/components/TrailerEmbed";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function formatMoney(value?: number | null) {
  if (!value) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MovieDetailTabs({ movie, similar }: { movie: FullMovieData; similar: DisplayMovie[] }) {
  const [showPhotos, setShowPhotos] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const youtubeVideos = movie.videos.filter((video) => video.site === "YouTube");
  const photos = [...movie.images.backdrops, ...movie.images.posters, ...movie.images.logos].filter((image) => image.file_path);

  return (
    <div className="space-y-8">
      <section className="glass rounded-3xl p-5 md:p-7">
        <h2 className="text-2xl font-bold">Overview</h2>
        <div className="mt-5 space-y-5">
          <p className="max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{movie.overview ?? "Overview not available."}</p>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 md:p-7">
        <h2 className="text-2xl font-bold">Movie Info</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Budget</div>
            <div className="mt-2 text-lg font-bold text-white">{formatMoney(movie.budget)}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue</div>
            <div className="mt-2 text-lg font-bold text-white">{formatMoney(movie.revenue)}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</div>
            <div className="mt-2 text-lg font-bold text-white">{movie.status ?? "Not available"}</div>
          </div>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Videos</h2>
            <p className="mt-1 text-sm text-zinc-500">Trailers, teasers, clips, and featurettes from TMDB.</p>
          </div>
          {youtubeVideos.length ? (
            <button onClick={() => setShowVideos((value) => !value)} className="secondary-button px-4 py-3 text-sm">
              {showVideos ? "Hide videos" : `Show videos (${youtubeVideos.length})`}
            </button>
          ) : null}
        </div>
        {showVideos && youtubeVideos.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {youtubeVideos.map((video) => (
              <div key={video.key} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="mb-3 font-bold">{video.name ?? video.type}</h3>
                <TrailerEmbed trailerKey={video.key} className="w-full px-4 py-3" />
              </div>
            ))}
          </div>
        ) : !youtubeVideos.length ? (
          <p className="mt-6 text-zinc-400">Trailer not available.</p>
        ) : null}
      </section>

      <section className="glass rounded-3xl p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Photos</h2>
            <p className="mt-1 text-sm text-zinc-500">Backdrops, posters, and logos from TMDB.</p>
          </div>
          {photos.length ? (
            <button onClick={() => setShowPhotos((value) => !value)} className="secondary-button px-4 py-3 text-sm">
              {showPhotos ? "Hide photos" : `Show photos (${photos.length})`}
            </button>
          ) : null}
        </div>
        {showPhotos && photos.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((image) => (
              <div key={image.file_path} className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
                <Image src={`${TMDB_IMAGE_BASE}${image.file_path}`} alt={`${movie.title} media`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              </div>
            ))}
          </div>
        ) : !photos.length ? (
          <p className="mt-6 text-zinc-400">Photos not available.</p>
        ) : null}
      </section>

      <section className="glass rounded-3xl p-5 md:p-7">
        <h2 className="text-2xl font-bold">Similar Movies</h2>
        <div className="mt-6">
          {similar.length ? (
            <MovieGrid
              movies={similar.slice(0, 12)}
              className="sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            />
          ) : (
            <p className="text-zinc-400">No similar movies found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
