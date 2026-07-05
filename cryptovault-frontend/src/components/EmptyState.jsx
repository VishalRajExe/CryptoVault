import { motion } from 'framer-motion';
import { Inbox, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Reusable empty state component with icon, message, and optional CTA.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  actionTo,
  onAction,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
        <Icon size={26} className="text-ink-faint" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-base font-semibold text-ink mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted max-w-xs leading-relaxed">{description}</p>
      )}
      {(actionLabel && actionTo) && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint-sm hover:bg-mint-400 transition-all hover:shadow-mint"
        >
          {actionLabel}
          <ArrowRight size={14} />
        </Link>
      )}
      {(actionLabel && onAction && !actionTo) && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint-sm hover:bg-mint-400 transition-all hover:shadow-mint"
        >
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      )}
    </motion.div>
  );
}
