import { categoriesData as fallbackCategories } from '@/libs/categoriesData';

export type CategorySub = { id: string; name: string };
export type Category = {
  id: string;
  name: string;
  subCategories: CategorySub[];
};

let cached: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;
const SESSION_KEY = 'ap-categories-v1';

function readSession(): Category[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? (parsed as Category[]) : null;
  } catch {
    return null;
  }
}

/**
 * Load categories from backend `/categories` with static fallback.
 * One request per session: concurrent callers (desktop mega menu + mobile drawer)
 * share the in-flight promise, and the result is kept in memory + sessionStorage.
 */
export async function fetchCategories(force = false): Promise<Category[]> {
  if (cached && !force) return cached;
  if (!force) {
    const fromSession = readSession();
    if (fromSession) {
      cached = fromSession;
      return fromSession;
    }
  }
  if (inflight && !force) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        next: { revalidate: 3600 },
      } as RequestInit);
      if (!res.ok) throw new Error('categories fetch failed');
      const data = await res.json();
      if (Array.isArray(data?.categories) && data.categories.length > 0) {
        const categories = data.categories as Category[];
        cached = categories;
        try {
          window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(categories));
        } catch {
          /* storage unavailable */
        }
        return categories;
      }
    } catch {
      // fall through to static
    }
    const fallback = fallbackCategories.categories as Category[];
    cached = fallback;
    return fallback;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function getCachedCategories(): Category[] {
  return cached || (fallbackCategories.categories as Category[]);
}

/** Categories already loaded this session (memory or sessionStorage), else null. */
export function peekCategories(): Category[] | null {
  return cached || readSession();
}
