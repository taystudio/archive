import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://taehyuklee.github.io/Archive/blog';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: p.date,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/about/`, changeFrequency: 'yearly', priority: 0.5 },
    ...posts,
  ];
}
