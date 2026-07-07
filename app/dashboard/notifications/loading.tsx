export default function NotificationsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 max-w-4xl mx-auto">
      <div className="h-8 w-44 bg-neutral-200 rounded" />
      <div className="space-y-4">
        {[...Array(3)].map((_, groupIdx) => (
          <div key={groupIdx} className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="h-3.5 w-24 bg-neutral-200 rounded" />
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
              {[...Array(3)].map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-4 p-4 items-start">
                  <div className="h-8 w-8 bg-neutral-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-neutral-200 rounded" />
                      <div className="h-3 w-16 bg-neutral-200 rounded" />
                    </div>
                    <div className="h-4 w-1/2 bg-neutral-200 rounded" />
                    <div className="h-3 w-1/3 bg-neutral-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
