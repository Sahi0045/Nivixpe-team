'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROLE_PERMISSIONS } from '@/lib/rbac';
import {
  BarChart3,
  Users,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  Settings,
  LogOut,
  AlertCircle,
  Briefcase,
  Zap,
  TrendingUp,
  Truck,
  Bell,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/team-directory', label: 'Team Directory', icon: Users },
  { href: '/work-tracker', label: 'Work Tracker', icon: CheckSquare },
  { href: '/ujjwal-tracker', label: 'Ujjwal Tracker', icon: TrendingUp },
  { href: '/work-allocation', label: 'Work Allocation', icon: Truck },
  { href: '/attendance', label: 'Attendance', icon: Clock },
  { href: '/leave-management', label: 'Leave Management', icon: Calendar },
  { href: '/meetings', label: 'Meetings & MOM', icon: FileText },
  { href: '/legal', label: 'Legal Module', icon: AlertCircle },
  { href: '/proof-of-work', label: 'Proof of Work', icon: Briefcase },
  { href: '/tech-panel', label: 'Tech Panel', icon: Zap },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin', label: 'Admin Panel', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">Nivixpe</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">{user.role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            // Get page key from href (remove leading slash and after /)
            const pageKey = item.href.split('/')[1];
            
            // Check if user has permission to access this page
            const hasPermission = user.isSuperAdmin || 
              (ROLE_PERMISSIONS[user.role] && ROLE_PERMISSIONS[user.role].includes(pageKey));
            
            if (!hasPermission) return null;

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60">{user.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
