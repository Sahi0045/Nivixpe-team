'use client'

type StatusType = 'completed' | 'ongoing' | 'missed' | 'pending' | 'approved' | 'rejected'

interface StatusBadgeProps {
  status: StatusType
  label: string
}

const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  ongoing: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  missed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = statusColors[status]
  
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {label}
    </span>
  )
}
