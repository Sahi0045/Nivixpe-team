'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle, AlertCircle, Clock, Users, FileText } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'task',
    title: 'New task assigned',
    message: 'You have been assigned "Q2 Planning" by Aditya Kumar',
    time: '2 hours ago',
    read: false,
    icon: FileText,
  },
  {
    id: 2,
    type: 'attendance',
    title: 'Late arrival today',
    message: 'You logged in at 9:45 AM, marking you as late',
    time: '4 hours ago',
    read: false,
    icon: AlertCircle,
  },
  {
    id: 3,
    type: 'leave',
    title: 'Leave request approved',
    message: 'Your leave request for May 5-7 has been approved',
    time: '1 day ago',
    read: true,
    icon: CheckCircle,
  },
  {
    id: 4,
    type: 'meeting',
    title: 'Meeting scheduled',
    message: 'Team sync meeting scheduled for tomorrow at 2:00 PM',
    time: '2 days ago',
    read: true,
    icon: Users,
  },
  {
    id: 5,
    type: 'task',
    title: 'Task deadline approaching',
    message: '"API Integration" is due in 1 day',
    time: '2 days ago',
    read: true,
    icon: Clock,
  },
  {
    id: 6,
    type: 'system',
    title: 'System maintenance',
    message: 'System maintenance scheduled for May 10th from 2-4 AM',
    time: '3 days ago',
    read: true,
    icon: Bell,
  },
];

export default function NotificationsPage() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title="Notifications" 
        subtitle={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Unread Notifications */}
        {unreadCount > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Unread</h3>
              <button className="text-xs text-primary hover:underline">Mark all as read</button>
            </div>

            {notifications
              .filter((n) => !n.read)
              .map((notification) => {
                const Icon = notification.icon;
                return (
                  <Card key={notification.id} className="border-l-4 border-l-blue-500 border-border">
                    <CardContent className="p-4 flex gap-4">
                      <div className="flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        className="flex-shrink-0 w-4 h-4 mt-1"
                      />
                    </CardContent>
                  </Card>
                );
              })}
          </>
        )}

        {/* Read Notifications */}
        {notifications.filter((n) => n.read).length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Earlier</h3>
            </div>

            {notifications
              .filter((n) => n.read)
              .map((notification) => {
                const Icon = notification.icon;
                return (
                  <Card key={notification.id} className="border-border opacity-75">
                    <CardContent className="p-4 flex gap-4">
                      <div className="flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
}
