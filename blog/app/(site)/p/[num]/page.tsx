import { notFound } from 'next/navigation';
import PostGrid from '@/components/PostGrid';
import Pagination from '@/components/Pagination';
import { getAllPosts } from '@/lib/posts';
import { paginate, POSTS_PER_PAGE } from '@/lib/paginate';

type Params = { num: string };

export function generateStaticParams(): Params[] {
  const all = getAllPosts();
  const total = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
  const out: Params[] = [];
  for (let i = 2; i <= total; i++) out.push({ num: String(i) });
  // Ensure at least one param for Next.js static export; extras simply notFound()
  return out.length > 0 ? out : [{ num: '2' }];
}

export const dynamicParams = false;

export default async function PagedHome({ params }: { params: Promise<Params> }) {
  const { num } = await params;
  const page = Number(num);
  if (!Number.isInteger(page) || page < 2) notFound();

  const all = getAllPosts();
  const { items, current, total } = paginate(all, page);
  if (current !== page) notFound();

  return (
    <div>
      <section className="mb-6 pb-6 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold">전체 글 ({all.length})</h1>
        <p className="text-sm text-[var(--muted)] mt-1">페이지 {current} / {total}</p>
      </section>

      <PostGrid posts={items} />

      <Pagination
        current={current}
        total={total}
        hrefFor={(p) => (p === 1 ? '/' : `/p/${p}`)}
      />
    </div>
  );
}
