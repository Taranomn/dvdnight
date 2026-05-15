"use client";

import Link from "next/link";
import { X } from "lucide-react";

type LoginPromptModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionLabel?: string;
  redirectTo?: string;
};

export function LoginPromptModal({
  open,
  onClose,
  title,
  description,
  actionLabel = "Sign Up",
  redirectTo = "/",
}: LoginPromptModalProps) {
  if (!open) return null;
  const next = encodeURIComponent(redirectTo);
  const primaryHref = actionLabel.toLowerCase().includes("log") || actionLabel.toLowerCase().includes("sign in")
    ? `/login?redirectTo=${next}`
    : `/signup?redirectTo=${next}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="glass relative w-full max-w-md rounded-[2rem] p-6 shadow-2xl shadow-black/40">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-10 text-2xl font-black text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
        <div className="mt-6 grid gap-3">
          <Link href={primaryHref} className="primary-button h-12 w-full">
            {actionLabel}
          </Link>
          <Link href={`/login?redirectTo=${next}`} className="secondary-button h-12 w-full">
            Log In
          </Link>
          <button onClick={onClose} className="h-12 rounded-2xl text-sm font-semibold text-zinc-400 transition hover:text-white">
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
