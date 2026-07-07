export default function OrdersLoading() {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-neutral-200 rounded" />
        <div className="h-8 w-44 bg-neutral-200 rounded" />
      </div>
      <div className="h-10 w-full bg-neutral-100 rounded-lg border border-neutral-200" />
      
      {/* Table grid shimmer */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-12 bg-neutral-50 border-b border-neutral-200" />
        <div className="divide-y divide-neutral-100">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex gap-4 items-center">
                <div className="h-4 w-4 bg-neutral-200 rounded" />
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-neutral-200 rounded" />
                  <div className="h-3 w-40 bg-neutral-200 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-neutral-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
