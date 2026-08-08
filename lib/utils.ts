import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDaysDifference(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'pending':
    case 'in progress':
    case 'ongoing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'rejected':
    case 'missed':
    case 'overdue':
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function isLate(time: string): boolean {
  if (!time) return false;
  const [hours, minutes] = time.split(':').map(Number);
  return hours > 9 || (hours === 9 && minutes > 0);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function normalizeEmail(email: string): string {
  if (!email) return '';
  const clean = email.trim().toLowerCase();
  
  const aliasMap: Record<string, string> = {
    'ceo@nivixpe.com': 'sahith@nivixpe.com',
    'cto@nivixpe.com': 'shubhamc@nivixpe.com',
    'cso@nivixpe.com': 'swaraag@nivixpe.com',
    'dcso@nivixpe.com': 'ujjwal@nivixpe.com',
    'dcmo@nivixpe.com': 'n-wkw@nivixpe.com',
    'bhavika@nivixpe.com': 'n-wkw@nivixpe.com',
    'bhavikad@nivixpe.com': 'n-wkw@nivixpe.com',
    'coo@nivixpe.com': 'siddharatha@nivixpe.com',
    'legal@nivixpe.com': 'kashish@nivixpe.com',
    'legal1@nivixpe.com': 'kashish@nivixpe.com',
    'legal2@nivixpe.com': 'vinisha@nivixpe.com',
    'designer1@nivixpe.com': 'aradhya@nivixpe.com',
    'designer2@nivixpe.com': 'rudra@nivixpe.com',
    'developer1@nivixpe.com': 'nguyen@nivixpe.com',
    'developer2@nivixpe.com': 'shubham@nivixpe.com',
    'developer3@nivixpe.com': 'nithin@nivixpe.com',
    'pm@nivixpe.com': 'aryan@nivixpe.com',
    'productmanager@nivix.com': 'aryan@nivixpe.com',
  };
  
  return aliasMap[clean] || clean;
}

