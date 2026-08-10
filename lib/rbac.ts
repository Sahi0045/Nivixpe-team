import { User } from './auth';
import { normalizeName, normalizeEmail } from './utils';


// Role-based access control for features and pages
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'CEO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'legal',
    'proof-of-work',
    'drive',
    'tech-panel',
    'notifications',
    'settings',
    'admin',
  ],
  'CTO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'tech-panel',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
    'admin',
  ],
  'CSO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'CMO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'DCSO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'DCMO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'COO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'tech-panel',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
    'admin',
  ],
  'Legal': [
    'dashboard',
    'team-directory',
    'legal',
    'meetings',
    'attendance',
    'attendance-history',
    'leave-management',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'Legal Intern': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'legal',
    'meetings',
    'attendance',
    'attendance-history',
    'leave-management',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'Product Manager': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'legal',
    'proof-of-work',
    'drive',
    'tech-panel',
    'notifications',
    'settings',
    'admin',
  ],
  'Designer': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'Developer 1': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'Developer 2': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'Developer 3': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
};

const DEFAULT_EMPLOYEE_PAGES = [
  'dashboard',
  'team-directory',
  'work-tracker',
  'work-allocation',
  'attendance',
  'attendance-history',
  'leave-management',
  'meetings',
  'proof-of-work',
  'drive',
  'notifications',
  'settings',
];

export function canAccessPage(user: User | null, page: string): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true; // CEO has access to everything
  const permissions = ROLE_PERMISSIONS[user.role] || DEFAULT_EMPLOYEE_PAGES;
  return permissions.includes(page);
}


export function canEditTeamData(user: User | null): boolean {
  if (!user) return false;
  return user.isSuperAdmin || user.accessLevel === 'manager';
}

export function canAssignTasks(user: User | null): boolean {
  if (!user) return false;
  // CEO, CTO, and all managers/admins can assign tasks
  return user.isSuperAdmin || user.role === 'CTO' || user.accessLevel === 'manager' || user.accessLevel === 'admin';
}

export function canApprovePoW(user: User | null): boolean {
  if (!user) return false;
  // CEO (SuperAdmin), CTO, COO, or Product Manager can approve Proof of Work
  return user.isSuperAdmin || user.role === 'CTO' || user.role === 'COO' || user.role === 'Product Manager';
}

export function canAssignTasksTo(user: User | null, targetMember: any): boolean {
  if (!user) return false;
  
  // CEO can assign to anyone
  if (user.isSuperAdmin) return true;
  
  // CTO can assign to anyone
  if (user.role === 'CTO') return true;
  
  // CSO (Swaraag) can assign to Business team
  if (user.role === 'CSO' && targetMember.team === 'Business') return true;
  
  // CMO (Abhiram) can assign to Marketing and Design teams
  if (user.role === 'CMO' && (targetMember.team === 'Marketing' || targetMember.team === 'Design')) return true;
  
  // DCMO (Bhavika) can assign to Marketing team
  if (user.role === 'DCMO' && targetMember.team === 'Marketing') return true;
  
  // COO can assign to all teams
  if (user.role === 'COO') return true;
  
  // Legal head can assign to Legal team
  if (user.role === 'Legal' && targetMember.team === 'Legal') return true;
  
  return false;
}

export function getAssignableMembers(user: User | null, allMembers: any[]): any[] {
  if (!user) return [];
  const activeMembers = allMembers.filter(m => m.status !== 'inactive');
  
  // CEO can assign to anyone
  if (user.isSuperAdmin) return activeMembers;
  
  // CTO can assign to anyone
  if (user.role === 'CTO') return activeMembers;
  
  // Product Manager can assign to all teams
  if (user.role === 'Product Manager') return activeMembers;

  // CSO can assign to Business team
  if (user.role === 'CSO') {
    return activeMembers.filter(m => m.team === 'Business');
  }

  // DCSO can assign to Business team
  if (user.role === 'DCSO') {
    return activeMembers.filter(m => m.team === 'Business');
  }
  
  // CMO can assign to Marketing and Design teams
  if (user.role === 'CMO') {
    return activeMembers.filter(m => m.team === 'Marketing' || m.team === 'Design');
  }
  
  // DCMO can assign to Marketing team
  if (user.role === 'DCMO') {
    return activeMembers.filter(m => m.team === 'Marketing');
  }
  
  // COO can assign to all teams
  if (user.role === 'COO') {
    return activeMembers;
  }
  
  // Legal can assign to Legal team
  if (user.role === 'Legal') {
    return activeMembers.filter(m => m.team === 'Legal');
  }
  
  return [];
}

