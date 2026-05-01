'use client'

import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Clock, Server } from 'lucide-react'

export default function TechPanelPage() {
  const systems = [
    {
      id: '1',
      name: 'API Server',
      status: 'healthy',
      uptime: '99.98%',
      responseTime: '45ms',
      lastChecked: '2 minutes ago',
    },
    {
      id: '2',
      name: 'Database',
      status: 'healthy',
      uptime: '99.99%',
      responseTime: '120ms',
      lastChecked: '1 minute ago',
    },
    {
      id: '3',
      name: 'Cache Layer',
      status: 'healthy',
      uptime: '99.95%',
      responseTime: '5ms',
      lastChecked: '3 minutes ago',
    },
    {
      id: '4',
      name: 'Search Index',
      status: 'degraded',
      uptime: '98.5%',
      responseTime: '850ms',
      lastChecked: '1 minute ago',
    },
    {
      id: '5',
      name: 'Email Service',
      status: 'healthy',
      uptime: '99.8%',
      responseTime: '200ms',
      lastChecked: '5 minutes ago',
    },
    {
      id: '6',
      name: 'File Storage',
      status: 'healthy',
      uptime: '99.99%',
      responseTime: '300ms',
      lastChecked: '2 minutes ago',
    },
  ]

  const deployments = [
    {
      id: '1',
      version: 'v2.1.0',
      service: 'API',
      status: 'completed',
      timestamp: '2 hours ago',
      author: 'CTO',
    },
    {
      id: '2',
      version: 'v1.5.2',
      service: 'Frontend',
      status: 'in-progress',
      timestamp: 'Currently deploying',
      author: 'DevOps',
    },
    {
      id: '3',
      version: 'v3.0.1',
      service: 'Workers',
      status: 'completed',
      timestamp: '5 hours ago',
      author: 'CTO',
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Tech Panel" subtitle="System health and deployment monitoring" />

      <div className="p-6 space-y-6">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Systems</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systems.filter((s) => s.status === 'healthy').length}</div>
              <p className="text-xs text-muted-foreground">of {systems.length} total</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Degraded Systems</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systems.filter((s) => s.status === 'degraded').length}</div>
              <p className="text-xs text-muted-foreground">requires attention</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Uptime</CardTitle>
              <Server className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.61%</div>
              <p className="text-xs text-muted-foreground">across all systems</p>
            </CardContent>
          </Card>
        </div>

        {/* System Status Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">System</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Uptime</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Response Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {systems.map((system) => (
                    <tr key={system.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{system.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            system.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {system.status === 'healthy' ? 'Healthy' : 'Degraded'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{system.uptime}</td>
                      <td className="px-4 py-3 text-gray-600">{system.responseTime}</td>
                      <td className="px-4 py-3 text-gray-600">{system.lastChecked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deployments */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{deployment.version}</p>
                    <p className="text-xs text-muted-foreground mt-1">Service: {deployment.service}</p>
                    <p className="text-xs text-muted-foreground">Deployed by: {deployment.author}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium mb-2 ${
                        deployment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {deployment.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                    <p className="text-xs text-muted-foreground">{deployment.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
