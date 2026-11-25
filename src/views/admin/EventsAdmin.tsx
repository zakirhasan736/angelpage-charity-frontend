'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { CalendarDays, CalendarPlus, Check, ExternalLink, X } from 'lucide-react';
import { AuthField, AuthTextarea } from '@/components/auth/AuthKit';
import { Btn, EmptyState, humanizeStatus, SectionCard, StatusPill, Toolbar } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import AiAssistButton from '@/components/ai/AiAssistButton';
import { suggestEvent } from '@/lib/aiApi';

interface CommunityEvent {
  _id: string;
  title: string;
  status: string;
  eventType: string;
  featuredOnHomepage?: boolean;
  slug: string;
}

const EventsAdmin: React.FC = () => {
  const { data: session } = useSession() || {};
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    description: '',
    eventType: 'donation',
    category: 'community',
    donationGoal: '',
    donationUrl: '',
    liveStreamUrl: '',
    pollQuestion: '',
    pollOptions: '',
    featuredOnHomepage: false,
    publishNow: true,
    topic: '',
  });
  const [aiLoading, setAiLoading] = useState(false);

  const api = process.env.NEXT_PUBLIC_API_URL;
  const token = session?.token;

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${api}/events/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: statusFilter ? { status: statusFilter } : {},
      });
      setEvents(res.data.events || []);
    } catch {
      ToastService.error('Failed to load events.');
    }
  }, [api, token, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const publishEvent = async (eventId: string) => {
    try {
      await axios.patch(
        `${api}/events/${eventId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      ToastService.success('Event published.');
      fetchEvents();
    } catch {
      ToastService.error('Failed to publish event.');
    }
  };

  const createEvent = async () => {
    if (!form.title.trim()) {
      ToastService.error('Title is required.');
      return;
    }
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'pollOptions' && val) {
          const options = String(val)
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean);
          body.append('pollOptions', JSON.stringify(options));
        } else if (typeof val === 'boolean') {
          body.append(key, String(val));
        } else if (val !== '' && val !== undefined) {
          body.append(key, String(val));
        }
      });
      body.append('status', form.publishNow ? 'published' : 'pending_review');

      await axios.post(`${api}/events`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      ToastService.success('Event created.');
      setEditorOpen(false);
      fetchEvents();
    } catch {
      ToastService.error('Failed to create event.');
    }
  };

  const handleAiEvent = async () => {
    if (!token) return;
    setAiLoading(true);
    try {
      const result = await suggestEvent(
        {
          title: form.title,
          excerpt: form.excerpt,
          description: form.description,
          eventType: form.eventType,
          category: form.category,
          donationGoal: form.donationGoal,
          topic: form.topic,
        },
        token,
      );
      setForm(f => ({
        ...f,
        title: result.title || f.title,
        excerpt: result.excerpt || f.excerpt,
        description: result.description || f.description,
        eventType: result.eventType || f.eventType,
        category: result.category || f.category,
        topic: result.topic || f.topic,
        pollQuestion: result.pollQuestion || f.pollQuestion,
        pollOptions: result.pollOptions?.length
          ? result.pollOptions.join('\n')
          : f.pollOptions,
      }));
      ToastService.success('AI suggested event copy.');
    } catch {
      ToastService.error('Event AI assist failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const Toggle = ({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 ring-1 ring-[#ECE8EE]">
      <span>
        <span className="block text-[14px] font-medium text-[#0B0112]">{label}</span>
        <span className="block text-[12px] text-[#8A888C]">{hint}</span>
      </span>
      <input type="checkbox" className="sr-only" checked={on} onChange={e => onChange(e.target.checked)} />
      <span aria-hidden className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? 'bg-[#611192]' : 'bg-[#DCD5E0]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </label>
  );

  return (
    <div className="events-admin space-y-5">
      <Toolbar
        value={statusFilter}
        onFilter={setStatusFilter}
        filters={[
          { id: 'pending_review', label: 'Needs review' },
          { id: 'published', label: 'Published' },
          { id: '', label: 'All' },
        ]}
        trailing={
          <Btn icon={editorOpen ? X : CalendarPlus} variant={editorOpen ? 'secondary' : 'primary'} onClick={() => setEditorOpen(!editorOpen)} className="sm:w-full">
            {editorOpen ? 'Close' : 'New event'}
          </Btn>
        }
      />

      {editorOpen ? (
        <SectionCard icon={CalendarPlus} title="New event" description="Donation drives, live sessions and polls. Featured events show on the homepage." action={<AiAssistButton label="✨ AI suggest" loading={aiLoading} onClick={handleAiEvent} />}>
          <form
            onSubmit={e => {
              e.preventDefault();
              createEvent();
            }}
            className="space-y-4"
          >
            <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-xl bg-[#F4F1F6] p-1 sm:grid-cols-1">
              {[
                { v: 'donation', l: 'Donation drive' },
                { v: 'live_session', l: 'Live session' },
                { v: 'general', l: 'General event' },
              ].map(o => (
                <button key={o.v} type="button" role="radio" aria-checked={form.eventType === o.v} onClick={() => setForm(f => ({ ...f, eventType: o.v }))} className={`h-10 rounded-lg text-[13px] font-medium ${form.eventType === o.v ? 'bg-white text-[#611192] shadow-sm' : 'text-[#6B686E]'}`}>
                  {o.l}
                </button>
              ))}
            </div>
            <AuthField label="Topic (optional)" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} hint="AI uses this to suggest copy." />
            <AuthField label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <AuthTextarea label="Short summary" rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
            <AuthTextarea label="Full description" rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <AuthField label="Donation goal" inputMode="decimal" value={form.donationGoal} onChange={e => setForm(f => ({ ...f, donationGoal: e.target.value }))} />
              <AuthField label="Donation link" type="url" inputMode="url" placeholder="https://" value={form.donationUrl} onChange={e => setForm(f => ({ ...f, donationUrl: e.target.value }))} />
              <AuthField label="Live stream link" type="url" inputMode="url" placeholder="https://" value={form.liveStreamUrl} onChange={e => setForm(f => ({ ...f, liveStreamUrl: e.target.value }))} className="col-span-2 sm:col-span-1" />
            </div>
            <div className="space-y-3 rounded-2xl bg-[#FAF8FB] p-4">
              <p className="text-[13px] font-semibold text-[#0B0112]">Poll (optional)</p>
              <AuthField label="Question" value={form.pollQuestion} onChange={e => setForm(f => ({ ...f, pollQuestion: e.target.value }))} />
              <AuthTextarea label="Options" rows={3} value={form.pollOptions} onChange={e => setForm(f => ({ ...f, pollOptions: e.target.value }))} hint="One per line." />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <Toggle on={form.featuredOnHomepage} onChange={v => setForm(f => ({ ...f, featuredOnHomepage: v }))} label="Feature on homepage" hint="Shows in the events strip" />
              <Toggle on={form.publishNow} onChange={v => setForm(f => ({ ...f, publishNow: v }))} label="Publish immediately" hint="Otherwise saved for review" />
            </div>
            <div className="flex justify-end">
              <Btn type="submit" className="sm:w-full">
                Save event
              </Btn>
            </div>
          </form>
        </SectionCard>
      ) : null}

      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events here" body="Try another filter or create one." />
      ) : (
        <ul className="space-y-2">
          {events.map(ev => (
            <li key={ev._id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#ECE8EE]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[#611192]">
                <CalendarDays className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-[#0B0112]">{ev.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#8A888C]">
                  <StatusPill status={ev.status === 'pending_review' ? 'Needs review' : ev.status} tone={ev.status === 'published' ? 'green' : 'amber'} />
                  {humanizeStatus(ev.eventType)}
                  {ev.featuredOnHomepage ? <StatusPill status="Featured" tone="purple" /> : null}
                </p>
              </div>
              {ev.status === 'published' ? (
                <a href={`/events/${ev.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-[#611192] hover:bg-[#F6EEFA]">
                  View <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : (
                <Btn size="sm" icon={Check} onClick={() => publishEvent(ev._id)} className="sm:w-full">
                  Publish
                </Btn>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventsAdmin;
