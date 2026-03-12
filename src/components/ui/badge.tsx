import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variantStyles = {
  default: 'bg-slate-700/50 text-slate-300 border-slate-600',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/10 text-red-400 border-red-500/30',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

// Loan status to badge variant mapping
export function getLoanStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    DRAFT: { variant: 'default', label: 'Draft' },
    PENDING_SIGNATURES: { variant: 'warning', label: 'Pending Signatures' },
    ACTIVE: { variant: 'success', label: 'Active' },
    COMPLETED: { variant: 'info', label: 'Completed' },
    DEFAULTED: { variant: 'danger', label: 'Defaulted' },
    CANCELLED: { variant: 'default', label: 'Cancelled' },
  }
  return map[status] || { variant: 'default' as const, label: status }
}

// Payment status to badge variant mapping
export function getPaymentStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    UPCOMING: { variant: 'default', label: 'Upcoming' },
    DUE: { variant: 'warning', label: 'Due' },
    PAID: { variant: 'success', label: 'Paid' },
    LATE: { variant: 'danger', label: 'Late' },
    MISSED: { variant: 'danger', label: 'Missed' },
  }
  return map[status] || { variant: 'default' as const, label: status }
}
