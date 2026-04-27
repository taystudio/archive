'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteFile, getFile, listDir } from '@/lib/github';
import { parseFrontmatter } from '@/lib/frontmatter';

type Row = {
  slug: string;
  title: string;
  date: string;
  sha: string;
};

export default function PostList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<string>('');

  useEffect(() => {
    setUser(localStorage.getItem('gh_user') ?? '');

    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const entries = await listDir('blog/posts');
        const mdx = entries.filter((e) => e.type === 'file' && e.name.endsWith('.mdx'));
        const loaded = await Promise.all(
          mdx.map(async (e) => {
            const f = await getFile(e.path);
            const slug = e.name.replace(/\.mdx$/, '');
            if (!f) return { slug, title: slug, date: '', sha: e.sha };
            const { data } = parseFrontmatter(f.content);
            return {
              slug,
              title: String(data.title ?? slug),
              date: String(data.date ?? ''),
              sha: f.sha,
            };
          }),
        );
        if (cancelled) return;
        setRows(loaded.sort((a, b) => (a.date < b.date ? 1 : -1)));
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (row: Row) => {
    if (!confirm(`"${row.title}" 삭제할까요?`)) return;
    try {
      await deleteFile(`blog/posts/${row.slug}.mdx`, row.sha, `docs(blog): remove "${row.title}"`);
      setRows((r) => r.filter((x) => x.slug !== row.slug));
    } catch (e: unknown) {
      alert('삭제 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          {user && (
            <p className="text-xs text-[var(--muted)] mt-1">
              로그인: <strong>{user}</strong>
            </p>
          )}
        </div>
        <Link
          href="/admin/write"
          className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-sm no-underline"
        >
          + 새 글
        </Link>
      </div>

      {loading && <p className="text-[var(--muted)]">불러오는 중…</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}

      {!loading && rows.length === 0 && !err && (
        <p className="text-[var(--muted)]">아직 글이 없습니다. "+ 새 글" 버튼으로 시작하세요.</p>
      )}

      <ul className="divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.slug} className="py-3 flex items-center justify-between gap-4">
            <Link
              href={`/admin/write/${r.slug}`}
              className="flex-1 min-w-0 no-underline text-[var(--fg)]"
            >
              <div className="font-medium truncate">{r.title}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5 truncate">
                {r.date} · {r.slug}
              </div>
            </Link>
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/admin/write/${r.slug}`}
                className="text-xs rounded-md border border-[var(--border)] px-2 py-1 no-underline text-[var(--fg)]"
              >
                편집
              </Link>
              <button
                onClick={() => handleDelete(r)}
                className="text-xs rounded-md border border-red-500/50 text-red-500 px-2 py-1"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
