"use client";

/** Shared skeleton while a lazy view chunk loads */
export function ViewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="shimmer h-9 w-56 rounded-lg" />
      <div className="shimmer mt-4 h-5 w-80 max-w-full rounded-lg" />
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shimmer h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
