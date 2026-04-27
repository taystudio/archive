'use client';

import { useEffect } from 'react';

// Suppresses well-known DOM-race errors that bubble up from third-party
// scripts (AdSense, ProseMirror) interleaving with React's reconciliation.
// We swallow only the exact classes we've audited; anything else propagates
// normally so genuine bugs aren't hidden.
const KNOWN_ERROR_PATTERNS: Array<RegExp> = [
  // React tries to remove a DOM node that AdSense / external script moved.
  /removeChild|insertBefore.*not a child|appendChild.*Failed/i,
  // ProseMirror schema-level joins at table boundaries.
  /Cannot (join|split) /,
];

const KNOWN_ERROR_NAMES = new Set(['NotFoundError', 'TransformError', 'HierarchyRequestError']);

function isKnownDomRace(err: unknown, msg: string): boolean {
  const e = err as { name?: string } | null;
  if (e?.name && KNOWN_ERROR_NAMES.has(e.name)) return true;
  return KNOWN_ERROR_PATTERNS.some((re) => re.test(msg));
}

export default function ClientErrorSuppress() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = e.message ?? '';
      const err = e.error as Error | undefined;
      if (isKnownDomRace(err, msg) || isKnownDomRace(err, String(err ?? ''))) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        // eslint-disable-next-line no-console
        console.warn('[blog] suppressed DOM race:', err?.name ?? '', msg);
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { name?: string; message?: string } | undefined;
      const msg = reason?.message ?? String(reason ?? '');
      if (isKnownDomRace(reason, msg)) {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.warn('[blog] suppressed promise rejection:', reason?.name ?? '', msg);
      }
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
