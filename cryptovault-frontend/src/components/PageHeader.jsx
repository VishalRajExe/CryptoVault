import { motion } from 'framer-motion';

export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-4 sm:px-8 pt-8 pb-6"
    >
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-mint" />
            <span className="font-mono-tab text-xs tracking-[0.16em] uppercase text-mint">{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-muted mt-1.5 max-w-xl">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