export function canViewAllTasks(user: User | null): boolean {
  if (!user) return false;
  // CEO, CTO, COO and Product Manager can view all tasks
  return user.isSuperAdmin || user.role === 'CTO' || user.role === 'COO' || user.role === 'Product Manager';
}

export function canViewTeamTasks(user: User | null, taskAssignee: string, allMembers: any[]): boolean {
  if (!user) return false;
  
  // CEO and CTO can view all
  if (user.isSuperAdmin || user.role === 'CTO' || user.role === 'Admin' || user.accessLevel === 'admin') return true;
  
  // User can view their own tasks
  const normUser = normalizeName(user.name);
  const normAssignee = normalizeName(taskAssignee);
  if (normUser === normAssignee) return true;
  if (user.email && taskAssignee && normalizeEmail(user.email) === normalizeEmail(taskAssignee)) return true;

  
  // Find the assignee's team
  const assigneeMember = allMembers.find(m => m.name === taskAssignee);
  if (!assigneeMember) return false;
  
  // Product Manager can view all tasks
  if (user.role === 'Product Manager') return true;

  // Team heads can view their team's tasks
  if (user.role === 'CSO' && assigneeMember.team === 'Business') return true;
  if (user.role === 'DCSO' && assigneeMember.team === 'Business') return true;
  if (user.role === 'CMO' && (assigneeMember.team === 'Marketing' || assigneeMember.team === 'Design')) return true;
  if (user.role === 'DCMO' && assigneeMember.team === 'Marketing') return true;
  if (user.role === 'COO') return true; // COO can view all teams' tasks
  if (user.role === 'Legal' && assigneeMember.team === 'Legal') return true;
  
  return false;
}

export function getVisibleTasks(user: User | null, allTasks: any[], allMembers: any[]): any[] {
  if (!user) return [];
  
  // CEO, CTO, and COO see all tasks
  if (user.isSuperAdmin || user.role === 'CTO' || user.role === 'COO') return allTasks;
  
  // Filter tasks based on what user can view
  return allTasks.filter(task => canViewTeamTasks(user, task.assignee, allMembers));
}

export function isAdmin(user: User | null): boolean {
  return user?.isSuperAdmin === true;
}

export function isManager(user: User | null): boolean {
  return user?.accessLevel === 'manager' || user?.isSuperAdmin === true;
}

export function getTeamMembers(user: User | null, allMembers: any[]): any[] {
  if (!user) return [];
  const activeMembers = allMembers.filter(m => m.status !== 'inactive');
  
  if (user.isSuperAdmin) return activeMembers; // CEO sees all
  if (user.role === 'CTO') return activeMembers; // CTO sees all
  if (user.role === 'COO') return activeMembers; // COO sees all
  if (user.role === 'Product Manager') return activeMembers; // PM sees all
  if (user.role === 'CSO') {
    return activeMembers.filter((m) => m.team === 'Business');
  }
  if (user.role === 'Legal') {
    return activeMembers.filter((m) => m.team === 'Legal');
  }
  if (user.role === 'CMO') {
    return activeMembers.filter((m) => m.team === 'Marketing' || m.team === 'Design');
  }
  return activeMembers;
}

export function getTeamForUser(user: User | null): string {
  if (!user) return 'Unknown';
  if (user.isSuperAdmin) return 'All Teams';
  return user.team || 'No Team';
}

export function canAccessAdminPanel(user: User | null): boolean {
  if (!user) return false;
  return user.isSuperAdmin || user.role === 'CTO' || user.role === 'COO' || user.role === 'Product Manager';
}

export function canDeleteAllocatedTask(user: User | null, task?: any): boolean {
  if (!user) return false;
  
  const allowedRoles = [
    'CEO',
    'Admin',
    'CTO',
    'COO',
    'CSO',
    'Product Manager',
    'Project Manager',
  ];
  
  if (
    user.isSuperAdmin ||
    user.accessLevel === 'admin' ||
    user.accessLevel === 'manager' ||
    allowedRoles.includes(user.role)
  ) {
    return true;
  }
  
  if (!task || !task.createdBy) return false;

  const deleterRoles = ['CMO', 'DCMO', 'DCSO'];
  const hasRole = deleterRoles.includes(user.role);
  if (!hasRole) return false;
  return task.createdBy === user.name;
}


export function canManageTeamMembers(user: User | null): boolean {
  if (!user) return false;
  return (
    user.isSuperAdmin === true ||
    user.role === 'CEO' ||
    user.role === 'Admin' ||
    user.role === 'CTO' ||
    user.role === 'COO' ||
    user.accessLevel === 'admin'
  );
}

