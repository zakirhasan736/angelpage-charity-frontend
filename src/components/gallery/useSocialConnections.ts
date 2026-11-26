'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { ALL_PROVIDERS, type ProviderStatus } from '@/lib/socialVideo';

/** Linked social accounts for the signed-in creator (seller, charity or admin). */
export function useSocialConnections() {
  const { data: session } = useSession() || {};
  const token = session?.token;
  const api = process.env.NEXT_PUBLIC_API_URL;
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const r = await axios.get(`${api}/social-connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(r.data.providers || []);
    } catch {
      setProviders(
        ALL_PROVIDERS.map(provider => ({
          provider,
          configured: false,
          connected: false,
        }))
      );
    }
  }, [api, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    providers,
    reload,
    token,
    api,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
}
