'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Check, Newspaper, PenSquare, Send, X } from 'lucide-react';
import { AuthField, AuthTextarea } from '@/components/auth/AuthKit';
import { Btn, EmptyState, humanizeStatus, RowSkeleton, SectionCard, StatusPill, Toolbar } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import Link from 'next/link';
import AiAssistButton from '@/components/ai/AiAssistButton';
import TagPills from '@/components/ai/TagPills';
import { enhanceBlogSeo } from '@/lib/aiApi';

interface BlogPost {
  _id: string;
  title: string;
  excerpt?: string;
  content?: string;
  status: string;
  category?: string;
  authorRole?: string;
  createdAt: string;
}

const BlogAdmin: React.FC = () => {
  const { data: session } = useSession() || {};
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'general',
    tags: [] as string[],
    metaTitle: '',
    metaDescription: '',
    keywords: [] as string[],
  });
  const [aiLoading, setAiLoading] = useState(false);

  const api = process.env.NEXT_PUBLIC_API_URL;
  const token = session?.token;

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${api}/blog/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: statusFilter ? { status: statusFilter } : {},
      });
      setPosts(res.data.posts || []);
    } catch {
      ToastService.error('Failed to load blog posts.');
    } finally {
      setLoading(false);
    }
  }, [api, token, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const publishPost = async (postId: string) => {
    try {
      await axios.patch(
        `${api}/blog/${postId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      ToastService.success('Post published.');
      fetchPosts();
    } catch {
      ToastService.error('Failed to publish post.');
    }
  };

  const createPost = async () => {
    if (!form.title.trim()) {
      ToastService.error('Title is required.');
      return;
    }
    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('excerpt', form.excerpt);
      body.append('content', form.content);
      body.append('category', form.category);
      body.append('status', 'published');
      if (form.tags.length) {
        body.append('tags', JSON.stringify(form.tags));
      }

      await axios.post(`${api}/blog`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      ToastService.success('Post published.');
      setForm({
        title: '',
        excerpt: '',
        content: '',
        category: 'general',
        tags: [],
        metaTitle: '',
        metaDescription: '',
        keywords: [],
      });
      setEditorOpen(false);
      fetchPosts();
    } catch {
      ToastService.error('Failed to create post.');
    }
  };

  const handleAiBlog = async () => {
    if (!token) return;
    setAiLoading(true);
    try {
      const result = await enhanceBlogSeo(
        {
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
        },
        token,
      );
      setForm(f => ({
        ...f,
        title: result.title || f.title,
        excerpt: result.excerpt || f.excerpt,
        content: result.content || f.content,
        category: result.category || f.category,
        tags: result.tags || f.tags,
        metaTitle: result.metaTitle || f.metaTitle,
        metaDescription: result.metaDescription || f.metaDescription,
        keywords: result.keywords || f.keywords,
      }));
      ToastService.success('AI generated SEO-friendly blog copy.');
    } catch {
      ToastService.error('Blog AI assist failed. Check GEMINI_API_KEY.');
    } finally {
      setAiLoading(false);
    }
  };

  const CATEGORIES = ['general', 'stories', 'impact', 'sustainability', 'fashion', 'community', 'guides', 'news'];
  const counter = (v: string, max: number) => <span className={v.length > max ? 'text-[#C0143C]' : ''}>{v.length}/{max}</span>;

  return (
    <div className="blog-admin space-y-5">
      <Toolbar
        value={statusFilter}
        onFilter={setStatusFilter}
        filters={[
          { id: 'pending_review', label: 'Needs review' },
          { id: 'published', label: 'Published' },
          { id: 'draft', label: 'Drafts' },
          { id: '', label: 'All' },
        ]}
        trailing={
          <Btn icon={editorOpen ? X : PenSquare} variant={editorOpen ? 'secondary' : 'primary'} onClick={() => setEditorOpen(!editorOpen)} className="sm:w-full">
            {editorOpen ? 'Close editor' : 'New post'}
          </Btn>
        }
      />

      {editorOpen ? (
        <SectionCard icon={PenSquare} title="New post" description={<>Published posts appear on the <Link href="/blog" className="font-medium text-[#611192] underline">journal</Link> and homepage.</>} action={<AiAssistButton label="✨ AI SEO assist" loading={aiLoading} onClick={handleAiBlog} />}>
          <form
            onSubmit={e => {
              e.preventDefault();
              createPost();
            }}
            className="space-y-4"
          >
            <AuthField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <AuthTextarea label="Excerpt" rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-[#2A2730]">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" aria-pressed={form.category === c} onClick={() => setForm({ ...form, category: c })} className={`h-8 rounded-full px-3 text-[12.5px] font-medium capitalize ${form.category === c ? 'bg-[#611192] text-white' : 'bg-[#F4F1F6] text-[#474648]'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <AuthTextarea label="Content" rows={10} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} hint="HTML or plain text." />
            <div className="space-y-3 rounded-2xl bg-[#FAF8FB] p-4">
              <p className="text-[13px] font-semibold text-[#0B0112]">Search appearance</p>
              <AuthField label="Meta title" value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} hint={counter(form.metaTitle, 60)} />
              <AuthTextarea label="Meta description" rows={2} value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} hint={`${form.metaDescription.length}/160`} />
              <TagPills tags={form.tags} onRemove={tag => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))} />
              {form.keywords.length > 0 ? <p className="text-[12px] text-[#8A888C]">Keywords: {form.keywords.join(', ')}</p> : null}
            </div>
            <div className="flex justify-end">
              <Btn type="submit" icon={Send} className="sm:w-full">
                Publish now
              </Btn>
            </div>
          </form>
        </SectionCard>
      ) : null}

      {loading ? (
        <RowSkeleton rows={3} />
      ) : posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts here" body={statusFilter === 'pending_review' ? 'Nothing waiting for review.' : 'Try another filter.'} />
      ) : (
        <ul className="space-y-2">
          {posts.map(post => (
            <li key={post._id} className="flex flex-wrap items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#ECE8EE]">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#0B0112]">{post.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#8A888C]">
                  <StatusPill status={post.status === 'pending_review' ? 'Needs review' : post.status} tone={post.status === 'published' ? 'green' : post.status === 'pending_review' ? 'amber' : 'grey'} />
                  {humanizeStatus(post.authorRole || 'author')} · {new Date(post.createdAt).toLocaleDateString()}
                </p>
                {post.excerpt ? <p className="mt-2 line-clamp-2 text-[13.5px] text-[#474648]">{post.excerpt}</p> : null}
              </div>
              {post.status === 'pending_review' ? (
                <Btn size="sm" icon={Check} onClick={() => publishPost(post._id)} className="sm:w-full">
                  Approve &amp; publish
                </Btn>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlogAdmin;
