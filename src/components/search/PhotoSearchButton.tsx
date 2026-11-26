'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import { Camera } from 'lucide-react';
import { searchProductsByImage } from '@/lib/aiApi';
import type { ListingAiResult } from '@/lib/aiApi';
import ImageSearchModal, {
  type ImageSearchProduct,
  type Phase,
} from './ImageSearchModal';

type State = {
  phase: Phase;
  previewUrl: string;
  analysis?: ListingAiResult;
  products?: ImageSearchProduct[];
  error?: string;
};

/** One-tap photo search for the phone header (the full search bar lives in the menu there). */
export default function PhotoSearchButton({
  className = '',
}: {
  className?: string;
}) {
  const [state, setState] = useState<State | null>(null);
  const last = useRef<File | null>(null);

  const close = () => {
    if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setState(null);
    last.current = null;
  };

  const run = async (file: File) => {
    if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    last.current = file;
    setState({ phase: 'scanning', previewUrl });
    try {
      const r = await searchProductsByImage(file);
      setState(s =>
        s
          ? {
              ...s,
              phase: 'results',
              analysis: r.analysis,
              products: (r.products || []) as ImageSearchProduct[],
            }
          : null
      );
    } catch (err) {
      const raw =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : '';
      const error = /quota|429/i.test(raw)
        ? 'The photo reader is busy. Wait a moment, then try the same photo again.'
        : /not configured|API key/i.test(raw)
          ? 'Photo search is not available right now.'
          : 'Try a clearer picture of one item, in good light.';
      setState(s => (s ? { ...s, phase: 'error', error } : null));
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Search by photo"
        onClick={() => setState({ phase: 'idle', previewUrl: '' })}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-[#0B0112] transition hover:bg-[#F4F1F6] ${className}`}
      >
        <Camera className="h-[22px] w-[22px]" aria-hidden />
      </button>
      <ImageSearchModal
        open={Boolean(state)}
        previewUrl={state?.previewUrl || ''}
        phase={state?.phase || 'idle'}
        analysis={state?.analysis}
        products={state?.products}
        error={state?.error}
        onClose={close}
        onSelectFile={run}
        onRetry={() =>
          last.current
            ? run(last.current)
            : setState({ phase: 'idle', previewUrl: '' })
        }
      />
    </>
  );
}
