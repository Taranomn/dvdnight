import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfiniteMovieGrid } from "@/components/InfiniteMovieGrid";
import { discoverMovies, enrichMoviesWithRatings, getImdbRatedMovies, getNowPlayingMovies, getPopularMovies, getTopRatedMovies, getTrendingMovies, getUpcomingMovies } from "@/lib/movies";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { StoredMovie } from "@/types/movie";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dvdnight.com").replace(/\/$/, "");

const builtInLists = {
  trending: {
    title: "Trending Now",
    description: "Movies people are searching, saving, and talking about right now.",
    loader: getTrendingMovies,
  },
  popular: {
    title: "Popular Movies",
    description: "Crowd-pleasing movies ordered by current popularity.",
    loader: getPopularMovies,
  },
  "top-rated": {
    title: "Top Rated",
    description: "Highly rated movies with strong audience signal.",
    loader: getTopRatedMovies,
  },
  upcoming: {
    title: "Coming Soon",
    description: "Upcoming releases and fresh movie-night possibilities.",
    loader: getUpcomingMovies,
  },
  "now-playing": {
    title: "Latest in Theaters",
    description: "New movies currently playing in theaters.",
    loader: getNowPlayingMovies,
  },
  "imdb-top-250": {
    title: "IMDb-Rated Essentials",
    description: "A high-confidence shelf sorted by IMDb rating when ratings are available.",
    loader: getImdbRatedMovies,
  },
  "rotten-favorites": {
    title: "Critic Favorites",
    description: "Critic-friendly movies with strong ratings and enough audience signal.",
    loader: () => discoverMovies({ sort_by: "vote_average.desc", "vote_count.gte": 1000 }),
  },
  "modern-classics": {
    title: "Modern Classics",
    description: "Highly rated movies from recent decades that still feel essential.",
    loader: () => discoverMovies({ sort_by: "vote_average.desc", "vote_count.gte": 1500, "primary_release_date.gte": "1990-01-01" }),
  },
  "cult-night": {
    title: "Cult Movie Night",
    description: "Genre-heavy picks for stranger, sharper, late-night movie moods.",
    loader: () => discoverMovies({ sort_by: "popularity.desc", with_genres: "27,53,878" }),
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const builtIn = builtInLists[slug as keyof typeof builtInLists];
  if (builtIn) {
    return {
      title: `${builtIn.title} Movies`,
      description: `${builtIn.description} Browse posters, trailers, IMDb ratings, and Rotten Tomatoes scores on Movie Night.`,
      alternates: {
        canonical: `/lists/${slug}`,
      },
      openGraph: {
        title: `${builtIn.title} Movies`,
        description: builtIn.description,
        url: `/lists/${slug}`,
        siteName: "Movie Night",
      },
      twitter: {
        card: "summary",
        title: `${builtIn.title} Movies`,
        description: builtIn.description,
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: list } = supabase
    ? await supabase.from("curated_lists").select("title,description,slug").eq("slug", slug).eq("is_public", true).maybeSingle()
    : { data: null };

  if (!list) {
    return {
      title: "Movie List",
    };
  }

  return {
    title: `${list.title} Movies`,
    description: list.description ?? `Browse ${list.title} on Movie Night.`,
    alternates: {
      canonical: `/lists/${list.slug}`,
    },
  };
}

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const builtIn = builtInLists[slug as keyof typeof builtInLists];
  if (builtIn) {
    const movies = await enrichMoviesWithRatings(await builtIn.loader(), 18);
    const itemListJsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${builtIn.title} Movies`,
      description: builtIn.description,
      url: `${siteUrl}/lists/${slug}`,
      itemListElement: movies.slice(0, 12).map((movie, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: "title" in movie ? movie.title : undefined,
        url: `${siteUrl}/movies/${"tmdb_id" in movie ? movie.tmdb_id : movie.id}`,
      })),
    };
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
        <h1 className="text-4xl font-black">{builtIn.title}</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">{builtIn.description}</p>
        <div className="mt-8">
          <InfiniteMovieGrid initialMovies={movies} list={slug} />
        </div>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: list } = supabase
    ? await supabase.from("curated_lists").select("*").eq("slug", slug).maybeSingle()
    : { data: null };
  if (!list) notFound();
  const { data: rows } = await supabase!
    .from("curated_list_items")
    .select("position, movies(*)")
    .eq("list_id", list.id)
    .order("position", { ascending: true });
  const movies = (rows ?? []).map((row) => row.movies).filter(Boolean) as unknown as StoredMovie[];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">{list.title}</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">{list.description}</p>
      <div className="mt-8">
        <InfiniteMovieGrid initialMovies={movies} list={slug} />
      </div>
    </div>
  );
}
