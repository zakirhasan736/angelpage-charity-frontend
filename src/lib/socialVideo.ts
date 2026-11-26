export type VideoSource = 'upload' | 'tiktok' | 'instagram' | 'youtube';
export type SocialProvider = Exclude<VideoSource, 'upload'>;

export const PROVIDER_META: Record<
  SocialProvider,
  { label: string; short: string; bg: string; fg: string }
> = {
  tiktok: { label: 'TikTok', short: 'TikTok', bg: '#000000', fg: '#FFFFFF' },
  instagram: {
    label: 'Instagram',
    short: 'Instagram',
    bg: 'linear-gradient(45deg,#F58529,#DD2A7B 45%,#8134AF 75%,#515BD4)',
    fg: '#FFFFFF',
  },
  youtube: {
    label: 'YouTube Shorts',
    short: 'YouTube',
    bg: '#FF0000',
    fg: '#FFFFFF',
  },
};

type MediaLike =
  | {
      source?: string;
      embedUrl?: string;
      externalId?: string;
      permalink?: string;
    }
  | undefined;

export const isExternal = (
  m: MediaLike
): m is MediaLike & { source: SocialProvider; embedUrl: string } =>
  Boolean(
    m &&
    m.embedUrl &&
    (m.source === 'tiktok' ||
      m.source === 'instagram' ||
      m.source === 'youtube')
  );

const ALLOWED_EMBED =
  /^https:\/\/(www\.youtube\.com\/embed\/|www\.tiktok\.com\/player\/v1\/|www\.instagram\.com\/(reel|p|tv)\/)/;

/** Player URL for the reels feed. Only the three platforms' own players are allowed. */
export function playerUrl(
  m: MediaLike,
  { autoplay = true, muted = true } = {}
) {
  if (!isExternal(m) || !ALLOWED_EMBED.test(m.embedUrl)) return '';
  const u = new URL(m.embedUrl);
  if (m.source === 'youtube') {
    const id = u.pathname.split('/').pop() || '';
    u.search = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      playsinline: '1',
      loop: '1',
      playlist: id,
      controls: '0',
      rel: '0',
      modestbranding: '1',
    }).toString();
  } else if (m.source === 'tiktok') {
    u.search = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      muted: muted ? '1' : '0',
      loop: '1',
      rel: '0',
      music_info: '0',
      description: '0',
      controls: '1',
    }).toString();
  }
  return u.toString();
}
