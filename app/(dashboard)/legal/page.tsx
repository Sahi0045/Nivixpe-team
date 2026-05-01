'use client';

import { useAuth } from '@/app/providers';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, FileText, Shield } from 'lucide-react';
import { TEAM_MEMBERS } from '@/lib/mock-data';

export default function LegalPage() {
  const { user } = useAuth();
  const legalTeamMembers = TEAM_MEMBERS.filter((m) => m.team === 'Legal');
  const legalDocuments = [
    {
      id: '1',
      title: 'Company Constitution',
      category: 'Governance',
      status: 'active',
      lastUpdated: '2025-01-15',
    },
    {
      id: '2',
      title: 'Employee Handbook',
      category: 'HR Policies',
      status: 'active',
      lastUpdated: '2025-01-10',
    },
    {
      id: '3',
      title: 'Compliance Checklist',
      category: 'Compliance',
      status: 'review',
      lastUpdated: '2025-04-28',
    },
    {
      id: '4',
      title: 'Privacy Policy',
      category: 'Data Protection',
      status: 'active',
      lastUpdated: '2024-12-01',
    },
    {
      id: '5',
      title: 'Terms of Service',
      category: 'Legal',
      status: 'active',
      lastUpdated: '2024-11-15',
    },
  ];

  const compliance = [
    {
      id: '1',
      name: 'Tax Compliance Q1',
      deadline: '2025-05-15',
      status: 'on-track',
      percentage: 75,
    },
    {
      id: '2',
      name: 'Labor Audit',
      deadline: '2025-06-30',
      status: 'pending',
      percentage: 30,
    },
    {
      id: '3',
      name: 'Data Protection Review',
      deadline: '2025-05-10',
      status: 'at-risk',
      percentage: 50,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Legal Module" subtitle="Manage legal documents, compliance, and contracts" />

      <div className="p-6 space-y-6">
        {/* CEO Notice - Legal Team Management */}
        {user?.isSuperAdmin && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Legal Team Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-red-900">
                You are the primary manager of the Legal Team. All legal operations and compliance matters report directly to you as CEO.
              </p>
              <div className="bg-white rounded border border-red-200 p-3">
                <h4 className="font-semibold text-sm text-red-700 mb-2">Legal Team Structure:</h4>
                <ul className="space-y-1 text-sm">
                  {legalTeamMembers.map((member) => (
                    <li key={member.id} className="flex justify-between">
                      <span className="text-red-900">{member.name} - {member.role}</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      
        {/* Compliance Overview */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Compliance Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {compliance.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Due: {item.deadline}</p>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-1.5 rounded text-xs font-medium ${
                        item.status === 'on-track'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status === 'on-track' && 'On Track'}
                      {item.status === 'pending' && 'Pending'}
                      {item.status === 'at-risk' && 'At Risk'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'on-track'
                          ? 'bg-green-500'
                          : item.status === 'pending'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{item.percentage}% complete</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legal Documents */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Legal Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {legalDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{doc.category}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">Updated {doc.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-1.5 rounded text-xs font-medium flex-shrink-0 ${
                      doc.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {doc.status === 'active' ? 'Active' : 'Under Review'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notices */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Important Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900">Tax Compliance Update</p>
                  <p className="text-sm text-yellow-800 mt-1">Q1 2025 tax filing deadline is approaching on May 15th.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Policy Update Available</p>
                  <p className="text-sm text-blue-800 mt-1">New employee handbook revision (v2.1) is now available for review.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
