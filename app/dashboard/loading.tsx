export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      {/* Title */}
      <div className="h-10 w-48 rounded bg-neutral-200" />
      
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-neutral-200 rounded" />
              <div className="h-7 w-7 bg-neutral-200 rounded-lg" />
            </div>
            <div className="h-6 w-24 bg-neutral-200 rounded" />
            <div className="h-3 w-32 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>

      {/* Grid segments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 rounded-xl border border-neutral-100 bg-white p-6 shadow-sm" />
        <div className="h-96 rounded-xl border border-neutral-100 bg-white p-6 shadow-sm" />
      </div>
    </div>
  );
}
