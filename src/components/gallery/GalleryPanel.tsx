'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Camera, Circle, Clapperboard, FileText, Film, Image as ImageIcon, Send, Square, UploadCloud, Video, X } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { AuthField, AuthTextarea } from '@/components/auth/AuthKit';
import { Btn, EmptyState, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import SocialPostingToggles, {
  defaultSocialPostingPrefs,
  type SocialPostingPrefs,
} from '@/components/product/SocialPostingToggles';

type GalleryItem = {
  _id: string;
  title: string;
  slug: string;
  caption?: string;
  kind: string;
  status: string;
  media: {
    url: string;
    thumbnailUrl?: string;
    mediaType: string;
  };
  authorName?: string;
};

type UploadMode = 'photo' | 'reel' | 'record' | 'camera' | 'document';

interface GalleryPanelProps {
  allowModeration?: boolean;
}

const GalleryPanel = ({ allowModeration = false }: GalleryPanelProps) => {
  const { data: session } = useSession() || {};
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [mode, setMode] = useState<UploadMode>('photo');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('impact');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [socialPosting, setSocialPosting] = useState<SocialPostingPrefs>(
    defaultSocialPostingPrefs(),
  );
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [recording, setRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const api = process.env.NEXT_PUBLIC_API_URL;
  const token = session?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const loadItems = useCallback(async () => {
    if (!token) return;
    try {
      const url = allowModeration
        ? `${api}/gallery/admin/all`
        : `${api}/gallery/mine`;
      const params = allowModeration && statusFilter ? { status: statusFilter } : {};
      const res = await axios.get(url, { headers, params });
      setItems(res.data.items || []);
    } catch {
      ToastService.error('Could not load gallery.');
    }
  }, [api, token, allowModeration, statusFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const setSelectedFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : '');
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => {
    stopCamera();
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: mode === 'record',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      ToastService.error('Camera access denied or unavailable.');
    }
  };

  useEffect(() => {
    if (mode === 'camera' || mode === 'record') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [mode]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const f = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(f);
      ToastService.success('Photo captured — add title and publish.');
    }, 'image/jpeg', 0.92);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const f = new File([blob], `reel-${Date.now()}.webm`, { type: 'video/webm' });
      setSelectedFile(f);
      setRecording(false);
      ToastService.success('Reel recorded — add title and publish.');
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const submitItem = async (publishNow = false) => {
    if (!title.trim()) {
      ToastService.error('Title is required.');
      return;
    }
    if (!file) {
      ToastService.error('Add or capture media first.');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('media', file);
      body.append('title', title);
      body.append('caption', caption);
      if (tags.trim()) {
        body.append(
          'tags',
          JSON.stringify(
            tags
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean),
          ),
        );
      }
      body.append(
        'kind',
        mode === 'reel' || mode === 'record' ? 'reel' : mode === 'document' ? 'document' : 'photo',
      );
      body.append('socialPosting', JSON.stringify(socialPosting));
      if (allowModeration && publishNow) body.append('publishNow', 'true');

      await axios.post(`${api}/gallery`, body, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });

      ToastService.success(
        allowModeration && publishNow
          ? 'Published to gallery & social queue.'
          : 'Submitted for review.',
      );
      setTitle('');
      setCaption('');
      setTags('impact');
      setSelectedFile(null);
      await loadItems();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : 'Upload failed.';
      ToastService.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const shareItem = async (id: string) => {
    await axios.post(
      `${api}/gallery/${id}/share`,
      { platforms: ['facebook', 'instagram', 'tiktok', 'twitter'] },
      { headers },
    );
    ToastService.success('Sharing queued.');
  };

  const publishItem = async (id: string) => {
    await axios.patch(`${api}/gallery/${id}/publish`, {}, { headers });
    ToastService.success('Published.');
    loadItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Remove this gallery item?')) return;
    await axios.delete(`${api}/gallery/${id}`, { headers });
    loadItems();
  };

  const acceptMap: Record<UploadMode, string> = {
    photo: 'image/jpeg,image/png,image/webp',
    reel: 'video/mp4,video/webm,video/quicktime',
    record: 'video/*',
    camera: 'image/*',
    document: 'image/*,application/pdf',
  };

  const MODES = [
    { id: 'photo', label: 'Photo', icon: ImageIcon },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'reel', label: 'Reel', icon: Film },
    { id: 'record', label: 'Record', icon: Video },
    { id: 'document', label: 'Document', icon: FileText },
  ] as const;

  return (
    <div className="gallery-panel space-y-5">
      <SectionCard
        icon={Clapperboard}
        title="Post to your gallery"
        description={
          <>
            Share photos, reels and thank-you stories. Published items appear on{' '}
            <a href="/reels" className="font-medium text-[#611192] underline" target="_blank" rel="noreferrer">
              Reels
            </a>
            .
          </>
        }
      >
        <div className="space-y-4">
          <div role="tablist" aria-label="What are you posting?" className="grid grid-cols-5 gap-1 rounded-2xl bg-[#F1ECF4] p-1 sm:grid-cols-5">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => {
                  setMode(m.id);
                  setSelectedFile(null);
                }}
                className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12px] font-medium transition ${mode === m.id ? 'bg-white text-[#611192] shadow-[0_4px_14px_rgba(59,5,92,0.12)]' : 'text-[#6B686E]'}`}
              >
                <m.icon className="h-[18px] w-[18px]" aria-hidden />
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'camera' || mode === 'record' ? (
            <div className="space-y-3">
              <video ref={videoRef} className="aspect-video w-full rounded-2xl bg-[#0B0112] object-contain" playsInline muted={mode === 'camera'} />
              <div className="flex justify-center">
                {mode === 'camera' ? (
                  <Btn icon={Camera} onClick={capturePhoto}>
                    Capture photo
                  </Btn>
                ) : recording ? (
                  <Btn variant="danger" icon={Square} onClick={stopRecording}>
                    Stop recording
                  </Btn>
                ) : (
                  <Btn icon={Circle} onClick={startRecording}>
                    Start recording
                  </Btn>
                )}
              </div>
            </div>
          ) : (
            <div>
              <input ref={fileInputRef} type="file" accept={acceptMap[mode]} className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              {!preview ? (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#DCD3E1] bg-[#FAF8FB] px-6 py-10 text-center transition hover:border-[#611192] hover:bg-[#F6EEFA]">
                  <UploadCloud className="h-8 w-8 text-[#611192]" aria-hidden />
                  <span className="text-[14px] font-medium text-[#0B0112]">Choose a file</span>
                  <span className="text-[12px] text-[#8A888C]">{mode === 'reel' ? 'MP4 or MOV' : mode === 'document' ? 'PDF' : 'JPG, PNG or WebP'}</span>
                </button>
              ) : null}
            </div>
          )}

          {preview ? (
            <div className="relative overflow-hidden rounded-2xl bg-[#0B0112]">
              {file?.type.startsWith('video/') ? (
                <video src={preview} controls className="max-h-96 w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="max-h-96 w-full object-contain" />
              )}
              <button type="button" onClick={() => setSelectedFile(null)} className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#0B0112]" aria-label="Remove file">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}

          <AuthField label="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <AuthTextarea label="Caption (optional)" rows={2} value={caption} onChange={e => setCaption(e.target.value)} />
          <AuthField label="Tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="impact, thank-you" hint="Separate with commas. Use “impact” for thank-you stories donors can find on Reels." />

          <div className="rounded-2xl bg-[#FAF8FB] p-4">
            <SocialPostingToggles value={socialPosting} onChange={setSocialPosting} />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#F3EFF5] pt-4 sm:flex-col-reverse">
            {allowModeration ? (
              <Btn variant="secondary" loading={uploading} onClick={() => submitItem(false)}>
                Save as pending
              </Btn>
            ) : null}
            <Btn icon={Send} loading={uploading} onClick={() => submitItem(allowModeration)}>
              {allowModeration ? 'Publish now' : 'Submit for review'}
            </Btn>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={`${allowModeration ? 'Moderation queue' : 'Your gallery'} (${items.length})`}
        action={
          allowModeration ? (
            <select aria-label="Filter by status" className="h-9! w-auto! py-0! text-[13px]!" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="pending_review">Pending</option>
              <option value="published">Published</option>
              <option value="">All</option>
            </select>
          ) : null
        }
      >
        {items.length === 0 ? (
          <EmptyState icon={ImageIcon} title="Nothing here yet" body="Your photos and reels will appear here." />
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-2 sm:grid-cols-1">
            {items.map(item => (
              <li key={item._id} className="flex gap-3 rounded-2xl p-3 ring-1 ring-[#ECE8EE]">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F4F1F6]">
                  <Image src={item.media.thumbnailUrl || item.media.url} alt="" fill sizes="80px" className="object-cover" />
                  {item.kind === 'reel' ? <Film className="absolute right-1.5 bottom-1.5 h-4 w-4 text-white drop-shadow" aria-hidden /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#0B0112]">{item.title || 'Untitled'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusPill status={item.status === 'pending_review' ? 'In review' : item.status} tone={item.status === 'published' ? 'green' : item.status === 'pending_review' ? 'amber' : 'grey'} />
                    <span className="text-[11.5px] text-[#8A888C] capitalize">{item.kind}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.status === 'published' ? (
                      <a href={`/reels?item=${item.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-lg px-2.5 text-[12.5px] font-medium text-[#611192] hover:bg-[#F6EEFA]">
                        View
                      </a>
                    ) : null}
                    {item.status === 'published' ? (
                      <Btn size="sm" variant="ghost" onClick={() => shareItem(item._id)} className="h-8!">
                        Share
                      </Btn>
                    ) : null}
                    {allowModeration && item.status === 'pending_review' ? (
                      <Btn size="sm" onClick={() => publishItem(item._id)} className="h-8!">
                        Approve
                      </Btn>
                    ) : null}
                    <Btn size="sm" variant="ghost" onClick={() => deleteItem(item._id)} className="h-8! text-[#B0002A]! hover:bg-[#FFF1F4]!">
                      Remove
                    </Btn>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default GalleryPanel;
