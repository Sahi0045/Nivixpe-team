export type UserRole = 'CEO' | 'CTO' | 'COO' | 'CSO' | 'CMO' | 'DCSO' | 'DCMO' | 'Legal' | 'Legal Intern' | 'Designer' | 'Admin' | 'Developer 1' | 'Developer 2' | 'Developer 3' | 'Product Manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  team?: 'Business' | 'Legal' | 'Technical' | 'Marketing' | 'Design' | 'HR';
  isSuperAdmin?: boolean;
  accessLevel?: 'admin' | 'manager' | 'employee';
  avatar?: string;
  joinDate: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Mock users for demo & fallback authentication
export const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'sahith@nivixpe.com': {
    password: 'ceo123',
    user: {
      id: '1',
      email: 'sahith@nivixpe.com',
      name: 'Sahith',
      role: 'CEO',
      department: 'Executive',
      team: 'Business',
      isSuperAdmin: true,
      accessLevel: 'admin',
      joinDate: '2020-01-15',
    },
  },
  'ceo@nivixpe.com': {
    password: 'ceo123',
    user: {
      id: '1',
      email: 'sahith@nivixpe.com',
      name: 'Sahith',
      role: 'CEO',
      department: 'Executive',
      team: 'Business',
      isSuperAdmin: true,
      accessLevel: 'admin',
      joinDate: '2020-01-15',
    },
  },
  'shubhamc@nivixpe.com': {
    password: 'cto123',
    user: {
      id: '2',
      email: 'shubhamc@nivixpe.com',
      name: 'Co-founder,CTO',
      role: 'CTO',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'admin',
      joinDate: '2020-02-01',
    },
  },
  'cto@nivixpe.com': {
    password: 'cto123',
    user: {
      id: '2',
      email: 'shubhamc@nivixpe.com',
      name: 'Co-founder,CTO',
      role: 'CTO',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'admin',
      joinDate: '2020-02-01',
    },
  },
  'swaraag@nivixpe.com': {
    password: 'cso123',
    user: {
      id: '3',
      email: 'swaraag@nivixpe.com',
      name: 'Swaraag Shrey Nambala',
      role: 'CSO',
      department: 'Sales & Strategy',
      team: 'Business',
      accessLevel: 'manager',
      joinDate: '2020-03-10',
    },
  },
  'cso@nivixpe.com': {
    password: 'cso123',
    user: {
      id: '3',
      email: 'swaraag@nivixpe.com',
      name: 'Swaraag Shrey Nambala',
      role: 'CSO',
      department: 'Sales & Strategy',
      team: 'Business',
      accessLevel: 'manager',
      joinDate: '2020-03-10',
    },
  },
  'ujjwal@nivixpe.com': {
    password: 'dcso123',
    user: {
      id: '4',
      email: 'ujjwal@nivixpe.com',
      name: 'Ujjwal',
      role: 'DCSO',
      department: 'Deputy Sales & Strategy',
      team: 'Business',
      accessLevel: 'manager',
      joinDate: '2021-01-20',
    },
  },
  'dcso@nivixpe.com': {
    password: 'dcso123',
    user: {
      id: '4',
      email: 'ujjwal@nivixpe.com',
      name: 'Ujjwal',
      role: 'DCSO',
      department: 'Deputy Sales & Strategy',
      team: 'Business',
      accessLevel: 'manager',
      joinDate: '2021-01-20',
    },
  },
  'n-wkw@nivixpe.com': {
    password: 'dcmo123',
    user: {
      id: '5',
      email: 'N-wkw@nivixpe.com',
      name: 'Bhavika',
      role: 'DCMO',
      department: 'Deputy Marketing',
      team: 'Marketing',
      accessLevel: 'manager',
      joinDate: '2021-02-10',
    },
  },
  'bhavika@nivixpe.com': {
    password: 'dcmo123',
    user: {
      id: '5',
      email: 'N-wkw@nivixpe.com',
      name: 'Bhavika',
      role: 'DCMO',
      department: 'Deputy Marketing',
      team: 'Marketing',
      accessLevel: 'manager',
      joinDate: '2021-02-10',
    },
  },
  'bhavikad@nivixpe.com': {
    password: 'dcmo123',
    user: {
      id: '5',
      email: 'N-wkw@nivixpe.com',
      name: 'Bhavika',
      role: 'DCMO',
      department: 'Deputy Marketing',
      team: 'Marketing',
      accessLevel: 'manager',
      joinDate: '2021-02-10',
    },
  },
  'siddharatha@nivixpe.com': {
    password: 'coo123',
    user: {
      id: '6',
      email: 'siddharatha@nivixpe.com',
      name: 'Siddharatha',
      role: 'COO',
      department: 'Operations',
      team: 'Business',
      accessLevel: 'admin',
      joinDate: '2020-05-01',
    },
  },
  'coo@nivixpe.com': {
    password: 'coo123',
    user: {
      id: '6',
      email: 'siddharatha@nivixpe.com',
      name: 'Siddharatha',
      role: 'COO',
      department: 'Operations',
      team: 'Business',
      accessLevel: 'admin',
      joinDate: '2020-05-01',
    },
  },
  'kashish@nivixpe.com': {
    password: 'legal1123',
    user: {
      id: '7',
      email: 'kashish@nivixpe.com',
      name: 'Kashish',
      role: 'Legal',
      department: 'Legal & Compliance',
      team: 'Legal',
      accessLevel: 'manager',
      joinDate: '2020-08-01',
    },
  },
  'legal1@nivixpe.com': {
    password: 'legal1123',
    user: {
      id: '7',
      email: 'kashish@nivixpe.com',
      name: 'Kashish',
      role: 'Legal',
      department: 'Legal & Compliance',
      team: 'Legal',
      accessLevel: 'manager',
      joinDate: '2020-08-01',
    },
  },
  'nguyen@nivixpe.com': {
    password: 'dev123',
    user: {
      id: '8',
      email: 'nguyen@nivixpe.com',
      name: 'Ngan Nguyen',
      role: 'Developer 1',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'employee',
      joinDate: '2025-05-01',
    },
  },
  'developer1@nivixpe.com': {
    password: 'dev123',
    user: {
      id: '8',
      email: 'nguyen@nivixpe.com',
      name: 'Ngan Nguyen',
      role: 'Developer 1',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'employee',
      joinDate: '2025-05-01',
    },
  },
  'vinisha@nivixpe.com': {
    password: 'legal2123',
    user: {
      id: '9',
      email: 'vinisha@nivixpe.com',
      name: 'Vinisha',
      role: 'Legal Intern',
      department: 'Legal & Compliance',
      team: 'Legal',
      accessLevel: 'employee',
      joinDate: '2025-05-15',
    },
  },
  'legal2@nivixpe.com': {
    password: 'legal2123',
    user: {
      id: '9',
      email: 'vinisha@nivixpe.com',
      name: 'Vinisha',
      role: 'Legal Intern',
      department: 'Legal & Compliance',
      team: 'Legal',
      accessLevel: 'employee',
      joinDate: '2025-05-15',
    },
  },
  'aryan@nivixpe.com': {
    password: 'pm123',
    user: {
      id: '10',
      email: 'aryan@nivixpe.com',
      name: 'Aryan Kulshreshtra',
      role: 'Product Manager',
      department: 'HR',
      team: 'HR',
      accessLevel: 'manager',
      joinDate: '2025-05-02',
    },
  },
  'adya@nivixpe.com': {
    password: 'product123',
    user: {
      id: '11',
      email: 'adya@nivixpe.com',
      name: 'Adya Paliwal',
      role: 'Product Manager',
      department: 'Product',
      team: 'Business',
      isSuperAdmin: true,
      accessLevel: 'admin',
      joinDate: '2025-07-25',
    },
  },
  'nithin@nivixpe.com': {
    password: 'dev123',
    user: {
      id: '12',
      email: 'nithin@nivixpe.com',
      name: 'Nithin',
      role: 'Developer 3',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'employee',
      joinDate: '2025-05-01',
    },
  },
  'shubham@nivixpe.com': {
    password: 'dev123',
    user: {
      id: '13',
      email: 'shubham@nivixpe.com',
      name: 'Shubham kumar kushwaha',
      role: 'Developer 2',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'employee',
      joinDate: '2025-05-01',
    },
  },
  'team@nivixpe.com': {
    password: 'team123',
    user: {
      id: '14',
      email: 'team@nivixpe.com',
      name: 'nivixpe',
      role: 'Admin',
      department: 'Operations',
      team: 'Business',
      accessLevel: 'admin',
      joinDate: '2025-01-01',
    },
  },
};
