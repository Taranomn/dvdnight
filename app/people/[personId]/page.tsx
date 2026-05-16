import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SortableFilmography } from "@/components/SortableFilmography";
import { enrichMoviesWithRatings } from "@/lib/movies";
import { getPersonDetails, getPersonMovieCredits } from "@/lib/tmdb";

const getPersonForPage = cache(async (personId: number) => getPersonDetails(personId));

export async function generateMetadata({ params }: { params: Promise<{ personId: string }> }): Promise<Metadata> {
  const { personId } = await params;
  const id = Number(personId);
  if (!Number.isFinite(id)) {
    return {
      title: "Person Not Found",
    };
  }

  try {
    const person = await getPersonForPage(id);
    const description =
      person.biography?.slice(0, 155) ||
      `Browse ${person.name}'s movies, credits, and IMDb-rated filmography on Movie Night.`;
    const imageUrl = person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : undefined;

    return {
      title: `${person.name} Movies and Credits`,
      description,
      alternates: {
        canonical: `/people/${id}`,
      },
      openGraph: {
        title: `${person.name} Movies and Credits`,
        description,
        url: `/people/${id}`,
        siteName: "Movie Night",
        images: imageUrl ? [{ url: imageUrl, width: 500, height: 750 }] : undefined,
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title: `${person.name} Movies and Credits`,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Person Not Found",
    };
  }
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const id = Number(personId);
  if (!Number.isFinite(id)) notFound();

  const [person, credits] = await Promise.all([getPersonForPage(id), getPersonMovieCredits(id)]);
  const allCredits = [
    ...credits.cast.map((credit) => ({ ...credit, creditType: "Acting" })),
    ...credits.crew.map((credit) => ({ ...credit, creditType: credit.job ?? "Crew" })),
  ];
  const deduped = Array.from(new Map(allCredits.map((credit) => [credit.id, credit])).values());
  const enrichedSorted = await enrichMoviesWithRatings(deduped, 30);

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
      </div>
      <div className="mt-4">
        <SortableFilmography movies={enrichedSorted} />
      </div>
    </div>
  );
}
