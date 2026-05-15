import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MovieGrid } from "@/components/MovieGrid";
import { enrichMoviesWithRatings } from "@/lib/movies";
import { getPersonDetails, getPersonMovieCredits } from "@/lib/tmdb";

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { personId } = await params;
  const { sort = "popularity" } = await searchParams;
  const id = Number(personId);
  if (!Number.isFinite(id)) notFound();

  const [person, credits] = await Promise.all([getPersonDetails(id), getPersonMovieCredits(id)]);
  const allCredits = [
    ...credits.cast.map((credit) => ({ ...credit, creditType: "Acting" })),
    ...credits.crew.map((credit) => ({ ...credit, creditType: credit.job ?? "Crew" })),
  ];
  const deduped = Array.from(new Map(allCredits.map((credit) => [credit.id, credit])).values());
  const sorted = deduped.sort((a, b) => {
    if (sort === "newest") return String(b.release_date ?? "").localeCompare(String(a.release_date ?? ""));
    if (sort === "oldest") return String(a.release_date ?? "").localeCompare(String(b.release_date ?? ""));
    if (sort === "rating") return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    if (sort === "title") return a.title.localeCompare(b.title);
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });
  const enrichedSorted = await enrichMoviesWithRatings(sorted, 18);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <section className="glass grid gap-6 rounded-[2rem] p-5 md:grid-cols-[13rem_1fr] md:p-8">
        <div className="relative aspect-[2/3] overflow-hidden rounded-3xl bg-white/[0.04]">
          {person.profile_path ? (
            <Image src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} alt={person.name} fill sizes="220px" className="object-cover" />
          ) : null}
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#ff3b5c]">{person.known_for_department}</p>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">{person.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 line-clamp-6">
            {person.biography || "Biography not available."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-zinc-400">
            {person.birthday ? <span>Born {person.birthday}</span> : null}
            {person.place_of_birth ? <span>{person.place_of_birth}</span> : null}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Filmography</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["popularity", "Most popular"],
            ["rating", "Highest rated"],
            ["newest", "Newest"],
            ["oldest", "Oldest"],
            ["title", "A-Z"],
          ].map(([value, label]) => (
            <Link key={value} href={`/people/${id}?sort=${value}`} className={`secondary-button px-3 py-2 text-sm ${sort === value ? "border-[#ff3b5c]/50 bg-[#ff3b5c]/15" : ""}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <MovieGrid movies={enrichedSorted} />
      </div>
    </div>
  );
}
