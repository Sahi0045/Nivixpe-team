# Admin Panel - Complete Guide

## Overview
The Admin Panel is the CEO's (Sahith's) exclusive control center for managing all team work assignments and tracking organizational tasks.

## Features

### 1. **Dashboard Overview**
- Display all team members and their work assignments
- Statistics: Total Tasks, Completed, Ongoing, Missed, By Priority
- Team breakdown showing Business Team, Legal Team, and other departments

### 2. **Add New Work**
The CEO can quickly add new work items for any team member with:
- **Task Title** - Name of the work/project
- **Assign To** - Select any team member from dropdown
- **Priority** - Set as Low, Medium, or High
- **Due Date** - Set deadline for the task
- **Description** - Additional details about the task
- **Submit Button** - Add work to the system

### 3. **Team Work Overview Table**
View all assigned work organized by:
- Team Member Name & Role
- Task Title
- Due Date
- Priority Level (color-coded: Red=High, Yellow=Medium, Green=Low)
- Status (Completed, Ongoing, Missed)
- Edit/Delete options (expandable)

### 4. **Real-time Management**
- Filter work by team member
- Sort by status, priority, or due date
- Quick view of who has what work assigned
- Easy identification of overdue or missed tasks

## Access Control
- **Only CEO (Sahith)** has access to Admin Panel
- Other roles attempting access are redirected to Dashboard
- Role-based access controlled via RBAC system

## How to Use

### Adding Work
1. Navigate to Admin Panel from sidebar
2. Scroll to "Add New Work" section
3. Fill in task details:
   - Select team member from "Assign to" dropdown
   - Enter task title (required)
   - Choose priority level
   - Select due date (required)
   - Add optional description
4. Click "Add Work"
5. New work appears in the Team Work Overview table

### Viewing Team Work
1. Admin panel loads with all current work assignments
2. See complete breakdown by:
   - Individual team members
   - Their assigned tasks
   - Task status and deadlines
   - Priority levels

### Key Statistics
- **Total Tasks**: All work items in the system
- **Completed**: Finished work
- **Ongoing**: In-progress work
- **Missed**: Overdue work needing attention
- **By Priority**: Distribution of high/medium/low priority tasks

## Team Structure Visibility

### Business Team (Led by Swaragg)
- Sahith (CEO)
- Swaragg (Business Head)
- Vikram Singh (CSO)
- Akshay Kumar (Sales Executive)
- Priya Sharma (COO)

### Legal Team (Led by Rohan Verma)
- Rohan Verma (Legal Head) - Reports to CEO
- Swaragg Legal (Legal Counsel)

### Other Departments
- Raj Patel (CTO) - Technology
- Ananya Gupta (CMO) - Marketing
- Neha Desai (Design Lead) - Design
- Kavya Sharma (Marketing Manager) - Marketing

## Best Practices

1. **Clear Task Titles** - Use descriptive titles for easy identification
2. **Realistic Due Dates** - Set achievable deadlines for team members
3. **Priority Management** - Use High only for critical tasks
4. **Regular Review** - Check Admin Panel daily for missed or overdue work
5. **Description Details** - Add context in description for team clarity

## Integration with Other Modules

- **Work Tracker**: Displays all assigned work from Admin Panel
- **Team Directory**: Shows team member details and assignment information
- **Work Allocation**: Integrated with work distribution system
- **Dashboard**: CEO dashboard shows overview stats from Admin work data
- **Attendance**: Combined view of who is assigned what work

## Technical Details

**Components:**
- `AddWorkForm` - Form for creating new work items
- `TeamWorkOverview` - Table displaying all work assignments
- `AdminPage` - Main admin panel page

**Files:**
- `/app/(dashboard)/admin/page.tsx` - Admin panel page
- `/components/add-work-form.tsx` - Work creation form component
- `/components/team-work-overview.tsx` - Work display component
- `/lib/rbac.ts` - Role-based access control (admin permission for CEO)

**Data Source:**
- Uses TEAM_MEMBERS from mock-data for team listing
- Uses WORK_TASKS for tracking assignments
- State management with React hooks for real-time updates

## Login Access
- **Email**: ceo@nivixpe.com
- **Password**: ceo123
- **Role**: CEO (Super Admin)
- **Access**: Full Admin Panel permissions

---
Last Updated: 2025-05-02
Version: 1.0
