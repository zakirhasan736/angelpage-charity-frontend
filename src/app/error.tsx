'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { reportError } from '@/lib/reportError';

/** 500 boundary: friendly copy for visitors, details go to error reporting only. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <section className="custom-container flex min-h-[70vh] items-center py-16">
      <div className="mx-auto max-w-[560px] text-center">
        <p className="font-primary text-[96px] leading-none text-[#E9D8F5] sm:text-[72px]" aria-hidden>
          500
        </p>
        <h1 className="ap-display mt-2 text-[34px] leading-tight sm:text-[26px]">Something went wrong on our side</h1>
        <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-relaxed text-[#6B686E]">
          Nothing you did. Please try again; if it keeps happening, let us know and quote the reference below.
        </p>
        {error.digest ? <p className="mt-3 text-[12px] text-[#8A888C]">Reference: {error.digest}</p> : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#611192] px-6 text-[15px] font-medium text-white hover:bg-[#4C0D73]">
            <RotateCw className="h-4 w-4" aria-hidden /> Try again
          </button>
          <Link href="/" className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium text-[#611192] ring-1 ring-[#E2DCE6] hover:ring-[#611192]">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
