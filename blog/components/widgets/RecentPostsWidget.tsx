import Link from 'next/link';
import WidgetSection from './WidgetSection';
import { getAllPosts } from '@/lib/posts';

export default function RecentPostsWidget({ count = 5 }: { count?: number }) {
  const recent = getAllPosts().slice(0, count);

  return (
    <WidgetSection title="Recent Posts">
      {recent.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">아직 글이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="block no-underline text-[var(--fg)] hover:text-[var(--accent)] text-sm"
              >
                <div className="line-clamp-2 leading-snug">{p.title}</div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">{p.date}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetSection>
  );
}
