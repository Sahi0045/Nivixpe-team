'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/providers';
import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Real-time queries
  const todayAttendance = useQuery(api.attendanceRecords.getByDate, { date: today }) || [];
  const myAttendance = todayAttendance.find(a => a.email === user?.email);
  
  // Mutations
  const markAttendance = useMutation(api.attendanceRecords.create);
  const updateAttendance = useMutation(api.attendanceRecords.update);
  
  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;
  const absentCount = 10 - todayAttendance.length; // Total members - marked attendance
  const onLeaveCount = todayAttendance.filter((a) => a.status === 'onLeave').length;

  const handleMarkLogin = async () => {
    if (!user) return;
    
    const now = new Date();
    const loginTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Determine status: late if after 09:00
    const isLate = hour > 9 || (hour === 9 && minute > 0);
    const status = isLate ? 'late' : 'present';
    
    try {
      await markAttendance({
        date: today,
        email: user.email,
        loginTime: loginTime,
        status: status,
      });
      alert(`Attendance marked successfully! Status: ${status === 'late' ? 'Late' : 'On Time'}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };
  
  const handleMarkLogout = async () => {
    if (!user || !myAttendance) return;
    
    const now = new Date();
    const logoutTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    try {
      await updateAttendance({
        id: myAttendance._id,
        logoutTime: logoutTime,
      });
      alert('Logout time recorded successfully!');
    } catch (error) {
      console.error('Error marking logout:', error);
      alert('Failed to mark logout. Please try again.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Attendance" subtitle="Daily attendance tracking for team members" />

      <div className="p-6 space-y-6">
        {/* Current Time and Date */}
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              Today's Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-blue-700 mt-1">Current Time: {currentTime}</p>
              </div>
              {user && (
                <div className="flex gap-2">
                  {!myAttendance ? (
                    <button
                      onClick={handleMarkLogin}
                      className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Login
                    </button>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-green-100 text-green-800 rounded font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Logged In: {myAttendance.loginTime}
                      </div>
                      {!myAttendance.logoutTime && (
                        <button
                          onClick={handleMarkLogout}
                          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Mark Logout
                        </button>
                      )}
                      {myAttendance.logoutTime && (
                        <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Logged Out: {myAttendance.logoutTime}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rules */}
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Attendance Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-900 space-y-1">
            <p>• Login before 09:00 AM to be marked as "Present"</p>
            <p>• Login after 09:00 AM will be marked as "Late"</p>
            <p>• You can only mark attendance for TODAY (current date)</p>
            <p>• Work report submission deadline: 09:45 AM</p>
            <p>• Mark logout when leaving for the day</p>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentCount}</div>
              <p className="text-xs text-muted-foreground">on time</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lateCount}</div>
              <p className="text-xs text-muted-foreground">after 9:00 AM</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onLeaveCount}</div>
              <p className="text-xs text-muted-foreground">approved leave</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Marked</CardTitle>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absentCount}</div>
              <p className="text-xs text-muted-foreground">yet to mark</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Today&apos;s Attendance - {today}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Login Time</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Logout Time</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.length > 0 ? (
                    todayAttendance.map((record) => (
                      <tr key={record._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">{record.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium ${
                              record.status === 'present'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : record.status === 'onLeave'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {record.status === 'onLeave' ? 'On Leave' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{record.loginTime || '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{record.logoutTime || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        No attendance marked yet for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
