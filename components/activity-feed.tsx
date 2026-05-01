'use client'

interface ActivityItem {
  id: string
  user: string
  action: string
  timestamp: string
  icon?: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  title?: string
}

export function ActivityFeed({ activities, title = 'Recent Activity' }: ActivityFeedProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No activities yet</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="mt-1 flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-600">
                  {activity.icon || '•'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.user}
                  <span className="font-normal text-gray-600 ml-1">{activity.action}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
