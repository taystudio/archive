'use client';

import { useEffect, useState } from 'react';
import WidgetSection from './WidgetSection';
import { useSiteGoatcounter } from '@/lib/use-site-analytics';

type Provider = 'visitor-badge' | 'hits' | 'goatcounter' | 'custom';

type Props = {
  provider?: Provider;
  target?: string;
  pageId?: string;
  customTotalUrl?: string;
  customTodayUrl?: string;
  siteCode?: string;
  title?: string;
};

function formatNumber(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 px-3 text-center min-h-[58px] flex flex-col justify-center">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
        {label}
      </div>
      <div className="text-base font-semibold text-[var(--fg)] tabular-nums leading-none">
        {children}
      </div>
    </div>
  );
}

function derivePageId(target: string | undefined): string {
  if (!target) return 'anon.site';
  try {
    const u = new URL(target);
    return (u.hostname + u.pathname).replace(/\/+$/, '').replace(/\//g, '.');
  } catch {
    return target.replace(/https?:\/\//, '').replace(/\//g, '.');
  }
}

function useGoatCounter(siteCode?: string, pagePath?: string) {
  const [total, setTotal] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!siteCode) return;
    const iso = new Date().toISOString().slice(0, 10);
    const base = `https://${siteCode}.goatcounter.com`;
    const target = pagePath ?? 'TOTAL';
    const totalUrl = `${base}/counter/${encodeURIComponent(target)}.json`;
    const todayUrl = `${base}/counter/${encodeURIComponent(target)}.json?start=${iso}&end=${iso}`;
    Promise.all([
      fetch(totalUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(todayUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([t, d]) => {
        setTotal(t?.count_unique ?? t?.count ?? null);
        setToday(d?.count_unique ?? d?.count ?? null);
      })
      .catch(() => setErr(true));
  }, [siteCode, pagePath]);

  return { total, today, err };
}

function VisitorBadgeTotal({ pageId }: { pageId: string }) {
  const [failed, setFailed] = useState(false);
  const encoded = encodeURIComponent(pageId);
  const url = `https://visitor-badge.laobi.icu/badge?page_id=${encoded}&left_text=Total&left_color=%23555555&right_color=%233f6f54`;
  if (failed) return <span className="text-[var(--muted)]">—</span>;
  return (
    <img
      src={url}
      alt="Total visitors"
      onError={() => setFailed(true)}
      style={{ display: 'inline-block', maxWidth: '100%' }}
    />
  );
}

export default function VisitorCounterWidget({
  provider = 'visitor-badge',
  target,
  pageId,
  customTotalUrl,
  customTodayUrl,
  siteCode,
  title = 'Visitors',
}: Props) {
  const normalizedProvider = provider === 'hits' ? 'visitor-badge' : provider;
  const siteGc = useSiteGoatcounter(siteCode);
  const effectiveSiteCode = normalizedProvider === 'goatcounter' ? siteGc : undefined;
  const gc = useGoatCounter(effectiveSiteCode);

  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [customToday, setCustomToday] = useState<number | null>(null);
  useEffect(() => {
    if (normalizedProvider !== 'custom') return;
    const load = async (u: string | undefined, fn: (n: number | null) => void) => {
      if (!u) return;
      try {
        const res = await fetch(u);
        if (!res.ok) return;
        const data = await res.json();
        const n = typeof data === 'number' ? data : (data.count ?? data.value ?? null);
        fn(typeof n === 'number' ? n : null);
      } catch {
        /* noop */
      }
    };
    load(customTotalUrl, setCustomTotal);
    load(customTodayUrl, setCustomToday);
  }, [normalizedProvider, customTotalUrl, customTodayUrl]);

  let totalNode: React.ReactNode = <span className="text-[var(--muted)]">—</span>;
  let todayNode: React.ReactNode = <span className="text-[var(--muted)]">—</span>;

  if (normalizedProvider === 'visitor-badge') {
    const id = pageId || derivePageId(target);
    totalNode = <VisitorBadgeTotal pageId={id} />;
  } else if (normalizedProvider === 'goatcounter') {
    if (!effectiveSiteCode) {
      return (
        <WidgetSection title={title}>
          <p className="text-xs text-[var(--muted)]">
            goatcounter 미설정. Settings → Analytics 에서 site code 입력.
          </p>
        </WidgetSection>
      );
    }
    if (gc.err) {
      return (
        <WidgetSection title={title}>
          <p className="text-xs text-[var(--muted)]">카운터 로드 실패</p>
        </WidgetSection>
      );
    }
    totalNode = formatNumber(gc.total);
    todayNode = formatNumber(gc.today);
  } else if (normalizedProvider === 'custom') {
    totalNode = formatNumber(customTotal);
    todayNode = formatNumber(customToday);
  }

  return (
    <WidgetSection title={title}>
      <div className="flex gap-2">
        <Box label="Total">{totalNode}</Box>
        <Box label="Today">{todayNode}</Box>
      </div>
    </WidgetSection>
  );
}
