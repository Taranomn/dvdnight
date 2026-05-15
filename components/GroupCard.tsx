import Link from "next/link";
import { Users } from "lucide-react";

export function GroupCard({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/groups/${id}`}
      className="glass flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-1 hover:border-[#ff3b5c]/40"
    >
      <div className="rounded-2xl bg-[#7c5cff]/20 p-4 text-[#7c5cff]">
        <Users className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-bold">{name}</h3>
        <p className="text-sm text-zinc-400">Compare everyone&apos;s watchlist</p>
      </div>
    </Link>
  );
}
