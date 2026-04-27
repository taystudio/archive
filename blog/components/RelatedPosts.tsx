import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';
import { getAllPosts } from '@/lib/posts';
import { categoryLabel } from '@/lib/categories';

function score(a: PostMeta, b: PostMeta): number {
  let s = 0;
  const minLen = Math.min(a.category.length, b.category.length);
  for (let i = 0; i < minLen; i++) {
    if (a.category[i] === b.category[i]) s += 4 - i;
    else break;
  }
  const aTags = new Set(a.tags);
  for (const t of b.tags) if (aTags.has(t)) s += 2;
  return s;
}

export default function RelatedPosts({ current }: { current: PostMeta }) {
  const all = getAllPosts().filter((p) => p.slug !== current.slug);
  const ranked = all
    .map((p) => ({ p, s: score(current, p) }))
    .sort((a, b) => (b.s - a.s) || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, 3)
    .map((x) => x.p);

  if (ranked.length === 0) return null;

  return (
    <section className="mt-14 not-prose">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
        관련 글
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((p) => {
          const cat = categoryLabel(p.category);
          return (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="card-hover block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 no-underline text-[var(--fg)] h-full"
              >
                {cat && (
                  <div className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-1 truncate">
                    {cat}
                  </div>
                )}
                <h3 className="font-semibold text-sm leading-snug line-clamp-2">{p.title}</h3>
                {(p.excerpt || p.description) && (
                  <p className="mt-1.5 text-xs text-[var(--muted)] line-clamp-2">
                    {p.excerpt || p.description}
                  </p>
                )}
                <div className="mt-2 text-[11px] text-[var(--muted)]">
                  {p.date.replaceAll('-', '.')}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
