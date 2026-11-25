'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { CalendarDays, Newspaper, Send, ShieldCheck } from 'lucide-react';
import { AuthField, AuthTextarea } from '@/components/auth/AuthKit';
import { Btn, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import AiAssistButton from '@/components/ai/AiAssistButton';
import TagPills from '@/components/ai/TagPills';
import { enhanceBlogSeo, suggestEvent } from '@/lib/aiApi';

const CharityCommunityPanel = () => {
  const { data: session } = useSession() || {};
  const [tab, setTab] = useState<'blog' | 'events'>('blog');
  const [myPosts, setMyPosts] = useState<{ title: string; status: string }[]>(
    []
  );
  const [myEvents, setMyEvents] = useState<{ title: string; status: string }[]>(
    []
  );
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'stories',
    tags: [] as string[],
  });
  const [eventForm, setEventForm] = useState({
    title: '',
    excerpt: '',
    description: '',
    eventType: 'donation',
    category: 'community',
    topic: '',
    donationGoal: '',
    donationUrl: '',
    liveStreamUrl: '',
    pollQuestion: '',
    pollOptions: '',
  });
  const [aiLoading, setAiLoading] = useState(false);

  const api = process.env.NEXT_PUBLIC_API_URL;
  const token = session?.token;

  const loadMine = useCallback(async () => {
    if (!token) return;
    try {
      const [blogRes, eventsRes] = await Promise.all([
        axios.get(`${api}/blog/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${api}/events/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMyPosts(blogRes.data.posts || []);
      setMyEvents(eventsRes.data.events || []);
    } catch {
      /* optional */
    }
  }, [api, token]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const submitBlog = async () => {
    if (!blogForm.title.trim()) {
      ToastService.error('Title is required.');
      return;
    }
    try {
      const body = new FormData();
      body.append('title', blogForm.title);
      body.append('excerpt', blogForm.excerpt);
      body.append('content', blogForm.content);
      body.append('category', blogForm.category);
      body.append('status', 'pending_review');
      if (blogForm.tags.length) {
        body.append('tags', JSON.stringify(blogForm.tags));
      }

      await axios.post(`${api}/blog`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      ToastService.success('Blog submitted for review.');
      setBlogForm({ title: '', excerpt: '', content: '', category: 'stories', tags: [] });
      loadMine();
    } catch {
      ToastService.error('Failed to submit blog post.');
    }
  };

  const submitEvent = async () => {
    if (!eventForm.title.trim()) {
      ToastService.error('Title is required.');
      return;
    }
    try {
      const body = new FormData();
      Object.entries(eventForm).forEach(([key, val]) => {
        if (key === 'pollOptions' && val) {
          const options = String(val)
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean);
          body.append('pollOptions', JSON.stringify(options));
        } else if (val) {
          body.append(key, String(val));
        }
      });

      await axios.post(`${api}/events`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      ToastService.success('Event submitted for review.');
      setEventForm({
        title: '',
        excerpt: '',
        description: '',
        eventType: 'donation',
        category: 'community',
        topic: '',
        donationGoal: '',
        donationUrl: '',
        liveStreamUrl: '',
        pollQuestion: '',
        pollOptions: '',
      });
      loadMine();
    } catch {
      ToastService.error('Failed to submit event.');
    }
  };

  const aiBlog = async () => {
    if (!token) return;
    setAiLoading(true);
    try {
      const result = await enhanceBlogSeo(blogForm, token);
      setBlogForm(f => ({
        ...f,
        title: result.title || f.title,
        excerpt: result.excerpt || f.excerpt,
        content: result.content || f.content,
        category: result.category || f.category,
        tags: result.tags || f.tags,
      }));
      ToastService.success('AI generated blog SEO copy.');
    } catch {
      ToastService.error('Blog AI failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const aiEvent = async () => {
    if (!token) return;
    setAiLoading(true);
    try {
      const result = await suggestEvent(eventForm, token);
      setEventForm(f => ({
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
      ToastService.success('AI suggested event details.');
    } catch {
      ToastService.error('Event AI failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const submissions = tab === 'blog' ? myPosts : myEvents;

  return (
    <div className="charity-community-panel space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Content type" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#F1ECF4] p-1 sm:w-full">
          {([
            { id: 'blog', label: 'Blog post', icon: Newspaper },
            { id: 'events', label: 'Event or appeal', icon: CalendarDays },
          ] as const).map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-medium transition ${tab === t.id ? 'bg-white text-[#611192] shadow-[0_4px_14px_rgba(59,5,92,0.12)]' : 'text-[#6B686E]'}`}
            >
              <t.icon className="h-4 w-4" aria-hidden /> {t.label}
            </button>
          ))}
        </div>
        <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[#8A888C]">
          <ShieldCheck className="h-4 w-4 text-[#611192]" aria-hidden /> Reviewed by Angelpage before it goes live
        </p>
      </div>

      {tab === 'blog' ? (
        <SectionCard icon={Newspaper} title="Write a blog post" description="Share a story, a thank-you or an update. Good posts appear on the journal and homepage." action={<AiAssistButton label="✨ AI assist" loading={aiLoading} onClick={aiBlog} />}>
          <form
            onSubmit={e => {
              e.preventDefault();
              submitBlog();
            }}
            className="space-y-4"
          >
            <AuthField label="Title" value={blogForm.title} onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. How your sales funded 40 warm meals" />
            <AuthTextarea label="Summary" rows={2} value={blogForm.excerpt} onChange={e => setBlogForm(f => ({ ...f, excerpt: e.target.value }))} hint="One or two sentences shown on the blog card." />
            <AuthTextarea label="Article" rows={8} value={blogForm.content} onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))} />
            <TagPills tags={blogForm.tags} />
            <div className="flex justify-end">
              <Btn type="submit" icon={Send} className="sm:w-full">
                Submit for review
              </Btn>
            </div>
          </form>
        </SectionCard>
      ) : (
        <SectionCard icon={CalendarDays} title="Create an event or appeal" description="Run a donation drive, a live session or a community event." action={<AiAssistButton label="✨ AI suggest" loading={aiLoading} onClick={aiEvent} />}>
          <form
            onSubmit={e => {
              e.preventDefault();
              submitEvent();
            }}
            className="space-y-4"
          >
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-[#2A2730]">Type</p>
              <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-xl bg-[#F4F1F6] p-1 sm:grid-cols-1">
                {[
                  { v: 'donation', l: 'Donation drive' },
                  { v: 'live_session', l: 'Live session' },
                  { v: 'general', l: 'Community event' },
                ].map(o => (
                  <button key={o.v} type="button" role="radio" aria-checked={eventForm.eventType === o.v} onClick={() => setEventForm(f => ({ ...f, eventType: o.v }))} className={`h-10 rounded-lg text-[13px] font-medium ${eventForm.eventType === o.v ? 'bg-white text-[#611192] shadow-sm' : 'text-[#6B686E]'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <AuthField label="Topic or theme (optional)" value={eventForm.topic} onChange={e => setEventForm(f => ({ ...f, topic: e.target.value }))} hint="Helps AI suggest a title and copy." />
            <AuthField label="Title" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} />
            <AuthTextarea label="Short summary" rows={2} value={eventForm.excerpt} onChange={e => setEventForm(f => ({ ...f, excerpt: e.target.value }))} />
            <AuthTextarea label="Details" rows={5} value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <AuthField label="Donation goal" inputMode="decimal" value={eventForm.donationGoal} onChange={e => setEventForm(f => ({ ...f, donationGoal: e.target.value }))} placeholder="e.g. 2500" />
              <AuthField
                label={eventForm.eventType === 'live_session' ? 'Live stream link' : 'Donation link'}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={eventForm.donationUrl || eventForm.liveStreamUrl}
                onChange={e => {
                  const v = e.target.value;
                  setEventForm(f => ({
                    ...f,
                    donationUrl: f.eventType === 'donation' ? v : f.donationUrl,
                    liveStreamUrl: f.eventType === 'live_session' ? v : f.liveStreamUrl,
                  }));
                }}
              />
            </div>
            <div className="flex justify-end">
              <Btn type="submit" icon={Send} className="sm:w-full">
                Submit for review
              </Btn>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title={tab === 'blog' ? 'Your posts' : 'Your events'} description="Status updates once our team has reviewed them.">
        {submissions.length === 0 ? (
          <p className="rounded-2xl bg-[#FAF8FB] px-4 py-5 text-center text-[13.5px] text-[#6B686E]">Nothing submitted yet.</p>
        ) : (
          <ul className="divide-y divide-[#F3EFF5]">
            {submissions.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 truncate text-[14px] text-[#0B0112]">{p.title || 'Untitled'}</span>
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default CharityCommunityPanel;
