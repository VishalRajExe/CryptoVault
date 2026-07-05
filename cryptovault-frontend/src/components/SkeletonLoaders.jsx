import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════
   SKELETON LOADERS — Premium shimmer variants
   ═══════════════════════════════════════════ */

function SkeletonBase({ className = '', style }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return <SkeletonBase className={`rounded ${className}`} style={{ width, height }} />;
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return <SkeletonBase className={`rounded-full shrink-0 ${className}`} style={{ width: size, height: size }} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl glass-card p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size={36} />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="60%" height={12} />
          <SkeletonLine width="40%" height={10} />
        </div>
      </div>
      <SkeletonLine width="80%" height={28} />
      <SkeletonLine width="50%" height={12} />
    </div>
  );
}

export function SkeletonStatCard({ className = '' }) {
  return (
    <div className={`rounded-2xl glass-card p-6 ${className}`}>
      <SkeletonCircle size={36} className="mb-4" />
      <SkeletonLine width="50%" height={10} className="mb-3" />
      <SkeletonLine width="70%" height={28} className="mb-2" />
      <SkeletonLine width="40%" height={10} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`rounded-2xl glass-card overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <SkeletonLine width="120px" height={14} />
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3.5">
            <SkeletonCircle size={32} />
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <SkeletonLine
                key={j}
                width={`${50 + Math.random() * 30}%`}
                height={12}
                className="flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ height = 200, className = '' }) {
  return (
    <div className={`rounded-2xl glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-2">
          <SkeletonLine width="100px" height={14} />
          <SkeletonLine width="60px" height={10} />
        </div>
        <SkeletonLine width="80px" height={14} />
      </div>
      <SkeletonBase className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-16"
    >
      {/* Header skeleton */}
      <div className="px-4 sm:px-8 pt-8 pb-6">
        <SkeletonLine width="60px" height={10} className="mb-3" />
        <SkeletonLine width="200px" height={28} className="mb-2" />
        <SkeletonLine width="300px" height={12} />
      </div>

      <div className="px-4 sm:px-8 space-y-6">
        {/* Stat cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* Chart */}
        <SkeletonChart height={220} />

        {/* Table */}
        <SkeletonTable rows={4} cols={4} />
      </div>
    </motion.div>
  );
}
