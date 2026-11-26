'use client';

import React, { useEffect, useState } from 'react';
import { Checkbox, Input } from '@/components/elements';
import CrossPostToggles, {
  type CrossPostPrefs,
} from '@/components/gallery/CrossPostToggles';

export const defaultSocialPostingPrefs = () => ({
  facebook: true,
  instagram: true,
  tiktok: false,
  tiktokVideoUrl: '',
});

export interface SocialPostingPrefs {
  facebook: boolean;
  instagram: boolean;
  tiktok: boolean;
  tiktokVideoUrl?: string;
  /** the seller's/charity's own connected accounts (sent to the API as crossPost) */
  crossPost?: CrossPostPrefs;
}

interface SocialPostingTogglesProps {
  /** show "Also post to my accounts" (only where the signed-in user owns the listing) */
  showCrossPost?: boolean;
  value?: SocialPostingPrefs;
  onChange?: (value: SocialPostingPrefs) => void;
  compact?: boolean;
  showVideoHint?: boolean;
  listingVideoUrl?: string;
}

const SocialPostingToggles = ({
  value,
  onChange,
  compact = false,
  showVideoHint = true,
  listingVideoUrl = '',
  showCrossPost = false,
}: SocialPostingTogglesProps) => {
  const [prefs, setPrefs] = useState<SocialPostingPrefs>(
    value || defaultSocialPostingPrefs()
  );

  useEffect(() => {
    if (value) setPrefs(value);
  }, [value]);

  const update = (patch: Partial<SocialPostingPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-3">
      {showCrossPost ? (
        <CrossPostToggles
          kind="product"
          value={prefs.crossPost || {}}
          onChange={crossPost => update({ crossPost })}
        />
      ) : null}
      <div
        className={`rounded-lg border border-mono-40 bg-[#FAFAFC] ${compact ? 'p-3' : 'p-4'}`}
      >
        <p
          className={`${compact ? 'caption-bold' : 'body-small'} text-mono-100 mb-1`}
        >
          {showCrossPost
            ? "Also share on Angelpage's pages"
            : 'Social auto-posting'}
        </p>
        <p className="text-[11px] text-mono-70 mb-3">
          When your listing is approved, Angelpage can post it to your connected
          social channels.
        </p>

        <div className="flex flex-col gap-2">
          <Checkbox
            name="socialFacebook"
            checked={prefs.facebook}
            onChange={() => update({ facebook: !prefs.facebook })}
            label="Post to Facebook Page"
          />
          <Checkbox
            name="socialInstagram"
            checked={prefs.instagram}
            onChange={() => update({ instagram: !prefs.instagram })}
            label="Post to Instagram"
          />
          <Checkbox
            name="socialTiktok"
            checked={prefs.tiktok}
            onChange={() => update({ tiktok: !prefs.tiktok })}
            label="Post to TikTok (requires video)"
          />
        </div>

        {prefs.tiktok && (
          <div className="mt-3">
            <Input
              label="TikTok video URL (optional)"
              placeholder="https://… or use listing video from Photos step"
              value={prefs.tiktokVideoUrl || ''}
              onChange={e => update({ tiktokVideoUrl: e.target.value })}
              className="flex-col text-sm"
            />
            {showVideoHint && listingVideoUrl && !prefs.tiktokVideoUrl && (
              <p className="text-[11px] text-mono-70 mt-2">
                Listing video will be used: {listingVideoUrl.slice(0, 48)}…
              </p>
            )}
            {showVideoHint && !listingVideoUrl && !prefs.tiktokVideoUrl && (
              <p className="text-[11px] text-amber-700 mt-2">
                Add a product video in the Photos step, or paste a public video
                URL for TikTok posting.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialPostingToggles;
