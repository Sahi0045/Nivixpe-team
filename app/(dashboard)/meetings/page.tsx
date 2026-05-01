'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function MeetingsPage() {
  // Real-time queries
  const allMeetings = useQuery(api.meetings.getAll) || [];
  
  const scheduled = allMeetings.filter((m) => m.status === 'scheduled');
  const completed = allMeetings.filter((m) => m.status === 'completed');
  const cancelled = allMeetings.filter((m) => m.status === 'cancelled');

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Meetings & Minutes" subtitle="View scheduled meetings and minutes of meetings" />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduled.length}</div>
              <p className="text-xs text-muted-foreground">upcoming meetings</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completed.length}</div>
              <p className="text-xs text-muted-foreground">with minutes available</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allMeetings.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Meetings */}
        {scheduled.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-blue-700">Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduled.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {meeting.date} at {meeting.time}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                        Scheduled
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Attendees:</p>
                      <div className="flex flex-wrap gap-1">
                        {meeting.attendees.map((attendee: string) => (
                          <span
                            key={attendee}
                            className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Meetings */}
        {completed.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-green-700">Completed Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completed.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {meeting.date} at {meeting.time}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-green-600 text-white rounded text-xs font-medium">
                        Completed
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Attendees:</p>
                      <div className="flex flex-wrap gap-1">
                        {meeting.attendees.map((attendee: string) => (
                          <span
                            key={attendee}
                            className="inline-flex px-2.5 py-1 bg-green-100 text-green-800 rounded text-xs"
                          >
                            {attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                    {meeting.minutesUrl && (
                      <div className="pt-2 border-t border-green-200">
                        <a
                          href={meeting.minutesUrl}
                          className="inline-flex items-center gap-2 text-green-700 font-medium text-sm hover:text-green-800"
                        >
                          <FileText className="w-4 h-4" />
                          View Minutes of Meeting
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
