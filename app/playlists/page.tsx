import Link from "next/link";

const playlists = [
  {
    slug: "imdb-top-250",
    title: "IMDb Top 250 Mood",
    copy: "A top-rated canon-style list kept in rating order from available movie APIs.",
  },
  {
    slug: "rotten-favorites",
    title: "Critic Favorites",
    copy: "Critic-friendly discoveries ordered by high average rating and strong vote counts.",
  },
  {
    slug: "top-rated",
    title: "Top Rated Movies",
    copy: "A source-ranked stream of highly rated films, extended as you scroll.",
  },
  {
    slug: "modern-classics",
    title: "Modern Classics",
    copy: "Highly rated modern films ordered for browsing without random reshuffling.",
  },
  {
    slug: "cult-night",
    title: "Cult Movie Night",
    copy: "Genre-heavy cult-friendly picks ordered by popularity within their lane.",
  },
  {
    slug: "trending",
    title: "Trending Now",
    copy: "Current TMDB trend order, extended page by page.",
  },
  {
    slug: "popular",
    title: "Popular Movies",
    copy: "The broad crowd-pleaser stream in TMDB popularity order.",
  },
  {
    slug: "upcoming",
    title: "Coming Soon",
    copy: "Upcoming releases in API order.",
  },
];

export default function PlaylistsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Playlists</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Famous and curated movie streams, each preserving its source ordering as new pages load.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {playlists.map((playlist) => (
          <Link
            key={playlist.slug}
            href={`/lists/${playlist.slug}`}
            className="glass rounded-[2rem] p-6 transition hover:-translate-y-1 hover:border-[#ff3b5c]/40"
          >
            <h2 className="text-2xl font-bold">{playlist.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{playlist.copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
