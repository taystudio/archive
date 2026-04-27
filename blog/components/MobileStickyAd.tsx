'use client';

import { useEffect, useState } from 'react';
import AdSlot from './AdSlot';

const DISMISS_KEY = 'mobile_sticky_ad_dismissed_at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 6;

export default function MobileStickyAd() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const t = parseInt(raw, 10);
        if (!Number.isNaN(t) && Date.now() - t < DISMISS_TTL_MS) return;
      }
    } catch {
      /* noop */
    }
    const id = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="광고 닫기"
        className="absolute -top-3 right-2 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] text-sm leading-none flex items-center justify-center shadow-sm"
      >
        ×
      </button>
      <AdSlot name="mobile-sticky" />
    </div>
  );
}
