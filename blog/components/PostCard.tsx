import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';
import { categoryLabel } from '@/lib/categories';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function resolveThumb(src?: string): string | null {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith(BASE)) return src;
  if (src.startsWith('/')) return `${BASE}${src}`;
  return src;
}

export default function PostCard({ post }: { post: PostMeta }) {
  const thumb = resolveThumb(post.thumbnail);
  const cat = categoryLabel(post.category);

  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="card-hover group flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden p-4 no-underline text-[var(--fg)]"
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-md shrink-0 bg-black/5 dark:bg-white/5"
            loading="lazy"
          />
        ) : (
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-md shrink-0 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-3xl text-[var(--accent)]/60">
            📄
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          {cat && (
            <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] mb-1 truncate">
              {cat}
            </div>
          )}
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition">
            {post.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
            {post.excerpt || post.description}
          </p>
          <div className="mt-auto pt-2 flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <time>{post.date.replaceAll('-', '.')}</time>
            {post.tags.length > 0 && (
              <>
                <span>·</span>
                <span className="truncate">
                  {post.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
