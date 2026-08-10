'use client';

import { Search, Filter, Users, User, Shield, CheckCircle, RotateCcw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { supabaseDb, TeamMember } from '@/lib/supabase-db';
import { ALL_ROLES } from '@/lib/auth';

export interface StatusOption {
  id: string;
  label: string;
}

export interface PageFilterBarProps {
  // Role Filter
  selectedRole?: string;
  onRoleChange?: (role: string) => void;
  showRoleFilter?: boolean;

  // Team Filter
  selectedTeam?: string;
  onTeamChange?: (team: string) => void;
  showTeamFilter?: boolean;

  // Person / Employee Filter
  selectedPerson?: string;
  onPersonChange?: (person: string) => void;
  showPersonFilter?: boolean;

  // Status Filter
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  showStatusFilter?: boolean;
  statusOptions?: StatusOption[];

  /** Restrict to these team members only (for RBAC) */
  visibleMembers?: TeamMember[];

  // Reset / Custom Actions
  onResetFilters?: () => void;
  extraFilters?: React.ReactNode;
}

const TEAMS = [
  { id: 'all', label: 'All Teams' },
  { id: 'Business', label: 'Business' },
  { id: 'Technical', label: 'Technical' },
  { id: 'Marketing', label: 'Marketing' },
  { id: 'Legal', label: 'Legal text' },
  { id: 'HR', label: 'HR' },
  { id: 'Design', label: 'Design' },
  { id: 'Executive', label: 'Executive' },
];

export function PageFilterBar({
  selectedRole = 'all',
  onRoleChange,
  showRoleFilter = true,

  selectedTeam = 'all',
  onTeamChange,
  showTeamFilter = true,

  selectedPerson = 'all',
  onPersonChange,
  showPersonFilter = true,

  selectedStatus = 'all',
  onStatusChange,
  showStatusFilter = false,
  statusOptions = [],

  visibleMembers,
  onResetFilters,
  extraFilters,
}: PageFilterBarProps) {
  const [fetchedMembers, setFetchedMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (!visibleMembers) {
      supabaseDb.getTeamMembers().then(setFetchedMembers);
    }
  }, [visibleMembers]);

  const members = visibleMembers || fetchedMembers;

  // Dynamic roles calculation
  const availableRoles = useMemo(() => {
    const memberRoles = members.map((m) => m.role);
    const combined = new Set(['all', ...ALL_ROLES, ...memberRoles]);
    return Array.from(combined).filter(Boolean);
  }, [members]);

  // Filter members dynamically by selectedRole AND selectedTeam
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedRole !== 'all' && m.role !== selectedRole) return false;
      if (selectedTeam !== 'all' && m.team !== selectedTeam && !m.additionalTeams?.includes(selectedTeam)) return false;
      return true;
    });
  }, [members, selectedRole, selectedTeam]);

  const isCustomSelection =
    (showRoleFilter && selectedRole !== 'all') ||
    (showTeamFilter && selectedTeam !== 'all') ||
    (showPersonFilter && selectedPerson !== 'all') ||
    (showStatusFilter && selectedStatus !== 'all');

  const handleReset = () => {
    if (onRoleChange) onRoleChange('all');
    if (onTeamChange) onTeamChange('all');
    if (onPersonChange) onPersonChange('all');
    if (onStatusChange) onStatusChange('all');
    if (onResetFilters) onResetFilters();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200/80 shadow-sm w-full">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mr-1">
        <Filter className="h-4 w-4 text-purple-600" />
        <span>Filters</span>
      </div>

      {/* Role Filter */}
      {showRoleFilter && onRoleChange && (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-purple-500" />
          <select
            value={selectedRole}
            onChange={(e) => {
              onRoleChange(e.target.value);
              if (onPersonChange) onPersonChange('all');
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all cursor-pointer hover:border-gray-400 min-w-[130px]"
          >
            <option value="all">All Roles</option>
            {availableRoles.filter((r) => r !== 'all').map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Team Filter */}
      {showTeamFilter && onTeamChange && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <select
            value={selectedTeam}
            onChange={(e) => {
              onTeamChange(e.target.value);
              if (onPersonChange) onPersonChange('all');
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer hover:border-gray-400 min-w-[130px]"
          >
            {TEAMS.map((team) => (
              <option key={team.id} value={team.id}>
                {team.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Employee / Person Filter */}
      {showPersonFilter && onPersonChange && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-500" />
          <select
            value={selectedPerson}
            onChange={(e) => onPersonChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all cursor-pointer hover:border-gray-400 min-w-[150px]"
          >
            <option value="all">All Employees ({filteredMembers.length})</option>
            {filteredMembers.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Filter */}
      {showStatusFilter && onStatusChange && statusOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-amber-500" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all cursor-pointer hover:border-gray-400 min-w-[130px]"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selection State Badge & Select All / Reset Action */}
      <div className="flex items-center gap-2 ml-auto">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isCustomSelection
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isCustomSelection ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          {isCustomSelection ? 'Custom Selection' : 'All Authorized Selected'}
        </span>

        {isCustomSelection && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-all"
            title="Reset all filters to Select All"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Select All
          </button>
        )}
      </div>

      {extraFilters}
    </div>
  );
}
