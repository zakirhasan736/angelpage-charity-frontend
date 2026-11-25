'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { CalendarClock, Check, History, Send } from 'lucide-react';
import { AuthField } from '@/components/auth/AuthKit';
import { Btn, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';

type SocialLog = {
  _id: string;
  platform: string;
  status: string;
  trigger: string;
  error?: string;
  createdAt: string;
  productId?: { name?: string };
};

type ScheduledPost = {
  _id: string;
  scheduledFor: string;
  status: string;
  platforms: string[];
  productId?: { name?: string };
};

const SocialDashboard = () => {
  const { data: session } = useSession() || {};
  const [logs, setLogs] = useState<SocialLog[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    productId: '',
    scheduledFor: '',
    platforms: 'facebook,instagram',
  });
  const [listings, setListings] = useState<{ id: string; name?: string }[]>([]);
  const role = session?.user?.role;
  const listingRole = role === 'CHARITY' || role === 'CHARITY_STAFF' ? 'CHARITY' : role === 'USER' ? 'USER' : null;

  useEffect(() => {
    if (!session?.token || !listingRole) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/products/listings`, { params: { role: listingRole, status: 'LIVE' }, headers: { Authorization: `Bearer ${session.token}` } })
      .then(r => setListings((r.data?.products || []).map((p: { id: string; name?: string }) => ({ id: String(p.id), name: p.name }))))
      .catch(() => setListings([]));
  }, [session?.token, listingRole]);

  const selectedPlatforms = scheduleForm.platforms.split(',').map(x => x.trim()).filter(Boolean);
  const togglePlatform = (p: string) => {
    const next = selectedPlatforms.includes(p) ? selectedPlatforms.filter(x => x !== p) : [...selectedPlatforms, p];
    setScheduleForm(f => ({ ...f, platforms: next.join(',') }));
  };

  const headers = session?.token
    ? { Authorization: `Bearer ${session.token}` }
    : undefined;

  const load = useCallback(async () => {
    if (!session?.token) return;
    try {
      const [logRes, schedRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/social/logs`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/social/scheduled`, { headers }),
      ]);
      setLogs(logRes.data.logs || []);
      setScheduled(schedRes.data.posts || []);
    } catch {
      ToastService.error('Could not load social post data.');
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  const triggerPost = async () => {
    if (!scheduleForm.productId.trim()) {
      ToastService.error('Choose a listing to post.');
      return;
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/social/trigger`,
        {
          productId: scheduleForm.productId.trim(),
          platforms: scheduleForm.platforms.split(',').map((s) => s.trim()),
        },
        { headers },
      );
      ToastService.success('Post queued.');
      setTimeout(load, 2000);
    } catch {
      ToastService.error('Failed to queue post.');
    }
  };

  const schedulePost = async () => {
    if (!scheduleForm.productId || !scheduleForm.scheduledFor) {
      ToastService.error('Choose a listing and a date and time.');
      return;
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/social/schedule`,
        {
          productId: scheduleForm.productId.trim(),
          scheduledFor: scheduleForm.scheduledFor,
          platforms: scheduleForm.platforms.split(',').map((s) => s.trim()),
        },
        { headers },
      );
      ToastService.success('Post scheduled.');
      await load();
    } catch {
      ToastService.error('Schedule failed.');
    }
  };

  const cancelScheduled = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/social/scheduled/${id}`, { headers });
      ToastService.success('Scheduled post cancelled.');
      await load();
    } catch {
      ToastService.error('Couldn’t cancel that post.');
    }
  };

  const PLATFORMS = [
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'twitter', label: 'X (Twitter)' },
  ];

  return (
    <div className="social-dashboard space-y-5">
      <SectionCard icon={Send} title="Share a listing" description="Post now or schedule for later on your connected social accounts.">
        <div className="space-y-4">
          {listings.length ? (
            <div>
              <label htmlFor="social-listing" className="mb-1.5 block text-[13px] font-medium text-[#2A2730]">
                Listing
              </label>
              <select id="social-listing" className="w-full" value={scheduleForm.productId} onChange={e => setScheduleForm({ ...scheduleForm, productId: e.target.value })}>
                <option value="">Choose a live listing</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name || l.id}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <AuthField label="Product ID" value={scheduleForm.productId} onChange={e => setScheduleForm({ ...scheduleForm, productId: e.target.value })} hint="Paste the ID of a live listing." />
          )}
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-[#2A2730]">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const on = selectedPlatforms.includes(p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={on} onClick={() => togglePlatform(p.id)} className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium ring-1 transition ${on ? 'bg-[#611192] text-white ring-[#611192]' : 'bg-white text-[#474648] ring-[#E2DCE6] hover:ring-[#611192]'}`}>
                    {on ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <AuthField label="Schedule for (optional)" type="datetime-local" value={scheduleForm.scheduledFor} onChange={e => setScheduleForm({ ...scheduleForm, scheduledFor: e.target.value })} />
          <div className="flex flex-wrap gap-2 border-t border-[#F3EFF5] pt-4 sm:flex-col">
            <Btn icon={Send} onClick={triggerPost} disabled={!selectedPlatforms.length}>
              Post now
            </Btn>
            <Btn variant="secondary" icon={CalendarClock} onClick={schedulePost} disabled={!scheduleForm.scheduledFor || !selectedPlatforms.length}>
              Schedule
            </Btn>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={CalendarClock} title={`Scheduled (${scheduled.length})`}>
        {scheduled.length === 0 ? (
          <p className="rounded-2xl bg-[#FAF8FB] px-4 py-5 text-center text-[13.5px] text-[#6B686E]">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {scheduled.map(s => (
              <li key={s._id} className="flex flex-wrap items-center gap-3 rounded-2xl p-3 ring-1 ring-[#ECE8EE]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[#0B0112]">{s.productId?.name || 'Listing'}</p>
                  <p className="text-[12px] text-[#8A888C]">
                    {new Date(s.scheduledFor).toLocaleString()} · {s.platforms?.join(', ')}
                  </p>
                </div>
                <StatusPill status={s.status} />
                {s.status === 'scheduled' ? (
                  <Btn size="sm" variant="ghost" onClick={() => cancelScheduled(s._id)} className="text-[#B0002A]!">
                    Cancel
                  </Btn>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard icon={History} title="Activity">
        {logs.length === 0 ? (
          <p className="rounded-2xl bg-[#FAF8FB] px-4 py-5 text-center text-[13.5px] text-[#6B686E]">No posts yet.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-[#F3EFF5] overflow-y-auto">
            {logs.map(log => (
              <li key={log._id} className="flex items-start gap-3 py-3">
                <StatusPill status={log.status} tone={log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'amber'} />
                <div className="min-w-0 flex-1 text-[13px]">
                  <p className="text-[#0B0112]">
                    <span className="font-medium capitalize">{log.platform}</span> · {log.productId?.name || 'Listing'}
                  </p>
                  <p className="text-[12px] text-[#8A888C]">
                    {log.trigger} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                  {log.error ? <p className="mt-1 text-[12px] text-[#B0002A]">{log.error}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default SocialDashboard;
