"use client";

export function RandomPickButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="primary-button px-4 py-3">
      Pick Random
    </button>
  );
}
