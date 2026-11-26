'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

/**
 * When the API answers 403 { code: "MFA_REQUIRED" } (admins without two-step,
 * with ADMIN_MFA_REQUIRED on), explain what to do instead of failing silently.
 */
export default function MfaRequiredWatcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const id = axios.interceptors.response.use(
      r => r,
      err => {
        if (
          axios.isAxiosError(err) &&
          err.response?.status === 403 &&
          (err.response.data as { code?: string })?.code === 'MFA_REQUIRED'
        ) {
          setOpen(true);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[10066] flex items-center justify-center bg-[#0B0112]/55 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-req-title"
    >
      <div className="w-full max-w-[440px] rounded-[24px] bg-white p-6 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#611192]">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </span>
        <h2
          id="mfa-req-title"
          className="mt-4 font-primary text-[22px] text-[#0B0112]"
        >
          Two-step verification needed
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B686E]">
          Admin accounts must use two-step verification. Turn it on in Account
          settings. If it’s already on, sign in again so this session is
          verified.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="h-11 rounded-full bg-white text-[14px] font-semibold text-[#0B0112] ring-1 ring-[#D9D2DD] hover:ring-[#611192]"
          >
            Sign in again
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/admin?tab=account');
            }}
            className="h-11 rounded-full bg-[#611192] text-[14px] font-semibold text-white hover:bg-[#4C0D73]"
          >
            Turn it on
          </button>
        </div>
      </div>
    </div>
  );
}
