'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Lock, Mail, ShieldCheck, UserPlus, UsersRound, X } from 'lucide-react';
import { AuthField } from '@/components/auth/AuthKit';
import { Btn, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import PermissionCheckboxes from '@/components/common/PermissionCheckboxes';
import {
  ADMIN_PERMISSION_KEYS,
  ADMIN_PERMISSION_LABELS,
  ADMIN_PERMISSION_PRESETS,
  ADMIN_ROLE_LABELS,
} from '@/constants/adminPanels';

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions?: string[];
}

const SUB_ROLES = [
  { value: 'OPS_ADMIN', label: ADMIN_ROLE_LABELS.OPS_ADMIN },
  { value: 'CONTENT_ADMIN', label: ADMIN_ROLE_LABELS.CONTENT_ADMIN },
  { value: 'FINANCE_ADMIN', label: ADMIN_ROLE_LABELS.FINANCE_ADMIN },
];

const AdminTeamPanel: React.FC = () => {
  const { data: session } = useSession() || {};
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'OPS_ADMIN',
    permissions: ['operations'] as string[],
  });

  const api = process.env.NEXT_PUBLIC_API_URL;
  const token = session?.token;

  const fetchTeam = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${api}/admin/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam(res.data.team || []);
    } catch {
      ToastService.error('Failed to load admin team.');
    }
  }, [api, token]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const applyRolePreset = (role: string) => {
    const preset = ADMIN_PERMISSION_PRESETS.find(p => p.id === role);
    setForm(f => ({
      ...f,
      role,
      permissions: preset ? [...preset.permissions] : f.permissions,
    }));
  };

  const createMember = async () => {
    if (!form.email.trim() || !form.password) {
      ToastService.error('Email and password are required.');
      return;
    }
    if (!form.permissions.length) {
      ToastService.error('Select at least one permission.');
      return;
    }
    try {
      await axios.post(`${api}/admin/team`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      ToastService.success('Team member created.');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'OPS_ADMIN',
        permissions: ['operations'],
      });
      setFormOpen(false);
      fetchTeam();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : 'Failed to create team member.';
      ToastService.error(msg);
    }
  };

  const updateMember = async (adminId: string, permissions: string[]) => {
    try {
      await axios.patch(
        `${api}/admin/team/${adminId}/role`,
        { permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      ToastService.success('Access updated.');
      fetchTeam();
    } catch {
      ToastService.error('Failed to update access.');
    }
  };

  return (
    <div className="admin-team-panel">
      <SectionCard
        icon={UsersRound}
        title="Admin team"
        description="Create managers with only the access they need. They sign in at /admin/login."
        action={
          <Btn size="sm" variant={formOpen ? 'secondary' : 'primary'} icon={formOpen ? X : UserPlus} onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? 'Close' : 'Add member'}
          </Btn>
        }
      >
        {formOpen ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              createMember();
            }}
            className="mb-5 space-y-4 rounded-2xl bg-[#FAF8FB] p-4"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <AuthField label="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              <AuthField label="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              <AuthField label="Work email" icon={Mail} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <AuthField label="Temporary password" icon={Lock} type="password" autoComplete="new-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-[#2A2730]">Role</p>
              <div role="radiogroup" className="grid gap-1 rounded-xl bg-white p-1 ring-1 ring-[#ECE8EE]" style={{ gridTemplateColumns: `repeat(${SUB_ROLES.length}, minmax(0,1fr))` }}>
                {SUB_ROLES.map(r => (
                  <button key={r.value} type="button" role="radio" aria-checked={form.role === r.value} onClick={() => applyRolePreset(r.value)} className={`h-10 rounded-lg px-2 text-[12.5px] font-medium ${form.role === r.value ? 'bg-[#611192] text-white' : 'text-[#6B686E]'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-[#2A2730]">Access</p>
              <PermissionCheckboxes allKeys={[...ADMIN_PERMISSION_KEYS]} labels={ADMIN_PERMISSION_LABELS} selected={form.permissions} onChange={permissions => setForm(f => ({ ...f, permissions }))} presets={ADMIN_PERMISSION_PRESETS} />
            </div>
            <div className="flex justify-end">
              <Btn type="submit" icon={UserPlus} className="sm:w-full">
                Create account
              </Btn>
            </div>
          </form>
        ) : null}

        <ul className="space-y-3">
          {team.map(member => {
            const isSuper = member.role === 'ADMIN';
            const open = expanded === member._id;
            const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '?';
            return (
              <li key={member._id} className="rounded-2xl bg-white p-4 ring-1 ring-[#ECE8EE]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${isSuper ? 'bg-[#611192] text-white' : 'bg-[#F2E8F8] text-[#611192]'}`}>{initials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-[#0B0112]">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="truncate text-[12.5px] text-[#8A888C]">{member.email}</p>
                  </div>
                  <StatusPill status={isSuper ? 'Super Admin' : ADMIN_ROLE_LABELS[member.role] || member.role} tone={isSuper ? 'purple' : 'blue'} />
                  {!isSuper && member.permissions ? (
                    <Btn size="sm" variant="ghost" icon={ShieldCheck} onClick={() => setExpanded(open ? null : member._id)} aria-expanded={open}>
                      {open ? 'Hide' : `Access (${member.permissions.length})`}
                    </Btn>
                  ) : null}
                </div>
                {open && !isSuper && member.permissions ? (
                  <div className="mt-4 border-t border-[#F3EFF5] pt-4">
                    <PermissionCheckboxes allKeys={[...ADMIN_PERMISSION_KEYS]} labels={ADMIN_PERMISSION_LABELS} selected={member.permissions} onChange={perms => updateMember(member._id, perms)} presets={ADMIN_PERMISSION_PRESETS} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
};

export default AdminTeamPanel;
