import "server-only";

type OmdbRating = {
  Source: string;
  Value: string;
};

type OmdbResponse = {
  Ratings?: OmdbRating[];
  imdbRating?: string;
  Response?: string;
  Error?: string;
};

export async function getOmdbRatings(imdbId: string) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return { imdbRating: null, rottenTomatoesRating: null };

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("i", imdbId);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) {
    console.warn(`OMDb request failed for ${imdbId} with status ${response.status}.`);
    return { imdbRating: null, rottenTomatoesRating: null };
  }

  const data = (await response.json()) as OmdbResponse;
  if (data.Response === "False") {
    console.warn(`OMDb returned no ratings for ${imdbId}${data.Error ? `: ${data.Error}` : ""}.`);
    return { imdbRating: null, rottenTomatoesRating: null };
  }

  const imdbValue =
    data.Ratings?.find((rating) => rating.Source === "Internet Movie Database")?.Value?.split("/")[0] ??
    data.imdbRating;
  const rottenValue = data.Ratings?.find((rating) => rating.Source === "Rotten Tomatoes")?.Value ?? null;

  return {
    imdbRating: imdbValue && imdbValue !== "N/A" ? Number(imdbValue) : null,
    rottenTomatoesRating: rottenValue && rottenValue !== "N/A" ? rottenValue : null,
  };
}
