import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";

export async function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
