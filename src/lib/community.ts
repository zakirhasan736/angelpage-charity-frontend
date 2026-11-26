import { getAccountPathForRole } from '@/utils/navigationPaths';

type SessionLike =
  | { user?: { role?: string; id?: string; charityId?: string } }
  | null
  | undefined;

/** Posting reels needs an account: sellers (USER), charity owners/staff, or admins. */
export const canPostStories = (session: SessionLike) =>
  Boolean(session?.user?.id);

/** Where "Share your story" goes: the gallery tab when signed in, otherwise sign in first. */
export function postStoryHref(session: SessionLike) {
  const u = session?.user;
  if (!u?.id) return `/auth/login?callbackUrl=${encodeURIComponent('/reels')}`;
  const base = getAccountPathForRole(u.role, u.id, u.charityId);
  return base.startsWith('/admin')
    ? '/admin?tab=gallery'
    : `${base}?tab=gallery`;
}

/** Compact counts: 980, 1.2K, 3.4M. */
export const compactCount = (n?: number) =>
  typeof n === 'number' && n > 0
    ? new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n)
    : '';
