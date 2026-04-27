import type { Metadata } from 'next';
import Link from 'next/link';
import { countByTag, getAllPosts, getPostsByTag } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Tags',
  description: '전체 태그 목록',
};

export default function TagsPage() {
  const tags = countByTag();
  const posts = getAllPosts();

  return (
    <div>
      <section className="mb-8 pb-6 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          총 {tags.length}개 · 글 {posts.length}개
        </p>
      </section>

      <section className="mb-10">
        <div className="flex flex-wrap gap-2">
          {tags.map(([t, n]) => (
            <a
              key={t}
              href={`#${t}`}
              className="text-sm rounded-full border border-[var(--border)] px-3 py-1 no-underline text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              #{t} <span className="text-[var(--muted)]">({n})</span>
            </a>
          ))}
        </div>
      </section>

      {tags.map(([tag]) => {
        const list = getPostsByTag(tag);
        return (
          <section key={tag} id={tag} className="mb-10 scroll-mt-20">
            <h2 className="text-lg font-semibold border-b border-[var(--border)] pb-2 mb-3">
              #{tag} <span className="text-sm text-[var(--muted)]">({list.length})</span>
            </h2>
            <ul className="divide-y divide-[var(--border)]">
              {list.map((p) => (
                <li key={p.slug} className="py-2">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="flex justify-between gap-3 no-underline text-[var(--fg)] hover:text-[var(--accent)]"
                  >
                    <span className="truncate">{p.title}</span>
                    <time className="text-xs text-[var(--muted)] shrink-0">{p.date}</time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
