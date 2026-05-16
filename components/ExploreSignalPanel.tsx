import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Signal = {
  key: "watchlist" | "liked" | "watched";
  label: string;
  helper: string;
  count: number;
  href: string;
};

export function ExploreSignalPanel({ signals }: { signals: Signal[] }) {
  return (
    <section className="mt-5 grid gap-3 sm:grid-cols-3">
      {signals.map((signal) => (
        <Link
          key={signal.key}
          href={signal.href}
          className={cn(
            "group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-[#ff3b5c]/45 hover:bg-white/[0.06]",
          )}
        >
          <span>
            <span className="block text-2xl font-black">{signal.count}</span>
            <span className="block text-sm font-semibold text-zinc-200">{signal.label}</span>
            <span className="mt-1 block text-xs text-zinc-500">{signal.helper}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-[#ff3b5c]" />
        </Link>
      ))}
    </section>
  );
}
