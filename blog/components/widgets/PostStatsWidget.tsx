'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import WidgetSection from './WidgetSection';
import { useSiteGoatcounter } from '@/lib/use-site-analytics';

type Props = {
  siteCode?: string;
  title?: string;
};

function fmt(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

export default function PostStatsWidget({ siteCode, title = '이 글의 조회수' }: Props) {
  const pathname = usePathname() ?? '';
  const code = useSiteGoatcounter(siteCode);
  const [total, setTotal] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!code || !pathname) return;
    const base = `https://${code}.goatcounter.com`;
    const iso = new Date().toISOString().slice(0, 10);
    const enc = encodeURIComponent(pathname);
    Promise.all([
      fetch(`${base}/counter/${enc}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${base}/counter/${enc}.json?start=${iso}&end=${iso}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([t, d]) => {
        setTotal(t?.count_unique ?? t?.count ?? null);
        setToday(d?.count_unique ?? d?.count ?? null);
      })
      .catch(() => setErr(true));
  }, [code, pathname]);

  if (!code) {
    return (
      <WidgetSection title={title}>
        <p className="text-xs text-[var(--muted)]">
          Settings → Analytics 에서 goatcounter site code 입력 시 활성화
        </p>
      </WidgetSection>
    );
  }

  return (
    <WidgetSection title={title}>
      {err ? (
        <p className="text-xs text-[var(--muted)]">통계 로드 실패</p>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 px-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
              Total
            </div>
            <div className="text-base font-semibold text-[var(--fg)] tabular-nums leading-none">
              {fmt(total)}
            </div>
          </div>
          <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 px-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
              Today
            </div>
            <div className="text-base font-semibold text-[var(--fg)] tabular-nums leading-none">
              {fmt(today)}
            </div>
          </div>
        </div>
      )}
    </WidgetSection>
  );
}
