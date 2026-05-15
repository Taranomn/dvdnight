"use client";

export function HighestRatedButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="secondary-button px-4 py-3">
      Highest Rated
    </button>
  );
}
