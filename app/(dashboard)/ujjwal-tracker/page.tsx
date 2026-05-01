'use client'

import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WORK_TASKS } from '@/lib/mock-data'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function UjjwalTrackerPage() {
  // Filter tasks assigned to Ujjwal
  const ujjwalTasks = WORK_TASKS.filter((t) => t.assignee === 'Ujjwal')
  const completed = ujjwalTasks.filter((t) => t.status === 'completed')
  const ongoing = ujjwalTasks.filter((t) => t.status === 'ongoing')
  const missed = ujjwalTasks.filter((t) => t.status === 'missed')

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Ujjwal Work Tracker" subtitle="Deputy CSO - Business development and analysis tracking" />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completed.length}</div>
              <p className="text-xs text-muted-foreground">tasks completed</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ongoing.length}</div>
              <p className="text-xs text-muted-foreground">in progress</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{missed.length}</div>
              <p className="text-xs text-muted-foreground">overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Ujjwal Work Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Ujjwal Work Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Work Allotted</th>
                    <th className="text-left p-3 font-medium">Current Status</th>
                    <th className="text-left p-3 font-medium">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {ujjwalTasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <p className="font-medium">{task.title}</p>
                        {task.dueDate && task.dueDate !== 'Ongoing' && (
                          <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-3 py-1 rounded text-xs font-medium ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'ongoing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                        {task.completedDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {task.completedDate}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{task.comments}</p>
                        {task.coordinationWith && (
                          <p className="text-xs text-muted-foreground mt-1">
                            In coordination with: {task.coordinationWith}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {ujjwalTasks.length === 0 && (
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No tasks assigned to Ujjwal</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
