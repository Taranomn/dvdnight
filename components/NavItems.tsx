"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Clapperboard, Compass, Heart, Home, Menu, MessageCircle, MoreHorizontal, Search, Settings, Shuffle, Star, TrendingUp, UserRound, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const desktopItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/watchlist", label: "Watch List", icon: Heart },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const desktopMoreItems: NavItem[] = [
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/match", label: "Match", icon: Shuffle },
  { href: "/groups", label: "Groups", icon: Clapperboard },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

const mobileItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/lists/trending", label: "Lists", icon: Menu },
  { href: "/watchlist", label: "List", icon: Heart },
];

const mobileMoreItems: NavItem[] = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/match", label: "Match", icon: Shuffle },
  { href: "/groups", label: "Groups", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

const browseItems: NavItem[] = [
  { href: "/lists/now-playing", label: "Latest in Theaters", icon: Clapperboard },
  { href: "/lists/trending", label: "Trending Now", icon: TrendingUp },
  { href: "/lists/popular", label: "Popular Movies", icon: Star },
  { href: "/lists/top-rated", label: "Top Rated", icon: Star },
  { href: "/lists/imdb-top-250", label: "IMDb-Rated Essentials", icon: Star },
  { href: "/lists/rotten-favorites", label: "Critic Favorites", icon: Star },
  { href: "/lists/modern-classics", label: "Modern Classics", icon: Clapperboard },
  { href: "/lists/cult-night", label: "Cult Movie Night", icon: Clapperboard },
  { href: "/lists/upcoming", label: "Coming Soon", icon: Clapperboard },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavItems({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visibleItems = desktopItems.filter((item) => !item.adminOnly || isAdmin);
  const visibleMoreItems = desktopMoreItems.filter((item) => !item.adminOnly || isAdmin);
  const browseActive = browseItems.some((item) => isActive(pathname, item.href));
  const [browseOpen, setBrowseOpen] = useState(browseActive);
  const [moreOpen, setMoreOpen] = useState(visibleMoreItems.some((item) => isActive(pathname, item.href)));
  const moreActive = visibleMoreItems.some((item) => isActive(pathname, item.href));
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
      <div
        onMouseEnter={() => setBrowseOpen(true)}
        onMouseLeave={() => {
          if (!browseActive) setBrowseOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setBrowseOpen((value) => !value)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white",
            (browseOpen || browseActive) && "bg-white/[0.06] text-white",
          )}
          aria-expanded={browseOpen}
        >
          <Menu className="h-4 w-4 transition group-hover:scale-110" />
          Browse
        </button>
        {browseOpen ? (
          <div className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            {browseItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.06] hover:text-white",
                    active && "bg-[#ff3b5c]/15 text-[#ff3b5c]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "fill-current")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setMoreOpen((value) => !value)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white",
          (moreOpen || moreActive) && "bg-white/[0.06] text-white",
        )}
      >
        <MoreHorizontal className="h-4 w-4 transition group-hover:scale-110" />
        More
      </button>
      {moreOpen ? (
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {visibleMoreItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.06] hover:text-white",
                  active && "bg-[#ff3b5c]/15 text-[#ff3b5c]",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "fill-current")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
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
        <div className="absolute bottom-[calc(100%+0.7rem)] right-0 max-h-[70dvh] w-60 overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0f1a]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">More</div>
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
          const active = item.href === "/lists/trending" ? pathname.startsWith("/lists") : isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
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
