import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import AdSlot from '@/components/AdSlot';
import ReadingProgress from '@/components/ReadingProgress';
import RelatedPosts from '@/components/RelatedPosts';
import WidgetSlot from '@/components/WidgetSlot';
import { getAllSlugs, getPost } from '@/lib/posts';
import { categoryLabel } from '@/lib/categories';
import { splitContentForMidAd } from '@/lib/split-content';

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const korChars = (text.match(/[\uAC00-\uD7AF]/g) ?? []).length;
  return Math.max(1, Math.round(words / 200 + korChars / 500));
}

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPost(slug);
    return {
      title: post.title,
      description: post.description,
      openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        publishedTime: post.date,
      },
    };
  } catch {
    return { title: 'Not found' };
  }
}

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    [rehypePrettyCode, { theme: 'github-dark' }],
  ],
} as const;

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  let post;
  try {
    post = getPost(slug);
  } catch {
    notFound();
  }

  const minutes = readingTime(post.content);
  const { before, after, didSplit } = splitContentForMidAd(post.content);
  const isLongEnough = post.content.length >= 800;

  return (
    <>
      <ReadingProgress />
      <article className="prose dark:prose-invert max-w-none">
        <div className="not-prose mb-4">
          <Link href="/" className="text-sm text-[var(--muted)] no-underline hover:underline">
            ← 목록으로
          </Link>
        </div>
        <header className="mb-8 not-prose">
          {post.category.length > 0 && (
            <div className="mb-2">
              <Link
                href={`/category/${post.category.join('/')}`}
                className="text-xs uppercase tracking-wider text-[var(--accent)] no-underline hover:underline"
              >
                {categoryLabel(post.category)}
              </Link>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mt-1">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-[var(--muted)] mt-3 text-[17px] leading-relaxed">
              {post.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mt-4">
            <time>{post.date}</time>
            <span>·</span>
            <span>약 {minutes}분</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] text-[var(--muted)] rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </header>

        {isLongEnough && (
          <div className="not-prose mb-8">
            <AdSlot name="post-top" />
          </div>
        )}

        <MDXRemote source={before} options={{ mdxOptions }} />

        {didSplit && isLongEnough && (
          <div className="not-prose my-8">
            <AdSlot name="post-mid" />
          </div>
        )}

        {didSplit && <MDXRemote source={after} options={{ mdxOptions }} />}

        {isLongEnough && (
          <div className="mt-12 not-prose">
            <AdSlot name="post-end" />
          </div>
        )}

        <WidgetSlot name="post_bottom" layout="row" className="mt-12 not-prose" />

        <RelatedPosts current={post} />

        <section className="mt-14 not-prose border-t border-[var(--border)] pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
            Comments
          </h2>
          <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
            💬 Giscus 댓글 연결 예정
          </div>
        </section>
      </article>
    </>
  );
}
