export type Genre = {
  id: number;
  name: string;
};

export type MovieSummary = {
  id: number;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  genre_ids?: number[];
};

export type CastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department?: string;
  profile_path?: string | null;
};

export type MovieVideo = {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  name?: string;
};

export type MovieImage = {
  file_path: string;
  aspect_ratio?: number;
  height?: number;
  width?: number;
};

export type FullMovieData = {
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  release_year: number | null;
  runtime: number | null;
  budget: number | null;
  revenue: number | null;
  status: string | null;
  genres: Genre[] | null;
  genre_ids?: number[] | null;
  director_ids?: number[] | null;
  director_names?: string[] | null;
  writer_ids?: number[] | null;
  writer_names?: string[] | null;
  cast_ids?: number[] | null;
  cast_names?: string[] | null;
  keyword_ids?: number[] | null;
  keyword_names?: string[] | null;
  original_language?: string | null;
  tmdb_rating: number | null;
  tmdb_vote_count?: number | null;
  imdb_rating: number | null;
  rotten_tomatoes_rating: string | null;
  popularity?: number | null;
  adult?: boolean | null;
  trailer_key: string | null;
  cast: CastMember[];
  crew: CrewMember[];
  videos: MovieVideo[];
  images: {
    backdrops: MovieImage[];
    posters: MovieImage[];
    logos: MovieImage[];
  };
  director: string | null;
};

export type StoredMovie = Omit<FullMovieData, "cast" | "crew" | "director" | "images"> & {
  id: string;
  movie_cast?: CastMember[] | null;
  movie_crew?: CrewMember[] | null;
  created_at?: string;
  updated_at?: string;
};

export type DisplayMovie = MovieSummary | StoredMovie | FullMovieData;

export type WatchlistItem = {
  id: string;
  user_id: string;
  movie_id: string;
  status: string;
  created_at: string;
  movies: StoredMovie;
};

export type MovieList = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonCredit = MovieSummary & {
  character?: string;
  job?: string;
  department?: string;
};

export type PersonDetails = {
  id: number;
  name: string;
  biography?: string | null;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string | null;
};

export type PersonSearchResult = {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string | null;
  known_for?: MovieSummary[];
};
