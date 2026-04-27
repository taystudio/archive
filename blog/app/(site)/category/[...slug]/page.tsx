import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PostGrid from '@/components/PostGrid';
import Pagination from '@/components/Pagination';
import { allCategoryPaths, categoryLabel, findByPath } from '@/lib/categories';
import { getPostsByCategory } from '@/lib/posts';
import { paginate } from '@/lib/paginate';

type Params = { slug: string[] };

export function generateStaticParams(): Params[] {
  return allCategoryPaths().map((p) => ({ slug: p }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const label = categoryLabel(slug);
  return {
    title: label || 'Category',
    description: `${label} 카테고리의 글`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const node = findByPath(slug);
  if (!node) notFound();

  const posts = getPostsByCategory(slug);
  const { items, current, total } = paginate(posts, 1);
  const label = categoryLabel(slug);

  return (
    <div>
      <section className="mb-6 pb-6 border-b border-[var(--border)]">
        <div className="text-xs text-[var(--muted)] mb-1">
          <Link href="/" className="no-underline hover:underline">Home</Link>
          {' / '}
          <span>Category</span>
        </div>
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="text-sm text-[var(--muted)] mt-1">총 {posts.length}개 글</p>
      </section>

      <PostGrid posts={items} />

      <Pagination
        current={current}
        total={total}
        hrefFor={() => `/category/${slug.join('/')}`}
      />
    </div>
  );
}
