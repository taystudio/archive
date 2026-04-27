'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSiteGoatcounter } from '@/lib/use-site-analytics';

type PostRef = { slug: string; title: string; path: string };

type Props = {
  posts: PostRef[];
  count?: number;
  siteCodeOverride?: string;
};

type Ranked = PostRef & { views: number };

export default function PopularPostsClient({ posts, count = 5, siteCodeOverride }: Props) {
  const code = useSiteGoatcounter(siteCodeOverride);
  const [ranked, setRanked] = useState<Ranked[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!code || posts.length === 0) return;
    let cancelled = false;
    const base = `https://${code}.goatcounter.com`;
    Promise.all(
      posts.map(async (p) => {
        try {
          const res = await fetch(`${base}/counter/${encodeURIComponent(p.path)}.json`);
          if (!res.ok) return { ...p, views: 0 };
          const data = await res.json();
          const n = data?.count_unique ?? data?.count ?? 0;
          return { ...p, views: typeof n === 'number' ? n : 0 };
        } catch {
          return { ...p, views: 0 };
        }
      }),
    )
      .then((arr) => {
        if (cancelled) return;
        const top = arr
          .filter((x) => x.views > 0)
          .sort((a, b) => b.views - a.views)
          .slice(0, count);
        setRanked(top);
      })
      .catch(() => {
        if (!cancelled) setErr(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, posts, count]);

  if (!code) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Settings → Analytics 에서 goatcounter 설정 시 활성화
      </p>
    );
  }

  if (err) {
    return <p className="text-xs text-[var(--muted)]">통계 로드 실패</p>;
  }

  if (ranked === null) {
    return <p className="text-xs text-[var(--muted)]">불러오는 중…</p>;
  }

  if (ranked.length === 0) {
    return <p className="text-xs text-[var(--muted)]">아직 조회수 데이터가 없습니다.</p>;
  }

  return (
    <ul className="space-y-2">
      {ranked.map((p, idx) => (
        <li key={p.slug}>
          <Link
            href={`/blog/${p.slug}`}
            className="flex gap-2 no-underline text-[var(--fg)] hover:text-[var(--accent)]"
          >
            <span className="text-[11px] font-semibold text-[var(--muted)] tabular-nums w-5 shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm line-clamp-2 leading-snug">{p.title}</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5 tabular-nums">
                {p.views.toLocaleString()} views
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
