import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { getOnboardingMovies } from "@/lib/onboarding";
import { requireUser } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  await requireUser();
  const movies = await getOnboardingMovies();
  return <OnboardingQuiz movies={movies} />;
}
