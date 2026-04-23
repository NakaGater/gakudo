export function PageSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-4 p-1">
      <div className="h-6 w-48 rounded bg-ink/10" />
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-ink/10"
            style={{ width: `${85 - i * 10}%` }}
          />
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-lg bg-ink/5" />
        <div className="h-24 rounded-lg bg-ink/5" />
      </div>
    </div>
  );
}
