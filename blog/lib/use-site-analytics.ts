'use client';

import { useEffect, useState } from 'react';

type SiteAnalytics = { goatcounter?: string };

declare global {
  interface Window {
    __SITE_ANALYTICS__?: SiteAnalytics;
  }
}

export function useSiteGoatcounter(override?: string): string | undefined {
  const [code, setCode] = useState<string | undefined>(override);

  useEffect(() => {
    if (override) {
      setCode(override);
      return;
    }
    const c = window.__SITE_ANALYTICS__?.goatcounter;
    if (c) setCode(c);
  }, [override]);

  return code;
}
