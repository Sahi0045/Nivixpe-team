'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { ALL_ROLES } from '@/lib/auth';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, User as UserIcon, Calendar, Clock, X, FolderOpen, Shield, CheckSquare, Square, Plus, Trash2, Edit2 } from 'lucide-react';
import { PageFilterBar } from '@/components/page-filter-bar';
import { DriveFolder, DRIVE_FOLDERS } from '@/lib/drive-access';
import { supabaseDb, AttendanceRecord, TeamMember } from '@/lib/supabase-db';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { normalizeEmail } from '@/lib/utils';
import { canManageTeamMembers } from '@/lib/rbac';
import { confirmDelete } from '@/lib/confirm-delete';

export default function TeamDirectoryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    role: 'Developer 1',
    department: 'Technology',
    team: 'Technical' as 'Business' | 'Legal' | 'Technical' | 'Marketing' | 'Design' | 'HR',
    customEmail: '',
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const loadData = () => {
    supabaseDb.getTeamMembers().then((res) => {
      const normalized = res.map(m => ({
        ...m,
        email: normalizeEmail(m.email)
      }));
      setTeamMembers(normalized as any);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = supabaseDb.subscribeToChanges('team_members', loadData);
    return () => unsub();
  }, []);

  const canManage = canManageTeamMembers(user);
  const canAddMember = canManage;

  const handleRemoveMember = async (member: TeamMember, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirmDelete('team member', member.name))) return;

    try {
      await supabaseDb.deleteTeamMember(member.id);
      toast.success(`Removed ${member.name} from team directory`);
      loadData();
    } catch {
      toast.error('Failed to remove team member');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name.trim()) {
      toast.error('Please enter the team member name');
      return;
    }
    const username = newMemberForm.name.trim().toLowerCase().split(' ')[0];
    const generatedEmail = newMemberForm.customEmail.trim() 
      ? newMemberForm.customEmail.trim().toLowerCase() 
      : `${username}@nivixpe.com`;

    try {
      await supabaseDb.addTeamMember({
        name: newMemberForm.name.trim(),
        email: generatedEmail,
        role: newMemberForm.role as any,
        department: newMemberForm.department,
        team: newMemberForm.team,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
      });
      toast.success(`Added ${newMemberForm.name} with email ${generatedEmail} (${newMemberForm.role})`);
      setShowAddModal(false);
      setNewMemberForm({ name: '', role: 'Developer 1', department: 'Technology', team: 'Technical', customEmail: '' });
      loadData();
    } catch {
      toast.error('Failed to add team member');
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    if (member.status === 'inactive') return false;
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesTeam = filterTeam === 'all' || member.team === filterTeam || member.additionalTeams?.includes(filterTeam);
    return matchesSearch && matchesRole && matchesTeam;
  });

  const roles = Array.from(new Set(teamMembers.map((m) => m.role)));

  return (
    <div className="flex-1 overflow-y-auto flex flex-col relative">
      <Header title="Team Directory" subtitle="View all team members and their information" />

      <div className="p-6 space-y-4">
        <PageFilterBar 
          selectedTeam={filterTeam}
          onTeamChange={setFilterTeam}
          selectedPerson="all"
          onPersonChange={() => {}}
          showPersonFilter={false}
          extraFilters={
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3.5 py-2.5 border border-input rounded-lg bg-background text-sm font-medium cursor-pointer hover:border-gray-400 transition-all"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              {canAddMember && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>
          }
        />

        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground w-12"></th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Department</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                    {canManage && (
                      <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr 
                      key={member.id} 
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="py-4 px-6">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <UserIcon size={20} />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-foreground font-semibold">{member.name}</td>
                      <td className="py-4 px-6 text-foreground">{member.email}</td>
                      <td className="py-4 px-6 text-foreground">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>{member.department}</span>
                          <span className="text-xs text-slate-400 font-medium">{member.team}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : member.status === 'onLeave' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                          <span className="text-sm font-medium capitalize">
                            {member.status === 'onLeave' ? 'On Leave' : member.status}
                          </span>
                        </div>
                      </td>
                      {canManage && (
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMember(member);
                              }}
                              title={`Change role & info for ${member.name}`}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleRemoveMember(member, e)}
                              title={`Remove ${member.name}`}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </CardContent>
        </Card>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-xl font-bold">Add New Team Member</CardTitle>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleAddMember}>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Role</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm font-medium"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                    <Input
                      placeholder="e.g. Technology"
                      value={newMemberForm.department}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, department: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Primary Team</label>
                    <select
                      value={newMemberForm.team}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, team: e.target.value as any })}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm font-medium"
                    >
                      <option value="Business">Business</option>
                      <option value="Technical">Technical</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Legal">Legal</option>
                      <option value="Design">Design</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Email Address <span className="font-normal text-slate-400">(Auto-generated as username@nivixpe.com)</span>
                  </label>
                  <Input
                    placeholder={newMemberForm.name.trim() ? `${newMemberForm.name.trim().toLowerCase().split(' ')[0]}@nivixpe.com` : 'username@nivixpe.com'}
                    value={newMemberForm.customEmail}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, customEmail: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Add Member
                  </button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {selectedMember && (
        <AttendanceModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
          currentUser={user}
        />
      )}

      {editingMember && (
        <EditRoleModal 
          member={editingMember} 
          onClose={() => setEditingMember(null)} 
          onSaved={loadData}
        />
      )}
    </div>
  );
}

