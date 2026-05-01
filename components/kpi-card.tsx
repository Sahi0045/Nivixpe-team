'use client'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  bgColor?: 'blue' | 'green' | 'red' | 'yellow'
}

const bgColors = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  bgColor = 'blue',
}: KPICardProps) {
  return (
    <div className={`rounded-lg border ${bgColors[bgColor]} p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          {trend && trendValue && (
            <p className={`mt-2 text-sm font-medium ${
              trend === 'up' ? 'text-green-700' : trend === 'down' ? 'text-red-700' : 'text-gray-600'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </p>
          )}
        </div>
        {icon && <div className="text-3xl text-gray-400">{icon}</div>}
      </div>
    </div>
  )
}
