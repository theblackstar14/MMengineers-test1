export default function ReportesLoading() {
  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <div
            className="h-7 w-64 rounded-lg animate-pulse"
            style={{ backgroundColor: '#1E293B' }}
          />
          <div
            className="h-4 w-48 rounded-lg animate-pulse"
            style={{ backgroundColor: '#1E293B' }}
          />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-8 w-24 rounded-lg animate-pulse"
              style={{ backgroundColor: '#1E293B' }}
            />
          ))}
        </div>
      </div>

      {/* 3×3 grid skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border"
            style={{ backgroundColor: '#0B0F1A', borderColor: '#1E293B' }}
          />
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="flex justify-between mt-2">
        <div
          className="h-3 w-72 rounded animate-pulse"
          style={{ backgroundColor: '#1E293B' }}
        />
        <div
          className="h-3 w-32 rounded animate-pulse"
          style={{ backgroundColor: '#1E293B' }}
        />
      </div>
    </div>
  )
}
