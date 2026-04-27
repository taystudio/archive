'use client';

import { useEffect, useRef } from 'react';

export type AdVariant = 'inline' | 'rail' | 'infeed' | 'mobile-sticky';

type Props = {
  slot: string;
  variant?: AdVariant;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

const VARIANT_CLASS: Record<AdVariant, string> = {
  inline: 'ad-slot ad-slot--inline',
  rail: 'ad-slot ad-slot--rail',
  infeed: 'ad-slot ad-slot--infeed',
  'mobile-sticky': 'ad-slot ad-slot--mobile-sticky',
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSense({
  slot,
  variant = 'inline',
  format = 'auto',
  responsive = true,
  style,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!CLIENT) return;
    const root = ref.current;
    if (!root) return;

    let insEl: HTMLElement | null = null;
    let inserted = false;

    const insert = () => {
      if (inserted || !root.isConnected) return;
      // Build the <ins> outside React's reconciliation tree. Once Google's
      // adsbygoogle script transforms it (wrapping in iframe / replacing
      // children), React isn't aware so it won't try to clean up that DOM.
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.style.width = '100%';
      ins.style.height = '100%';
      ins.setAttribute('data-ad-client', CLIENT);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', format);
      ins.setAttribute('data-full-width-responsive', responsive ? 'true' : 'false');
      root.appendChild(ins);
      insEl = ins;
      inserted = true;
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        /* noop */
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            insert();
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      if (insEl) {
        // Defensive removal — only if the node is still where we put it.
        // adsbygoogle may have moved/wrapped it; in that case React shouldn't
        // touch it, and we just stop tracking.
        try {
          if (insEl.parentNode === root) {
            root.removeChild(insEl);
          } else if (insEl.parentNode) {
            insEl.parentNode.removeChild(insEl);
          }
        } catch {
          /* node already gone or in a state we can't reason about */
        }
        insEl = null;
      }
    };
  }, [slot, format, responsive]);

  const wrapClass = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

  // Render an EMPTY container — the <ins> is appended manually in useEffect.
  // This isolates Google's DOM mutations from React's reconciliation.
  if (!CLIENT) {
    return (
      <div
        ref={ref}
        className={wrapClass}
        style={style}
        aria-hidden="true"
        data-ad-placeholder="true"
      >
        <div
          className="flex items-center justify-center h-full w-full text-xs"
          style={{ color: 'var(--ad-label)', minHeight: 'inherit' }}
        >
          Ad slot · {slot}
        </div>
      </div>
    );
  }

  return <div ref={ref} className={wrapClass} style={style} />;
}
