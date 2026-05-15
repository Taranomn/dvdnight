"use client";

import { EmptyState } from "@/components/EmptyState";

export default function Error() {
  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8">
      <EmptyState
        title="Something went sideways"
        message="The page could not load. Check your environment variables and try again."
        href="/"
        action="Go home"
      />
    </div>
  );
}
