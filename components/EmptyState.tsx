import Link from "next/link";
import { Film } from "lucide-react";

type EmptyStateProps = {
  title: string;
  message: string;
  href?: string;
  action?: string;
};

export function EmptyState({ title, message, href, action }: EmptyStateProps) {
  return (
    <div className="glass flex min-h-72 flex-col items-center justify-center rounded-3xl p-8 text-center">
      <div className="mb-4 rounded-2xl bg-[#ff3b5c]/15 p-4 text-[#ff3b5c]">
        <Film className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">{message}</p>
      {href && action ? (
        <Link href={href} className="primary-button mt-6 px-5 py-3">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
