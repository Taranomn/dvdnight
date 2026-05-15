import { notFound } from "next/navigation";
import { InfiniteMovieGrid } from "@/components/InfiniteMovieGrid";
import { discoverMovies, enrichMoviesWithRatings, getImdbRatedMovies, getNowPlayingMovies, getPopularMovies, getTopRatedMovies, getTrendingMovies, getUpcomingMovies } from "@/lib/movies";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { StoredMovie } from "@/types/movie";

const builtInLists = {
  trending: { title: "Trending Now", loader: getTrendingMovies },
  popular: { title: "Popular Movies", loader: getPopularMovies },
  "top-rated": { title: "Top Rated", loader: getTopRatedMovies },
  upcoming: { title: "Coming Soon", loader: getUpcomingMovies },
  "now-playing": { title: "Now Playing", loader: getNowPlayingMovies },
  "imdb-top-250": { title: "IMDb-Rated Top Movies", loader: getImdbRatedMovies },
  "rotten-favorites": {
    title: "Critic Favorites",
    loader: () => discoverMovies({ sort_by: "vote_average.desc", "vote_count.gte": 1000 }),
  },
  "modern-classics": {
    title: "Modern Classics",
    loader: () => discoverMovies({ sort_by: "vote_average.desc", "vote_count.gte": 1500, "primary_release_date.gte": "1990-01-01" }),
  },
  "cult-night": {
    title: "Cult Movie Night",
    loader: () => discoverMovies({ sort_by: "popularity.desc", with_genres: "27,53,878" }),
  },
};

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const builtIn = builtInLists[slug as keyof typeof builtInLists];
  if (builtIn) {
    const movies = await enrichMoviesWithRatings(await builtIn.loader(), 18);
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h1 className="text-4xl font-black">{builtIn.title}</h1>
        <p className="mt-2 text-zinc-400">A full playlist from TMDB, ready to browse.</p>
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
