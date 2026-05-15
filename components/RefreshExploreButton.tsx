"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RefreshExploreButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/explore?refresh=${Date.now()}`)}
      className="secondary-button px-5 py-3"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh Explore
    </button>
  );
}
