'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/providers';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Profile Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <p className="text-sm font-medium text-foreground mt-1">{user?.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <p className="text-sm font-medium text-foreground mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <p className="text-sm font-medium text-foreground mt-1">{user?.role}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <p className="text-sm font-medium text-foreground mt-1">{user?.department}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Get notified about important updates</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Daily Digest</p>
                <p className="text-xs text-muted-foreground">Receive a summary of your daily tasks</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">Two-Factor Authentication</Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-border border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Logout</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => {
                logout();
              }}
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
