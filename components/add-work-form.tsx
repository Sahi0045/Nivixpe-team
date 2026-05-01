'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEAM_MEMBERS } from '@/lib/mock-data';

interface AddWorkFormProps {
  onAddWork: (work: {
    title: string;
    assignee: string;
    assigneeRole: string;
    priority: string;
    dueDate: string;
    description: string;
  }) => void;
}

export function AddWorkForm({ onAddWork }: AddWorkFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    assigneeId: '',
    priority: 'medium',
    dueDate: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedMember = TEAM_MEMBERS.find((m) => m.id === formData.assigneeId);
    
    if (!selectedMember || !formData.title || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    onAddWork({
      title: formData.title,
      assignee: selectedMember.name,
      assigneeRole: selectedMember.role,
      priority: formData.priority,
      dueDate: formData.dueDate,
      description: formData.description,
    });

    // Reset form
    setFormData({
      title: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
      description: '',
    });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Assign New Work to Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Work Title *
              </label>
              <Input
                type="text"
                placeholder="e.g., Q2 Product Launch Planning"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Assign To Team Member *
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                required
              >
                <option value="">Select team member</option>
                {TEAM_MEMBERS.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Date *
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              placeholder="Detailed description of the work..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-24"
            />
          </div>

          <Button type="submit" className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
            Add Work Assignment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
