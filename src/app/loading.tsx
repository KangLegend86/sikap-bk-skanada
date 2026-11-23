export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#D1FAE5] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-200/70" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 animate-pulse rounded-md bg-zinc-200/80" />
            <div className="h-2.5 w-24 animate-pulse rounded-md bg-zinc-100" />
          </div>
        </div>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-200/70" />
      </div>

      {/* Content Skeleton */}
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4 pb-24">
        {/* Search / Toolbar Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-[42px] flex-1 animate-pulse rounded-xl bg-white border border-zinc-200/70" />
          <div className="h-[42px] w-[42px] animate-pulse rounded-xl bg-white border border-zinc-200/70" />
        </div>

        <div className="h-10 w-full animate-pulse rounded-xl bg-white border border-zinc-200/70" />

        {/* Cards Skeleton */}
        <div className="space-y-3 pt-1">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-44 animate-pulse rounded-md bg-zinc-200/80" />
                  <div className="h-3 w-32 animate-pulse rounded-md bg-zinc-100" />
                </div>
                <div className="h-8 w-8 animate-pulse rounded-xl bg-zinc-100" />
              </div>
              <div className="mt-3 h-3 w-full animate-pulse rounded-md bg-zinc-100" />
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                <div className="h-2.5 w-28 animate-pulse rounded-md bg-zinc-100" />
                <div className="h-4 w-14 animate-pulse rounded-full bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
