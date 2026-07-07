export default function ProductsLoading() {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-neutral-200 rounded" />
        <div className="h-8 w-36 bg-neutral-200 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
            <div className="aspect-video w-full bg-neutral-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-neutral-200 rounded" />
              <div className="h-3 w-1/2 bg-neutral-200 rounded" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
              <div className="h-4 w-16 bg-neutral-200 rounded" />
              <div className="h-6 w-12 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
