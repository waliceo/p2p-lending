'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Something went wrong loading the dashboard.</p>
      </div>
      <div className="glass rounded-2xl p-6 border border-red-500/30">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Error Details</h2>
        <p className="text-sm text-slate-400 mb-1">
          {error.message || 'An unknown error occurred'}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-500 font-mono mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
