"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Clapperboard, Compass, Heart, Home, ListMusic, MessageCircle, MoreHorizontal, Search, Settings, Shuffle, UserRound, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const desktopItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/watchlist", label: "Watchlist", icon: Heart },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/match", label: "Match", icon: Shuffle },
  { href: "/groups", label: "Groups", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/profile", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

const mobileItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/match", label: "Match", icon: Shuffle },
];

const mobileMoreItems: NavItem[] = [
  { href: "/watchlist", label: "Watchlist", icon: Heart },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/groups", label: "Groups", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavItems({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visibleItems = desktopItems.filter((item) => !item.adminOnly || isAdmin);
  return (
    <nav className="space-y-2">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white",
              active && "bg-[#ff3b5c]/75 text-white shadow-lg shadow-[#ff3b5c]/20",
            )}
          >
            <Icon className={cn("h-4 w-4 transition group-hover:scale-110", active && "fill-current")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavItems({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleMoreItems = mobileMoreItems.filter((item) => !item.adminOnly || isAdmin);
  const moreActive = visibleMoreItems.some((item) => isActive(pathname, item.href));

  return (
    <div className="relative">
      {moreOpen ? (
        <div className="absolute bottom-[calc(100%+0.7rem)] right-0 w-56 rounded-3xl border border-white/10 bg-[#0b0f1a]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="grid gap-1">
            {visibleMoreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white",
                    active && "bg-[#ff3b5c]/15 text-[#ff3b5c]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "fill-current")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center rounded-2xl px-1 py-2 text-[0.65rem] text-zinc-500 transition hover:-translate-y-0.5 hover:text-white",
                active && "bg-[#ff3b5c]/15 text-[#ff3b5c]",
              )}
            >
              <Icon className={cn("mb-1 h-5 w-5 transition", active && "scale-110 fill-current")} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((value) => !value)}
          className={cn(
            "flex flex-col items-center rounded-2xl px-1 py-2 text-[0.65rem] text-zinc-500 transition hover:-translate-y-0.5 hover:text-white",
            (moreOpen || moreActive) && "bg-[#ff3b5c]/15 text-[#ff3b5c]",
          )}
          aria-expanded={moreOpen}
          aria-label="More navigation"
        >
          <MoreHorizontal className={cn("mb-1 h-5 w-5 transition", (moreOpen || moreActive) && "scale-110")} />
          More
        </button>
      </div>
    </div>
  );
}
