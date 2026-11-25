'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Lock, Mail, ShieldCheck, UserPlus, UsersRound, X } from 'lucide-react';
import { AuthField } from '@/components/auth/AuthKit';
import { Btn, EmptyState, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import PermissionCheckboxes from '@/components/common/PermissionCheckboxes';
import {
  CHARITY_PERMISSION_KEYS,
  CHARITY_PERMISSION_LABELS,
  CHARITY_PERMISSION_PRESETS,
} from '@/constants/charityPanels';

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  staffRole: string;
  permissions?: string[];
  active: boolean;
}

const CharityStaffPanel = () => {
  const { data: session } = useSession() || {};
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    staffRole: 'STAFF',
    permissions: ['listings', 'sold', 'messages', 'notifications', 'community'] as string[],
  });

  const api = process.env.NEXT_PUBLIC_API_URL;
  const token = session?.token;

  const fetchStaff = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${api}/charity/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(res.data.staff || []);
    } catch {
      ToastService.error('Failed to load team.');
    }
  }, [api, token]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const applyPreset = (staffRole: string) => {
    const preset = CHARITY_PERMISSION_PRESETS.find(p => p.id === staffRole);
    setForm(f => ({
      ...f,
      staffRole,
      permissions: preset ? [...preset.permissions] : f.permissions,
    }));
  };

  const createStaff = async () => {
    if (!form.email.trim() || !form.password) {
      ToastService.error('Email and password required.');
      return;
    }
    if (!form.permissions.length) {
      ToastService.error('Select at least one permission.');
      return;
    }
    try {
      await axios.post(`${api}/charity/staff`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      ToastService.success('Staff member added.');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        staffRole: 'STAFF',
        permissions: ['listings', 'sold', 'community'],
      });
      setFormOpen(false);
      fetchStaff();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : 'Failed to add staff.';
      ToastService.error(msg);
    }
  };

  const updateStaff = async (
    staffId: string,
    payload: { permissions?: string[]; active?: boolean }
  ) => {
    try {
      await axios.patch(`${api}/charity/staff/${staffId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStaff();
    } catch {
      ToastService.error('Failed to update staff.');
    }
  };

  return (
    <div className="charity-staff-panel space-y-5">
      <SectionCard
        icon={UsersRound}
        title="Team members"
        description="Give volunteers and staff their own login with only the access they need. They sign in on the normal Charity or brand login."
        action={
          <Btn icon={formOpen ? X : UserPlus} variant={formOpen ? 'secondary' : 'primary'} size="sm" onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? 'Close' : 'Add member'}
          </Btn>
        }
      >
        {formOpen && (
          <form
            onSubmit={e => {
              e.preventDefault();
              createStaff();
            }}
            className="mb-5 space-y-4 rounded-2xl bg-[#FAF8FB] p-4"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <AuthField label="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              <AuthField label="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              <AuthField label="Email" icon={Mail} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <AuthField label="Temporary password" icon={Lock} type="password" autoComplete="new-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} hint="Share it securely. They can change it later." />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-[#2A2730]">Role</p>
              <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-[#ECE8EE]">
                {[
                  { v: 'STAFF', l: 'Staff' },
                  { v: 'MANAGER', l: 'Manager' },
                ].map(o => (
                  <button key={o.v} type="button" role="radio" aria-checked={form.staffRole === o.v} onClick={() => applyPreset(o.v)} className={`h-10 rounded-lg text-[13.5px] font-medium ${form.staffRole === o.v ? 'bg-[#611192] text-white' : 'text-[#6B686E]'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-[#2A2730]">Access</p>
              <PermissionCheckboxes
                allKeys={[...CHARITY_PERMISSION_KEYS]}
                labels={CHARITY_PERMISSION_LABELS}
                selected={form.permissions}
                onChange={permissions => setForm(f => ({ ...f, permissions }))}
                presets={CHARITY_PERMISSION_PRESETS}
              />
            </div>
            <div className="flex justify-end">
              <Btn type="submit" icon={UserPlus} className="sm:w-full">
                Create login
              </Btn>
            </div>
          </form>
        )}

        {staff.length === 0 ? (
          <EmptyState icon={UsersRound} title="No team members yet" body="Add someone to help with listings, orders or community posts." />
        ) : (
          <ul className="space-y-3">
            {staff.map(member => {
              const open = expanded === member._id;
              const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '?';
              return (
                <li key={member._id} className="rounded-2xl bg-white p-4 ring-1 ring-[#ECE8EE]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${member.active ? 'bg-[#F2E8F8] text-[#611192]' : 'bg-[#F1EFF2] text-[#8A888C]'}`}>{initials}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-[#0B0112]">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="truncate text-[12.5px] text-[#8A888C]">{member.email}</p>
                    </div>
                    <StatusPill status={member.active ? 'Active' : 'Deactivated'} tone={member.active ? 'green' : 'grey'} />
                    <div className="flex w-full justify-end gap-1.5 sm:justify-start">
                      <Btn size="sm" variant="ghost" icon={ShieldCheck} onClick={() => setExpanded(open ? null : member._id)} aria-expanded={open}>
                        {open ? 'Hide access' : `Access (${member.permissions?.length || 0})`}
                      </Btn>
                      <Btn size="sm" variant="secondary" onClick={() => updateStaff(member._id, { active: !member.active })}>
                        {member.active ? 'Deactivate' : 'Reactivate'}
                      </Btn>
                    </div>
                  </div>
                  {open && member.permissions ? (
                    <div className="mt-4 border-t border-[#F3EFF5] pt-4">
                      <PermissionCheckboxes
                        allKeys={[...CHARITY_PERMISSION_KEYS]}
                        labels={CHARITY_PERMISSION_LABELS}
                        selected={member.permissions}
                        onChange={permissions => updateStaff(member._id, { permissions })}
                        presets={CHARITY_PERMISSION_PRESETS}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default CharityStaffPanel;
