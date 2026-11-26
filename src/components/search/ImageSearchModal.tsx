'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { shopHref } from '@/lib/shopUrls';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  Check,
  ClipboardPaste,
  ImagePlus,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import type { ListingAiResult } from '@/lib/aiApi';
import { resolveCategoryId } from '@/lib/aiApi';
import { formatMarketMoney } from '@/lib/marketPreference';
import { useLocale } from '@/i18n/LocaleProvider';

export type ImageSearchProduct = {
  _id: string;
  slug?: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  images?: Array<string | { url?: string }>;
  condition?: string;
  matchScore?: number;
};

export type Phase = 'idle' | 'scanning' | 'results' | 'error';

interface ImageSearchModalProps {
  open: boolean;
  previewUrl: string;
  phase: Phase;
  analysis?: ListingAiResult | null;
  products?: ImageSearchProduct[];
  error?: string;
  onClose: () => void;
  onRetry?: () => void;
  onSelectFile: (file: File) => void;
}

export function ScanFrameIcon({
  className = 'h-4 w-4',
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const productImage = (p: ImageSearchProduct) => {
  const first = p.images?.[0];
  if (!first) return '';
  return typeof first === 'string' ? first : first.url || '';
};

/** Shrink big phone photos before upload: faster on mobile data, same match quality. */
async function downscale(file: File, max = 1600): Promise<File> {
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.size < 600_000
  )
    return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise(r =>
      canvas.toBlob(r, 'image/jpeg', 0.86)
    );
    return blob
      ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', {
          type: 'image/jpeg',
        })
      : file;
  } catch {
    return file;
  }
}

const SCAN_STEPS = [
  'Reading colour and shape',
  'Spotting the type and brand',
  'Finding matches in the shop',
];
const TIPS = [
  { icon: Check, text: 'One item per photo' },
  { icon: Sun, text: 'Good light' },
  { icon: Lightbulb, text: 'Plain background helps' },
];

