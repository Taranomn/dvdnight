import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ExploreModes } from "@/components/ExploreModes";
import { MovieGrid } from "@/components/MovieGrid";
import { MovieSearchBar } from "@/components/MovieSearchBar";
import { RefreshExploreButton } from "@/components/RefreshExploreButton";
import { generateExploreSections } from "@/lib/recommendations";
import { getExploreRecommendations } from "@/lib/explore";
import { enrichMoviesWithRatings, getPopularMovies, getTopRatedMovies, getTrendingMovies, getUpcomingMovies } from "@/lib/movies";
import { createServerSupabaseClient, getSessionUser } from "@/lib/supabase/server";
import { getLikedMovies, getUserWatchlist } from "@/lib/watchlist";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ refresh?: string }> }) {
  const { refresh = "" } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    const [trending, popular, topRated, upcoming, hidden] = await Promise.all([
      getTrendingMovies().then((movies) => enrichMoviesWithRatings(movies, 12)).catch(() => []),
      getPopularMovies().then((movies) => enrichMoviesWithRatings(movies, 12)).catch(() => []),
      getTopRatedMovies().then((movies) => enrichMoviesWithRatings(movies, 12)).catch(() => []),
      getUpcomingMovies().then((movies) => enrichMoviesWithRatings(movies, 12)).catch(() => []),
      getTopRatedMovies(2).then((movies) => enrichMoviesWithRatings(movies, 12)).catch(() => []),
    ]);
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Find your next movie</h1>
            <p className="mt-2 max-w-2xl text-zinc-400">Smart picks based on what people are watching. Sign in to personalize this page.</p>
          </div>
          <Link href="/signup?redirectTo=/onboarding" className="primary-button px-5 py-3">Start Preference Quiz</Link>
        </div>
        <div className="mt-6"><MovieSearchBar /></div>
        <GuestSection title="Trending Now" movies={trending} />
        <GuestSection title="Popular Movies" movies={popular} />
        <GuestSection title="Top Rated" movies={topRated} />
        <GuestSection title="New Releases" movies={upcoming} />
        <GuestSection title="Hidden Gems" movies={hidden} />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile } = supabase
    ? await supabase.from("profiles").select("onboarding_completed,onboarding_skipped").eq("id", user.id).maybeSingle()
    : { data: null };
  const [watchlist, liked] = await Promise.all([getUserWatchlist(user.id), getLikedMovies(user.id)]);
  const [{ recommendations, topGenres }, sections] = await Promise.all([
    getExploreRecommendations({ userId: user.id, watchlist, liked, refresh }),
    generateExploreSections(user.id).catch(() => []),
  ]);
  const enrichedRecommendations = await enrichMoviesWithRatings(recommendations, 18);
  const watched = watchlist.filter((item) => item.status === "watched");
  const tasteKey = `${watchlist.length}-${liked.length}-${watched.length}-${refresh}-${topGenres.map(([id, genre]) => `${id}:${genre.count}`).join("|")}`;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">Explore</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Personalized picks based on your watchlist, liked movies, watched history, and genre activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <RefreshExploreButton />
          <Link href="/search" className="primary-button px-5 py-3">Search Movies</Link>
        </div>
      </div>
      {!profile?.onboarding_completed ? (
        <div className="glass mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
          <p className="text-zinc-300">Want better recommendations? Answer 10 quick movie questions.</p>
          <Link href="/onboarding" className="primary-button px-5 py-3">Start Preference Quiz</Link>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-3xl p-5">
          <div className="text-3xl font-black">{watchlist.length}</div>
          <div className="text-sm text-zinc-400">Watchlist signals</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-3xl font-black">{liked.length}</div>
          <div className="text-sm text-zinc-400">Liked movies</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-3xl font-black">{watched.length}</div>
          <div className="text-sm text-zinc-400">Watched movies</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {topGenres.map(([id, genre]) => (
          <span key={id} className="rounded-full border border-white/10 bg-[#ff3b5c]/15 px-3 py-1 text-sm text-white">
            {genre.name}
          </span>
        ))}
      </div>

      {recommendations.length ? (
        <>
          {sections.map((section) => (
            <section key={section.title} className="mt-8">
              <h2 className="mb-4 text-2xl font-bold">{section.title}</h2>
              <MovieGrid movies={section.movies.map((item) => item.movie)} actionVariant="compact" />
            </section>
          ))}
          <ExploreModes
            key={tasteKey}
            movies={enrichedRecommendations}
            list="popular"
            params={topGenres.length ? { genre: topGenres.map(([id]) => id).join(","), sort: "vote_average.desc", rating: 6 } : undefined}
          />
        </>
      ) : (
        <section className="mt-8">
          <EmptyState title="No recommendations yet" message="Like movies, mark some as watched, and build your watchlist to personalize Explore." href="/search" action="Find movies" />
        </section>
      )}
    </div>
  );
}

function GuestSection({ title, movies }: { title: string; movies: Awaited<ReturnType<typeof enrichMoviesWithRatings>> }) {
  if (!movies.length) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <MovieGrid movies={movies} actionVariant="compact" />
    </section>
  );
}
