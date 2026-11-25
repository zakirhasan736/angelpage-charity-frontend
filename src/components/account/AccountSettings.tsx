'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  AtSign,
  BadgeCheck,
  Building2,
  Camera,
  CreditCard,
  Globe,
  Hash,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  User,
} from 'lucide-react';
import { AuthField, AuthTextarea } from '@/components/auth/AuthKit';
import { Btn, ConfirmDialog, InfoList, SectionCard } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import LogoutButton from '@/components/elements/button/LogoutButton';
import StripOnboarding from '@/components/pages-component/charity/charity-account/StripOnboarding';

export type SettingsRole = 'user' | 'charity' | 'admin';

const BASE: Record<SettingsRole, string> = {
  user: '/users/profile',
  charity: '/charity/profile',
  admin: '/admin/profile',
};

const API = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_AVATAR = '/images/icons/elisp-profile-default-img.svg';

type Address = {
  _id?: string;
  tempId?: number;
  type?: string;
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  postcode?: string;
};

type BillingAddress = { name?: string; address?: string; city?: string; country?: string; postCode?: string };
type Payment = {
  _id?: string;
  nameAccountHolder?: string;
  stripePaymentMethodId?: string;
  useShippingAsBilling?: boolean;
  billingAddress?: BillingAddress;
};

type Profile = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  dateBirth?: string;
  email?: string;
  userName?: string;
  profileImage?: string;
  verified?: boolean;
  charityName?: string;
  charityNumber?: string;
  charityID?: string;
  description?: string;
  websiteLink?: string;
  phoneNumber?: string;
  addresses?: Address[];
  payments?: Payment[];
};

const errMsg = (e: unknown, fallback: string) => {
  const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return m || fallback;
};

const fmtDate = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

const toDateInput = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ editable card */