function EditRoleModal({
  member,
  onClose,
  onSaved,
}: {
  member: TeamMember;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(member.role);
  const [department, setDepartment] = useState(member.department || 'Technology');
  const [team, setTeam] = useState(member.team || 'Technical');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabaseDb.updateTeamMember(member.id, {
        role: role as any,
        department,
        team: team as any,
      });
      toast.success(`Updated role & info for ${member.name}`);
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update team member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl font-bold">Edit Role & Info: {member.name}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm font-medium"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Department
                </label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Primary Team
                </label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value as any)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm font-medium"
                >
                  <option value="Business">Business</option>
                  <option value="Technical">Technical</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Legal">Legal</option>
                  <option value="Design">Design</option>
                  <option value="HR">HR</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}


function AttendanceModal({ member, onClose, currentUser }: { member: TeamMember, onClose: () => void, currentUser: any }) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [savingGrant, setSavingGrant] = useState(false);

  useEffect(() => {
    supabaseDb.getAttendanceRecords().then((res) => {
      const normMemberEmail = normalizeEmail(member.email);
      setAttendanceRecords(
        res.filter((r) => normalizeEmail(r.email) === normMemberEmail)
      );
    });
    supabaseDb.getDriveAccessGrants().then((grants) => {
      const normMemberEmail = normalizeEmail(member.email);
      const g = grants.find(
        (gr) => normalizeEmail(gr.grantedToEmail) === normMemberEmail || gr.grantedTo === member.name
      );
      if (g) setSelectedFolders(g.folders);
    });
  }, [member.email, member.name]);

  const canView = currentUser?.email === member.email || 
                  currentUser?.isSuperAdmin || 
                  currentUser?.role === 'CTO' || 
                  currentUser?.role === 'COO';

  const canGrantAccess = currentUser?.isSuperAdmin || 
                         currentUser?.role === 'CTO' || 
                         currentUser?.role === 'COO';

  const memberAlreadyHasFullAccess = ['CEO', 'CTO', 'COO'].includes(member.role);

  const toggleFolder = (folderId: string) => {
    setSelectedFolders(prev =>
      prev.includes(folderId) ? prev.filter(f => f !== folderId) : [...prev, folderId]
    );
  };

  const handleSaveGrant = async () => {
    if (!currentUser) return;
    setSavingGrant(true);
    try {
      await supabaseDb.grantDriveAccess({
        grantedTo: member.name,
        grantedToEmail: member.email,
        grantedBy: currentUser.name,
        folders: selectedFolders,
        grantedAt: new Date().toISOString().split('T')[0],
      });
      toast.success(`Drive access updated for ${member.name}`);
    } catch (e) {
      toast.error('Failed to update drive access.');
    } finally {
      setSavingGrant(false);
    }
  };

  const handleRevokeAll = async () => {
    setSavingGrant(true);
    try {
      setSelectedFolders([]);
      toast.success(`All drive access revoked for ${member.name}`);
    } catch (e) {
      toast.error('Failed to revoke drive access.');
    } finally {
      setSavingGrant(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">{member.name}'s Profile</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">{member.role} • {member.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border">
              <p className="text-sm text-slate-500 font-medium">Department</p>
              <p className="font-semibold">{member.department}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border">
              <p className="text-sm text-slate-500 font-medium">Primary Team</p>
              <p className="font-semibold">{member.team}</p>
            </div>
            {member.additionalTeams && member.additionalTeams.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border col-span-2">
                <p className="text-sm text-slate-500 font-medium">Additional Teams</p>
                <div className="flex gap-2 mt-2">
                  {member.additionalTeams.map(t => (
                    <span key={t} className="px-3 py-1 bg-white border rounded-lg text-sm font-medium shadow-sm">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drive Access Grant Section — only for CEO, COO, CTO */}
          {canGrantAccess && !memberAlreadyHasFullAccess && (
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 border-b flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-teal-900">Drive Access</h3>
                {selectedFolders.length > 0 && (
                  <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-semibold">
                    {selectedFolders.length} folder{selectedFolders.length > 1 ? 's' : ''} granted
                  </span>
                )}
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-500">Select which team drive folders <span className="font-semibold text-slate-700">{member.name}</span> should have access to. They will see all existing and future documents in selected folders.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DRIVE_FOLDERS.map(folder => {
                    // Skip the member's own default folder (they already have it)
                    const memberDefaultFolder = member.team === 'Technical' ? 'Technical' : member.team === 'Marketing' ? 'Marketing' : member.team === 'Business' ? 'Business' : member.team === 'Legal' ? 'Legal' : 'Other';
                    const isDefault = folder.id === memberDefaultFolder;
                    const isSelected = selectedFolders.includes(folder.id);
                    return (
                      <button
                        key={folder.id}
                        onClick={() => !isDefault && toggleFolder(folder.id)}
                        disabled={isDefault}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          isDefault
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50/50'
                        }`}
                      >
                        {isDefault ? (
                          <Shield className="h-4 w-4 text-slate-400" />
                        ) : isSelected ? (
                          <CheckSquare className="h-4 w-4 text-teal-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                        {folder.label}
                        {isDefault && <span className="text-[10px] ml-auto font-normal text-slate-400">default</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveGrant}
                    disabled={savingGrant}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {savingGrant ? 'Saving...' : 'Save Access'}
                  </button>
                  {selectedFolders.length > 0 && (
                    <button
                      onClick={handleRevokeAll}
                      disabled={savingGrant}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Revoke All
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Attendance History
            </h3>
            
            {!canView ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm font-medium flex items-center gap-2">
                You do not have permission to view this member's attendance records.
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                No attendance records found.
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.map((record) => (
                  <div key={record.id || (record as any)._id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex flex-col items-center justify-center font-bold">
                        <span className="text-lg leading-none">{format(new Date(record.date), 'dd')}</span>
                        <span className="text-[10px] uppercase">{format(new Date(record.date), 'MMM')}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{format(new Date(record.date), 'EEEE')}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {record.loginTime || '--:--'} - {record.logoutTime || '--:--'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${record.status === 'present' ? 'bg-emerald-100 text-emerald-800' : record.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {record.status}
                      </span>
                      {record.workHours !== undefined && (
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {Math.floor(record.workHours / 60)}h {record.workHours % 60}m
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