const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  open,
  previewUrl,
  phase,
  analysis,
  products = [],
  error,
  onClose,
  onRetry,
  onSelectFile,
}) => {
  const router = useRouter();
  const { locale } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');
  const [dragging, setDragging] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [pasteNote, setPasteNote] = useState('');
  const [canPaste, setCanPaste] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCanPaste(
      typeof navigator !== 'undefined' &&
        Boolean(navigator.clipboard && 'read' in navigator.clipboard)
    );
  }, []);

  const chips = useMemo(() => {
    if (!analysis) return [];
    const seen = new Set<string>();
    return [
      analysis.category,
      analysis.subcategory,
      analysis.brand,
      analysis.color,
      analysis.material,
      ...(analysis.searchKeywords || []).slice(0, 4),
    ]
      .filter((v): v is string => Boolean(v && v.trim()))
      .filter(v => {
        const k = v.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  }, [analysis]);

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      [p.name, p.brand, p.category, p.subcategory, p.condition]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [products, filter]);

  const categoryId = resolveCategoryId(analysis?.category);

  const take = useCallback(
    async (file?: File | null) => {
      if (!file || !file.type.startsWith('image/')) {
        if (file)
          setPasteNote('That file isn’t a photo. Try a JPG, PNG or WebP.');
        return;
      }
      setPasteNote('');
      setFilter('');
      onSelectFile(await downscale(file));
    },
    [onSelectFile]
  );

  // open/close: scroll lock, Esc, paste anywhere, focus
  useEffect(() => {
    if (!open) {
      setFilter('');
      setDragging(false);
      setPasteNote('');
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find(i =>
        i.type.startsWith('image/')
      );
      if (item) {
        e.preventDefault();
        take(item.getAsFile());
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('paste', onPaste);
    requestAnimationFrame(() =>
      dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    );
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('paste', onPaste);
    };
  }, [open, onClose, take]);

  // scanning steps (visual progress while the photo is read)
  useEffect(() => {
    if (phase !== 'scanning') {
      setScanStep(0);
      return;
    }
    const t = setInterval(
      () => setScanStep(s => Math.min(s + 1, SCAN_STEPS.length - 1)),
      1300
    );
    return () => clearInterval(t);
  }, [phase]);

  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find(t => t.startsWith('image/'));
        if (type) {
          const blob = await it.getType(type);
          take(new File([blob], 'pasted.' + type.split('/')[1], { type }));
          return;
        }
      }
      setPasteNote('No photo on your clipboard. Copy an image first.');
    } catch {
      setPasteNote(
        'Your browser blocked clipboard access. Press Ctrl+V (⌘V on Mac) instead.'
      );
    }
  };

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!open || !mounted) return null;

  const pickers = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </>
  );

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10060] flex items-center justify-center p-4 sm:items-end sm:p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-search-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0B0112]/60 backdrop-blur-[3px]"
          onClick={onClose}
          aria-hidden
        />

        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={`relative flex w-full flex-col overflow-hidden bg-white shadow-[0_40px_120px_rgba(11,1,18,0.35)] ${
            phase === 'results' ? 'max-w-[1040px]' : 'max-w-[640px]'
          } max-h-[min(92vh,820px)] rounded-[28px] sm:h-[92dvh] sm:max-h-none sm:rounded-b-none`}
          onDragOver={e => {
            e.preventDefault();
            if (phase !== 'scanning') setDragging(true);
          }}
          onDragLeave={e => {
            if (e.currentTarget === e.target) setDragging(false);
          }}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            if (phase !== 'scanning') take(e.dataTransfer.files?.[0]);
          }}
        >
          {pickers}
          {/* phone grabber */}
          <span
            className="mx-auto mt-2 hidden h-1.5 w-10 shrink-0 rounded-full bg-[#E2DCE6] sm:block"
            aria-hidden
          />

          <header className="flex shrink-0 items-center gap-3 px-6 pt-5 pb-4 sm:px-4 sm:pt-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#611192] to-[#3B055C] text-white">
              <ScanFrameIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="photo-search-title"
                className="font-primary text-[22px] leading-tight text-[#0B0112]"
              >
                Search by photo
              </h2>
              <p className="text-[12.5px] text-[#8A888C]">
                {phase === 'results'
                  ? `${products.length} match${products.length === 1 ? '' : 'es'} in the shop`
                  : 'Snap it, upload it or paste it. We’ll find it.'}
              </p>
            </div>
            <button
              type="button"
              data-autofocus
              onClick={onClose}
              aria-label="Close photo search"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F1F6] text-[#0B0112] transition hover:bg-[#ECE6F0] focus-visible:ring-2 focus-visible:ring-[#611192] focus-visible:outline-none"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-4 sm:pb-[calc(16px+env(safe-area-inset-bottom))]">
            {/* ---------- idle ---------- */}
            {phase === 'idle' ? (
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex w-full flex-col items-center overflow-hidden rounded-[24px] bg-gradient-to-b from-[#FAF5FD] to-[#F3E9F9] px-6 py-10 text-center ring-1 ring-[#E9DDF1] transition hover:ring-[#611192]/40 sm:py-8"
                >
                  <span className="relative flex h-28 w-28 items-center justify-center sm:h-24 sm:w-24">
                    <span
                      className="absolute inset-0 animate-[ping_2.4s_ease-out_infinite] rounded-[28px] bg-[#611192]/10"
                      aria-hidden
                    />
                    <span className="relative flex h-full w-full items-center justify-center rounded-[28px] bg-white text-[#611192] shadow-[0_12px_30px_rgba(97,17,146,0.18)]">
                      <ScanFrameIcon className="h-12 w-12 sm:h-10 sm:w-10" />
                    </span>
                  </span>
                  <span className="mt-6 font-primary text-[26px] leading-tight text-[#0B0112] sm:text-[22px]">
                    Find it with a photo
                  </span>
                  <span className="mt-2 max-w-[400px] text-[14px] leading-relaxed text-[#6B686E]">
                    <span className="sm:hidden">
                      Drop a photo here, choose one, or paste with Ctrl+V.
                    </span>
                    <span className="hidden sm:inline">
                      Take a photo of an item, or pick one from your phone.
                    </span>
                  </span>
                </button>

                <div
                  className={`mt-4 grid gap-3 ${canPaste ? 'grid-cols-3' : 'grid-cols-2'} sm:grid-cols-2`}
                >
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-[#611192] px-3 py-4 text-white shadow-[0_10px_24px_rgba(97,17,146,0.25)] transition hover:bg-[#4C0D73]"
                  >
                    <Camera className="h-6 w-6" aria-hidden />
                    <span className="text-[14px] font-semibold">
                      Take a photo
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-[#0B0112] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192]"
                  >
                    <ImagePlus className="h-6 w-6 text-[#611192]" aria-hidden />
                    <span className="text-[14px] font-semibold">
                      Upload photo
                    </span>
                  </button>
                  {canPaste ? (
                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-[#0B0112] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192] sm:col-span-2 sm:flex-row sm:justify-center sm:py-3"
                    >
                      <ClipboardPaste
                        className="h-6 w-6 text-[#611192] sm:h-5 sm:w-5"
                        aria-hidden
                      />
                      <span className="text-[14px] font-semibold">
                        Paste image
                      </span>
                    </button>
                  ) : null}
                </div>
                {pasteNote ? (
                  <p className="mt-3 text-center text-[13px] text-[#8A4B00]">
                    {pasteNote}
                  </p>
                ) : null}

                <ul className="mt-5 flex flex-wrap justify-center gap-2">
                  {TIPS.map(t => (
                    <li
                      key={t.text}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F4F9] px-3 py-1.5 text-[12.5px] text-[#474648]"
                    >
                      <t.icon
                        className="h-3.5 w-3.5 text-[#611192]"
                        aria-hidden
                      />{' '}
                      {t.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* ---------- scanning ---------- */}
            {phase === 'scanning' ? (
              <div className="mx-auto max-w-[420px] pt-2">
                <div className="relative aspect-square overflow-hidden rounded-[24px] bg-[#1A0B26]">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Your photo"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <span
                    className="absolute inset-0 bg-gradient-to-b from-[#611192]/10 via-transparent to-[#611192]/20"
                    aria-hidden
                  />
                  {[
                    'top-4 left-4 border-t-[3px] border-l-[3px] rounded-tl-xl',
                    'top-4 right-4 border-t-[3px] border-r-[3px] rounded-tr-xl',
                    'bottom-4 left-4 border-b-[3px] border-l-[3px] rounded-bl-xl',
                    'bottom-4 right-4 border-b-[3px] border-r-[3px] rounded-br-xl',
                  ].map(c => (
                    <span
                      key={c}
                      className={`absolute h-10 w-10 border-white ${c}`}
                      aria-hidden
                    />
                  ))}
                  <motion.span
                    animate={{ top: ['10%', '86%', '10%'] }}
                    transition={{
                      duration: 2.2,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }}
                    className="absolute right-6 left-6 h-[3px] rounded-full bg-white shadow-[0_0_24px_6px_rgba(217,184,240,0.9)]"
                    aria-hidden
                  />
                </div>
                <ol className="mt-6 space-y-3" aria-live="polite">
                  {SCAN_STEPS.map((s, i) => (
                    <li
                      key={s}
                      className={`flex items-center gap-3 text-[14.5px] transition ${i <= scanStep ? 'text-[#0B0112]' : 'text-[#B9B3BD]'}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          i < scanStep
                            ? 'bg-[#1E6B2E] text-white'
                            : i === scanStep
                              ? 'bg-[#611192] text-white'
                              : 'bg-[#F0EBF2]'
                        }`}
                      >
                        {i < scanStep ? (
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        ) : i === scanStep ? (
                          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        ) : null}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* ---------- results ---------- */}
            {phase === 'results' ? (
              <div className="grid grid-cols-[300px_1fr] gap-7 md:grid-cols-1 md:gap-5">
                <aside className="md:flex md:items-start md:gap-4">
                  <div className="sticky top-0 md:static md:w-[112px] md:shrink-0">
                    <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[#F4F1F6] md:rounded-2xl">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="Your photo"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13.5px] font-semibold text-[#0B0112] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192] md:h-9 md:text-[12.5px]"
                    >
                      <RefreshCw
                        className="h-4 w-4 md:h-3.5 md:w-3.5"
                        aria-hidden
                      />{' '}
                      New photo
                    </button>
                  </div>
                  <div className="mt-5 md:mt-0 md:min-w-0 md:flex-1">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.12em] text-[#611192] uppercase">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden /> We see
                    </p>
                    <p className="mt-1 font-primary text-[22px] leading-snug text-[#0B0112] md:text-[18px]">
                      {analysis?.title || 'Your item'}
                    </p>
                    {analysis?.additionalInfo ? (
                      <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-[#6B686E] md:hidden">
                        {analysis.additionalInfo}
                      </p>
                    ) : null}
                  </div>
                </aside>

                <div className="min-w-0">
                  {chips.length ? (
                    <div
                      className="ap-no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1"
                      role="toolbar"
                      aria-label="Narrow the matches"
                    >
                      <button
                        type="button"
                        onClick={() => setFilter('')}
                        className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition ${!filter ? 'bg-[#0B0112] text-white' : 'bg-white text-[#474648] ring-1 ring-[#E2DCE6] hover:ring-[#611192]'}`}
                      >
                        All
                      </button>
                      {chips.map(c => {
                        const on = filter.toLowerCase() === c.toLowerCase();
                        return (
                          <button
                            key={c}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setFilter(on ? '' : c)}
                            className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium capitalize transition ${on ? 'bg-[#0B0112] text-white' : 'bg-white text-[#474648] ring-1 ring-[#E2DCE6] hover:ring-[#611192]'}`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {shown.length === 0 ? (
                    <div className="flex flex-col items-center rounded-[24px] bg-[#FAF8FB] px-6 py-12 text-center ring-1 ring-[#ECE8EE]">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#611192] ring-1 ring-[#ECE8EE]">
                        <ScanFrameIcon className="h-7 w-7" />
                      </span>
                      <p className="mt-4 font-primary text-[22px] text-[#0B0112]">
                        {filter
                          ? 'Nothing with that filter'
                          : 'No close match yet'}
                      </p>
                      <p className="mt-2 max-w-[360px] text-[14px] text-[#6B686E]">
                        {filter
                          ? 'Clear the filter to see every match.'
                          : `New items arrive every day. Browse ${analysis?.category ? analysis.category.toLowerCase() : 'the shop'}, or try another angle.`}
                      </p>
                    </div>
                  ) : (
                    <ul className="grid grid-cols-3 gap-4 lg:grid-cols-2 sm:gap-3">
                      {shown.map(p => {
                        const img = productImage(p);
                        const match =
                          typeof p.matchScore === 'number' && p.matchScore > 0
                            ? Math.round(
                                p.matchScore <= 1
                                  ? p.matchScore * 100
                                  : p.matchScore
                              )
                            : null;
                        return (
                          <li key={p._id}>
                            <button
                              type="button"
                              onClick={() => go(`/product/${p.slug || p._id}`)}
                              className="group block w-full text-left"
                            >
                              <span className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-[#F4F1F6]">
                                {img ? (
                                  <Image
                                    src={img}
                                    alt=""
                                    fill
                                    sizes="(max-width: 767px) 50vw, 240px"
                                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                                  />
                                ) : null}
                                {match ? (
                                  <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[11.5px] font-semibold text-[#1E6B2E] shadow-sm">
                                    {match}% match
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-2.5 block truncate text-[12px] font-medium text-[#8A888C]">
                                {p.brand || p.category || 'Listing'}
                              </span>
                              <span className="mt-0.5 line-clamp-2 block text-[14px] leading-snug font-medium text-[#0B0112] group-hover:text-[#611192]">
                                {p.name}
                              </span>
                              <span className="mt-1 flex items-center gap-2">
                                {p.price != null ? (
                                  <span className="text-[15px] font-semibold text-[#0B0112] tabular-nums">
                                    {formatMarketMoney(Number(p.price), locale)}
                                  </span>
                                ) : null}
                                {p.condition ? (
                                  <span className="truncate text-[12px] text-[#8A888C]">
                                    {p.condition}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            {/* ---------- error ---------- */}
            {phase === 'error' ? (
              <div className="mx-auto flex max-w-[420px] flex-col items-center py-8 text-center">
                {previewUrl ? (
                  <span className="relative h-28 w-28 overflow-hidden rounded-[22px] opacity-60 grayscale">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : null}
                <p className="mt-5 font-primary text-[24px] text-[#0B0112]">
                  We couldn’t read that photo
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B686E]">
                  {error}
                </p>
                <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="h-11 rounded-full bg-white text-[14px] font-semibold text-[#0B0112] ring-1 ring-[#D9D2DD] hover:ring-[#611192]"
                  >
                    Another photo
                  </button>
                  {onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="h-11 rounded-full bg-[#611192] text-[14px] font-semibold text-white hover:bg-[#4C0D73]"
                    >
                      Try again
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-11 rounded-full bg-[#611192] text-[14px] font-semibold text-white"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* results footer */}
          {phase === 'results' ? (
            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#F0EBF2] bg-white/95 px-6 py-3.5 backdrop-blur sm:px-4 sm:pb-[calc(12px+env(safe-area-inset-bottom))]">
              <p className="truncate text-[13px] text-[#6B686E] sm:hidden">
                Not quite it? Browse the whole aisle.
              </p>
              <button
                type="button"
                onClick={() =>
                  go(categoryId ? shopHref(categoryId) : '/product')
                }
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#611192] px-5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(97,17,146,0.25)] transition hover:bg-[#4C0D73] sm:w-full sm:justify-center"
              >
                {categoryId && analysis?.category
                  ? `Browse ${analysis.category.toLowerCase()}`
                  : 'Browse the shop'}{' '}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </footer>
          ) : null}

          {/* drag overlay */}
          {dragging ? (
            <div className="pointer-events-none absolute inset-3 flex flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#611192] bg-[#FAF5FD]/95">
              <ImagePlus className="h-10 w-10 text-[#611192]" aria-hidden />
              <p className="mt-3 font-primary text-[22px] text-[#0B0112]">
                Drop to search
              </p>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ImageSearchModal;
