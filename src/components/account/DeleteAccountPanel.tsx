'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { signOut, useSession } from 'next-auth/react';
import { AlertTriangle, Download, MessageSquare, Package, Trash2, Wallet } from 'lucide-react';
import { AuthAlert } from '@/components/auth/AuthKit';
import { Btn, SectionCard } from '@/components/dashboard/DashKit';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Close-account tab, shared by members and charities. Requires typing DELETE. */
export default function DeleteAccountPanel({ isCharity = false }: { isCharity?: boolean }) {
  const { data: session } = useSession() || {};
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = typed.trim().toUpperCase() === 'DELETE';

  const lose = [
    { icon: Package, text: isCharity ? 'Your storefront and every listing on it' : 'Your listings and saved items' },
    { icon: MessageSquare, text: 'Messages and conversation history' },
    { icon: Wallet, text: 'Access to earnings history. Pending payouts still complete' },
    { icon: Download, text: 'Order records you haven’t saved. Download receipts first' },
  ];

  const remove = async () => {
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!session || !userId || !role) {
      setError('Your session has expired. Sign in again to close your account.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await axios.delete(`${API_URL}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
        data: { userId, role },
      });
      await signOut({ callbackUrl: '/' });
    } catch (e) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(m || 'We couldn’t close your account. Please try again or contact support.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] space-y-5">
      <SectionCard tone="danger" icon={AlertTriangle} title={isCharity ? 'Close this charity account' : 'Close your account'} description="This is permanent and can’t be undone.">
        <p className="mb-3 text-[13.5px] font-medium text-[#0B0112]">You will lose:</p>
        <ul className="space-y-2.5">
          {lose.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-[14px] text-[#474648]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F4] text-[#B0002A]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="pt-1">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-2xl bg-[#FAF8FB] p-4">
          <label htmlFor="confirm-delete" className="text-[13.5px] text-[#474648]">
            Type <strong className="font-semibold text-[#0B0112]">DELETE</strong> to confirm
          </label>
          <input id="confirm-delete" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" className="mt-2 w-full" placeholder="DELETE" />
        </div>
        {error ? (
          <div className="mt-4">
            <AuthAlert>{error}</AuthAlert>
          </div>
        ) : null}
        <Btn variant="danger" icon={Trash2} loading={busy} disabled={!ready} onClick={remove} className="mt-5 w-full">
          Permanently close account
        </Btn>
      </SectionCard>
      <p className="text-center text-[12.5px] text-[#8A888C]">Just need a break? Signing out keeps everything as it is.</p>
    </div>
  );
}
