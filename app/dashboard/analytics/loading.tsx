export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="h-8 w-36 bg-neutral-200 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm" />
        ))}
      </div>
      <div className="h-96 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm bg-neutral-50" />
    </div>
  );
}