function EditableCard({
  title,
  description,
  icon,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  view,
  form,
}: {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof SectionCard>['icon'];
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  view: React.ReactNode;
  form: React.ReactNode;
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      icon={icon}
      action={
        editing ? null : (
          <Btn variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>
            Edit
          </Btn>
        )
      }
    >
      {editing ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          {form}
          <div className="flex justify-end gap-2 border-t border-[#F0EBF2] pt-4 sm:flex-col-reverse">
            <Btn variant="secondary" onClick={onCancel} className="sm:w-full">
              Cancel
            </Btn>
            <Btn type="submit" loading={saving} className="sm:w-full">
              Save changes
            </Btn>
          </div>
        </form>
      ) : (
        view
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ main */

export default function AccountSettings({ role, onDeleteTab }: { role: SettingsRole; onDeleteTab?: () => void }) {
  const { data: session, status } = useSession() || {};
  const token = session?.token;
  const base = `${API}${BASE[role]}`;
  const auth = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(base, auth());
      setProfile(data?.user || data?.charity || data || {});
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [token, base, auth]);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  if (loadError) {
    return (
      <SectionCard tone="danger" icon={TriangleAlert} title="We couldn’t load your settings" description="Check your connection and try again.">
        <Btn onClick={load}>Try again</Btn>
      </SectionCard>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[180, 220, 220, 160].map((h, i) => (
          <div key={i} className="animate-pulse rounded-[22px] bg-[#F4F1F6]" style={{ height: h }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-4">
      <PhotoCard role={role} profile={profile} base={base} token={token} onSaved={img => setProfile(p => ({ ...p, profileImage: img }))} />
      {role === 'charity' ? (
        <OrganisationCard profile={profile} base={base} token={token} onSaved={p => setProfile(prev => ({ ...prev, ...p }))} />
      ) : (
        <PersonalCard profile={profile} base={base} token={token} onSaved={p => setProfile(prev => ({ ...prev, ...p }))} />
      )}
      <SecurityCard role={role} profile={profile} base={base} token={token} onSaved={p => setProfile(prev => ({ ...prev, ...p }))} />
      <AddressesCard base={base} token={token} initial={profile.addresses || []} onChange={addresses => setProfile(prev => ({ ...prev, addresses }))} />
      {role === 'charity' ? (
        <SectionCard title="Payouts" description="Where sale proceeds and supporters’ shares are paid." icon={CreditCard}>
          <StripOnboarding compact />
        </SectionCard>
      ) : null}
      <BillingCard base={base} token={token} initial={profile.payments || []} addresses={profile.addresses || []} />

      <SectionCard title="Sign out or close account" icon={ShieldCheck} description="Signing out keeps your data. Closing your account deletes it.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="[&_button]:h-11! [&_button]:rounded-xl! [&_button]:px-5!">
            <LogoutButton />
          </div>
          {onDeleteTab ? (
            <Btn variant="ghost" icon={Trash2} onClick={onDeleteTab} className="text-[#B0002A]! hover:bg-[#FFF1F4]!">
              Close my account
            </Btn>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ photo */

function PhotoCard({ role, profile, base, token, onSaved }: { role: SettingsRole; profile: Profile; base: string; token?: string; onSaved: (img: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return ToastService.error('Choose an image file.');
    if (f.size > 5 * 1024 * 1024) return ToastService.error('Images must be under 5 MB.');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!file) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('profileImage', file);
    try {
      const { data } = await axios.put(base, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      onSaved(data?.user?.profileImage || preview || '');
      setFile(null);
      setPreview(null);
      ToastService.success('Photo updated.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t upload the photo.'));
    } finally {
      setSaving(false);
    }
  };

  const name = role === 'charity' ? profile.charityName || 'Your charity' : [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your name';
  const src = preview || profile.profileImage || DEFAULT_AVATAR;

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#3B055C] to-[#14021F] p-6 text-white sm:rounded-[20px] sm:p-5">
      <span className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-[#611192] opacity-60 blur-[70px]" aria-hidden />
      <div className="relative flex items-center gap-5 sm:flex-col sm:items-start sm:gap-4">
        <div className="relative shrink-0">
          <Image src={src} alt="" width={88} height={88} unoptimized={Boolean(preview)} className="h-[88px] w-[88px] rounded-[26px] object-cover ring-4 ring-white/15" />
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="absolute -right-1.5 -bottom-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#611192] shadow-lg"
            aria-label="Change photo"
          >
            <Camera className="h-4 w-4" aria-hidden />
          </button>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-primary text-[26px] leading-tight capitalize sm:text-[23px]">{name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/70">
            {profile.userName ? <span>@{profile.userName}</span> : null}
            {profile.email ? <span className="truncate">{profile.email}</span> : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium text-[#A7F3D0]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Email verified
              </span>
            ) : (
              <Link href={`/auth/verify-email?email=${encodeURIComponent(profile.email || '')}`} className="inline-flex items-center gap-1 rounded-full bg-[#FFE4EA] px-2.5 py-1 text-[12px] font-semibold text-[#9F1239]">
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Verify your email
              </Link>
            )}
            <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[12px] text-white/80 capitalize">{role === 'user' ? 'Member' : role === 'charity' ? 'Charity' : 'Admin team'}</span>
          </div>
        </div>
        {file ? (
          <div className="flex gap-2 sm:w-full">
            <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="h-10 rounded-xl px-4 text-[13.5px] text-white/80 ring-1 ring-white/25 sm:flex-1">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="h-10 rounded-xl bg-white px-4 text-[13.5px] font-semibold text-[#3B055C] disabled:opacity-60 sm:flex-1">
              {saving ? 'Uploading…' : 'Save photo'}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ personal (user / admin) */

function PersonalCard({ profile, base, token, onSaved }: { profile: Profile; base: string; token?: string; onSaved: (p: Partial<Profile>) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateBirth: '' });
  const start = () => {
    setForm({ firstName: profile.firstName || '', lastName: profile.lastName || '', dateBirth: toDateInput(profile.dateBirth) });
    setEditing(true);
  };
  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return ToastService.error('First and last name are required.');
    setSaving(true);
    try {
      await axios.put(base, { firstName: form.firstName.trim(), lastName: form.lastName.trim(), dateBirth: form.dateBirth }, { headers: { Authorization: `Bearer ${token}` } });
      onSaved({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), dateBirth: form.dateBirth });
      setEditing(false);
      ToastService.success('Personal details saved.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t save your details.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <EditableCard
      title="Personal details"
      description="Your name appears on orders and messages."
      icon={User}
      editing={editing}
      onEdit={start}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={saving}
      view={
        <InfoList
          items={[
            { label: 'First name', value: profile.firstName },
            { label: 'Last name', value: profile.lastName },
            { label: 'Date of birth', value: fmtDate(profile.dateBirth) },
          ]}
        />
      }
      form={
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          <AuthField label="First name" autoComplete="given-name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          <AuthField label="Last name" autoComplete="family-name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          <AuthField label="Date of birth" type="date" autoComplete="bday" value={form.dateBirth} onChange={e => setForm({ ...form, dateBirth: e.target.value })} />
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ organisation (charity) */

function OrganisationCard({ profile, base, token, onSaved }: { profile: Profile; base: string; token?: string; onSaved: (p: Partial<Profile>) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ charityName: '', charityNumber: '', charityID: '', description: '', websiteLink: '', phoneNumber: '' });
  const start = () => {
    setForm({
      charityName: profile.charityName || '',
      charityNumber: profile.charityNumber || '',
      charityID: profile.charityID || '',
      description: profile.description || '',
      websiteLink: profile.websiteLink || '',
      phoneNumber: profile.phoneNumber || '',
    });
    setEditing(true);
  };
  const save = async () => {
    if (!form.charityName.trim()) return ToastService.error('Charity name is required.');
    setSaving(true);
    try {
      await axios.put(`${base}/adminInfo`, form, { headers: { Authorization: `Bearer ${token}` } });
      onSaved(form);
      setEditing(false);
      ToastService.success('Charity details saved.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t save charity details.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <EditableCard
      title="Charity details"
      description="Shown on your storefront and every listing that supports you."
      icon={Building2}
      editing={editing}
      onEdit={start}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={saving}
      view={
        <div className="space-y-4">
          <InfoList
            items={[
              { label: 'Charity name', value: profile.charityName },
              { label: 'Charity number', value: profile.charityNumber },
              { label: 'Website', value: profile.websiteLink },
              { label: 'Phone', value: profile.phoneNumber },
            ]}
          />
          <div className="rounded-2xl bg-[#FAF8FB] px-4 py-3">
            <p className="text-[11.5px] font-medium tracking-wide text-[#8A888C] uppercase">About</p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-[#0B0112]">{profile.description || <span className="text-[#ABA7AE]">Add a short description supporters will see.</span>}</p>
          </div>
        </div>
      }
      form={
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
            <AuthField label="Charity name" icon={Building2} value={form.charityName} onChange={e => setForm({ ...form, charityName: e.target.value })} />
            <AuthField label="Charity number" icon={Hash} value={form.charityNumber} onChange={e => setForm({ ...form, charityNumber: e.target.value })} />
            <AuthField label="Website" icon={Globe} type="url" inputMode="url" placeholder="https://" value={form.websiteLink} onChange={e => setForm({ ...form, websiteLink: e.target.value })} />
            <AuthField label="Phone" icon={Phone} type="tel" inputMode="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
          </div>
          <AuthTextarea label="About your charity" rows={4} maxLength={300} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} hint={`${form.description.length}/300`} />
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ security */

function SecurityCard({ role, profile, base, token, onSaved }: { role: SettingsRole; profile: Profile; base: string; token?: string; onSaved: (p: Partial<Profile>) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', userName: '', currentPassword: '', newPassword: '' });
  const start = () => {
    setForm({ email: profile.email || '', userName: profile.userName || '', currentPassword: '', newPassword: '' });
    setEditing(true);
  };
  const save = async () => {
    if (form.newPassword && !form.currentPassword) return ToastService.error('Enter your current password to set a new one.');
    if (form.newPassword && form.newPassword.length < 8) return ToastService.error('New password must be at least 8 characters.');
    setSaving(true);
    try {
      const payload: Record<string, string> = { email: form.email.trim(), userName: form.userName.trim() };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      await axios.put(base, payload, { headers: { Authorization: `Bearer ${token}` } });
      onSaved({ email: payload.email, userName: payload.userName });
      setEditing(false);
      ToastService.success(form.newPassword ? 'Sign-in details and password updated.' : 'Sign-in details saved.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t save. Check your current password.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <EditableCard
      title="Sign-in & security"
      description="Email, username and password."
      icon={KeyRound}
      editing={editing}
      onEdit={start}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={saving}
      view={
        <InfoList
          items={[
            { label: 'Email', value: profile.email },
            { label: 'Username', value: profile.userName ? `@${profile.userName}` : '' },
            { label: 'Password', value: '••••••••' },
            { label: 'Account type', value: role === 'user' ? 'Individual' : role === 'charity' ? 'Charity' : 'Admin' },
          ]}
        />
      }
      form={
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
            <AuthField label="Email" icon={Mail} type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <AuthField label="Username" icon={AtSign} autoCapitalize="none" value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} />
          </div>
          <div className="rounded-2xl bg-[#FAF8FB] p-4">
            <p className="mb-3 text-[13px] font-semibold text-[#0B0112]">Change password <span className="font-normal text-[#8A888C]">(optional)</span></p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <AuthField label="Current password" icon={Lock} type="password" autoComplete="current-password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
              <AuthField label="New password" icon={Lock} type="password" autoComplete="new-password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} hint="At least 8 characters" />
            </div>
          </div>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ addresses */

const emptyAddress = (): Address => ({ tempId: Date.now(), type: 'Shipping to', name: '', address: '', city: '', country: '', postcode: '' });

function AddressesCard({ base, token, initial, onChange }: { base: string; token?: string; initial: Address[]; onChange: (a: Address[]) => void }) {
  const [list, setList] = useState<Address[]>(initial);
  const [draft, setDraft] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const commit = (next: Address[]) => {
    setList(next);
    onChange(next);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name?.trim() || !draft.address?.trim() || !draft.city?.trim() || !draft.postcode?.trim()) {
      return ToastService.error('Fill in name, street, city and postcode.');
    }
    setSaving(true);
    try {
      const { tempId: _omit, ...body } = draft;
      void _omit;
      if (draft._id) {
        await axios.put(`${base}/addresses/${draft._id}`, body, { headers });
        commit(list.map(a => (a._id === draft._id ? draft : a)));
      } else {
        const { data } = await axios.post(`${base}/addresses`, body, { headers });
        commit(Array.isArray(data?.addresses) ? data.addresses : [...list, draft]);
      }
      setDraft(null);
      ToastService.success('Address saved.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t save the address.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${base}/addresses/${toDelete}`, { headers });
      commit(list.filter(a => a._id !== toDelete));
      ToastService.success('Address removed.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t remove the address.'));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft(d => (d ? { ...d, [k]: e.target.value } : d));

  return (
    <SectionCard
      title="Addresses"
      description="Where you ship from and where orders are delivered."
      icon={MapPin}
      action={
        !draft ? (
          <Btn variant="secondary" size="sm" icon={Plus} onClick={() => setDraft(emptyAddress())}>
            Add
          </Btn>
        ) : null
      }
    >
      {draft ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            save();
          }}
          className="space-y-4 rounded-2xl bg-[#FAF8FB] p-4"
        >
          <div role="radiogroup" aria-label="Address type" className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-[#ECE8EE]">
            {['Shipping to', 'Shipping from'].map(t => (
              <button key={t} type="button" role="radio" aria-checked={draft.type === t} onClick={() => setDraft({ ...draft, type: t })} className={`h-10 rounded-lg text-[13.5px] font-medium ${draft.type === t ? 'bg-[#611192] text-white' : 'text-[#6B686E]'}`}>
                {t === 'Shipping to' ? 'Delivery address' : 'Ship-from address'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
            <AuthField label="Full name" autoComplete="name" value={draft.name || ''} onChange={set('name')} className="col-span-2 sm:col-span-1" />
            <AuthField label="Street address" autoComplete="street-address" value={draft.address || ''} onChange={set('address')} className="col-span-2 sm:col-span-1" />
            <AuthField label="City" autoComplete="address-level2" value={draft.city || ''} onChange={set('city')} />
            <AuthField label="Postcode / ZIP" autoComplete="postal-code" value={draft.postcode || ''} onChange={set('postcode')} />
            <AuthField label="Country" autoComplete="country-name" value={draft.country || ''} onChange={set('country')} className="col-span-2 sm:col-span-1" />
          </div>
          <div className="flex justify-end gap-2 sm:flex-col-reverse">
            <Btn variant="secondary" onClick={() => setDraft(null)} className="sm:w-full">
              Cancel
            </Btn>
            <Btn type="submit" loading={saving} className="sm:w-full">
              Save address
            </Btn>
          </div>
        </form>
      ) : null}

      {list.length ? (
        <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-1 ${draft ? 'mt-4' : ''}`}>
          {list.map(a => (
            <li key={a._id || a.tempId} className="flex items-start gap-3 rounded-2xl p-4 ring-1 ring-[#ECE8EE]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[#611192]">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-[#474648]">
                <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-[#611192] uppercase">{a.type === 'Shipping from' ? 'Ship from' : 'Delivery'}</p>
                <p className="font-medium text-[#0B0112]">{a.name}</p>
                <p className="truncate">{a.address}</p>
                <p>{[a.city, a.postcode].filter(Boolean).join(', ')}</p>
                <p>{a.country}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => setDraft({ ...a })} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B686E] hover:bg-[#F4F1F6]" aria-label="Edit address">
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                {a._id ? (
                  <button type="button" onClick={() => setToDelete(a._id!)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B0002A] hover:bg-[#FFF1F4]" aria-label="Delete address">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : !draft ? (
        <p className="rounded-2xl bg-[#FAF8FB] px-4 py-5 text-center text-[13.5px] text-[#6B686E]">No addresses yet. Add one to speed up checkout and shipping labels.</p>
      ) : null}

      <ConfirmDialog open={Boolean(toDelete)} title="Remove this address?" body="You can add it again later." confirmLabel="Remove" loading={deleting} onConfirm={remove} onClose={() => setToDelete(null)} />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ billing */

const emptyBilling = (): BillingAddress => ({ name: '', address: '', city: '', country: '', postCode: '' });

function BillingCard({ base, token, initial, addresses }: { base: string; token?: string; initial: Payment[]; addresses: Address[] }) {
  const [list, setList] = useState<Payment[]>(initial);
  const [draft, setDraft] = useState<(Payment & { index: number | null }) | null>(null);
  const [useShipping, setUseShipping] = useState(false);
  const [shippingId, setShippingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const start = (index: number | null) => {
    const m = index != null ? list[index] : undefined;
    setDraft({ index, nameAccountHolder: m?.nameAccountHolder || '', stripePaymentMethodId: m?.stripePaymentMethodId, billingAddress: { ...emptyBilling(), ...(m?.billingAddress || {}) } });
    setUseShipping(Boolean(m?.useShippingAsBilling));
    setShippingId('');
  };

  const save = async () => {
    if (!draft) return;
    let billingAddress = { ...(draft.billingAddress || emptyBilling()) };
    if (useShipping) {
      const s = addresses.find(a => a._id === shippingId);
      if (!s) return ToastService.error('Choose which address to use.');
      billingAddress = { name: s.name, address: s.address, city: s.city, country: s.country, postCode: s.postcode };
    } else if (!billingAddress.postCode) {
      return ToastService.error('Add a postcode for the billing address.');
    }
    if (!draft.nameAccountHolder?.trim()) return ToastService.error('Enter the name on the card.');
    const payload: Record<string, unknown> = { nameAccountHolder: draft.nameAccountHolder.trim(), billingAddress, useShippingAsBilling: useShipping };
    if (draft.stripePaymentMethodId) payload.stripePaymentMethodId = draft.stripePaymentMethodId;
    setSaving(true);
    try {
      if (draft.index != null && list[draft.index]?._id) {
        await axios.put(`${base}/payments/${list[draft.index]._id}`, payload, { headers });
        setList(list.map((p, i) => (i === draft.index ? { ...p, ...(payload as Payment) } : p)));
      } else {
        const { data } = await axios.post(`${base}/payments`, payload, { headers });
        const added = Array.isArray(data?.payments) ? data.payments.slice(-1)[0] : payload;
        setList([...list, added as Payment]);
      }
      setDraft(null);
      ToastService.success('Billing details saved.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t save billing details.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${base}/payments/${toDelete}`, { headers });
      setList(list.filter(p => p._id !== toDelete));
      ToastService.success('Billing details removed.');
    } catch (e) {
      ToastService.error(errMsg(e, 'Couldn’t remove billing details.'));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const setB = (k: keyof BillingAddress) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft(d => (d ? { ...d, billingAddress: { ...(d.billingAddress || {}), [k]: e.target.value } } : d));
  const shipTo = addresses.filter(a => a._id);

  return (
    <SectionCard
      title="Billing details"
      description="Card numbers are never stored here. Stripe handles payment securely at checkout."
      icon={CreditCard}
      action={
        !draft ? (
          <Btn variant="secondary" size="sm" icon={Plus} onClick={() => start(null)}>
            Add
          </Btn>
        ) : null
      }
    >
      {draft ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            save();
          }}
          className="space-y-4 rounded-2xl bg-[#FAF8FB] p-4"
        >
          <AuthField label="Name on card" autoComplete="cc-name" value={draft.nameAccountHolder || ''} onChange={e => setDraft({ ...draft, nameAccountHolder: e.target.value })} />
          {shipTo.length ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-[#ECE8EE]">
              <input type="checkbox" checked={useShipping} onChange={e => setUseShipping(e.target.checked)} className="h-[18px]! w-[18px]! accent-[#611192]" />
              <span className="text-[14px] text-[#0B0112]">Use one of my saved addresses</span>
            </label>
          ) : null}
          {useShipping ? (
            <div>
              <label htmlFor="billing-ship" className="mb-1.5 block text-[13px] font-medium text-[#2A2730]">
                Address
              </label>
              <select id="billing-ship" value={shippingId} onChange={e => setShippingId(e.target.value)} className="w-full">
                <option value="">Choose an address</option>
                {shipTo.map(a => (
                  <option key={a._id} value={a._id}>
                    {[a.name, a.address, a.city].filter(Boolean).join(', ')}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <AuthField label="Billing name" value={draft.billingAddress?.name || ''} onChange={setB('name')} className="col-span-2 sm:col-span-1" />
              <AuthField label="Street address" autoComplete="billing street-address" value={draft.billingAddress?.address || ''} onChange={setB('address')} className="col-span-2 sm:col-span-1" />
              <AuthField label="City" autoComplete="billing address-level2" value={draft.billingAddress?.city || ''} onChange={setB('city')} />
              <AuthField label="Postcode / ZIP" autoComplete="billing postal-code" value={draft.billingAddress?.postCode || ''} onChange={setB('postCode')} />
              <AuthField label="Country" autoComplete="billing country-name" value={draft.billingAddress?.country || ''} onChange={setB('country')} className="col-span-2 sm:col-span-1" />
            </div>
          )}
          <div className="flex justify-end gap-2 sm:flex-col-reverse">
            <Btn variant="secondary" onClick={() => setDraft(null)} className="sm:w-full">
              Cancel
            </Btn>
            <Btn type="submit" loading={saving} className="sm:w-full">
              Save billing details
            </Btn>
          </div>
        </form>
      ) : null}

      {list.length ? (
        <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-1 ${draft ? 'mt-4' : ''}`}>
          {list.map((p, i) => (
            <li key={p._id || i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B264F] to-[#0B0112] p-4 text-white">
              <div className="flex items-start justify-between">
                <CreditCard className="h-6 w-6 text-white/80" aria-hidden />
                <div className="flex gap-1">
                  <button type="button" onClick={() => start(i)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10" aria-label="Edit billing details">
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  {p._id ? (
                    <button type="button" onClick={() => setToDelete(p._id!)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10" aria-label="Remove billing details">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="mt-6 text-[15px] font-semibold tracking-wide">{p.nameAccountHolder || 'Card holder'}</p>
              <p className="mt-0.5 truncate text-[12.5px] text-white/65">{[p.billingAddress?.address, p.billingAddress?.city, p.billingAddress?.postCode].filter(Boolean).join(', ') || 'Billing address'}</p>
            </li>
          ))}
        </ul>
      ) : !draft ? (
        <p className="rounded-2xl bg-[#FAF8FB] px-4 py-5 text-center text-[13.5px] text-[#6B686E]">No billing details saved.</p>
      ) : null}

      <ConfirmDialog open={Boolean(toDelete)} title="Remove billing details?" confirmLabel="Remove" loading={deleting} onConfirm={remove} onClose={() => setToDelete(null)} />
    </SectionCard>
  );
}
