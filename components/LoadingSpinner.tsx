export function LoadingSpinner() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#ff3b5c]" />
    </div>
  );
}
