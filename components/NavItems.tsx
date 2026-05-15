"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Compass, Heart, Home, ListMusic, Search, Settings, Shuffle, UserRound, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const desktopItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/watchlist", label: "Watchlist", icon: Heart },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/match", label: "Match", icon: Shuffle },
  { href: "/groups", label: "Groups", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/profile", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Settings },
];

const mobileItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/playlists", label: "Lists", icon: ListMusic },
  { href: "/match", label: "Match", icon: Shuffle },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavItems() {
  const pathname = usePathname();
  return (
    <nav className="space-y-2">
      {desktopItems.map((item) => {
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

export function MobileNavItems() {
  const pathname = usePathname();
  return (
    <div className="grid grid-cols-6 gap-1">
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
    </div>
  );
}
