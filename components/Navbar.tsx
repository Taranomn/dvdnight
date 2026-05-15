import Link from "next/link";
import {
  Bell,
  Film,
  LogOut,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DesktopNavItems, MobileNavItems } from "@/components/NavItems";

export async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: profile } =
    supabase && auth.user
      ? await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle()
      : { data: null };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#05050a]/85 p-5 backdrop-blur-2xl md:flex md:flex-col">
        <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-black">
          <Film className="h-6 w-6 text-[#ff3b5c]" />
          Movie<span className="text-[#ff3b5c]">Night</span>
        </Link>
        <DesktopNavItems />
        <div className="mt-auto space-y-4">
          {auth.user ? (
            <form action={logoutAction}>
              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06]">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          ) : (
            <Link href="/login" className="primary-button w-full px-4 py-3 text-sm">
              Login
            </Link>
          )}
          <div className="glass flex items-center gap-3 rounded-2xl p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff3b5c]/25">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{profile?.display_name || "Movie guest"}</div>
              <div className="truncate text-xs text-zinc-500">@{profile?.username || "sign-in"}</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="fixed right-4 top-4 z-30 hidden rounded-full border border-white/10 bg-white/[0.04] p-3 backdrop-blur md:block">
        <Bell className="h-5 w-5 text-zinc-300" />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#05050a]/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-2xl md:hidden">
        <MobileNavItems />
      </nav>
    </>
  );
}
