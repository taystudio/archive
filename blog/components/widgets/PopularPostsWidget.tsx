import WidgetSection from './WidgetSection';
import { getAllPosts } from '@/lib/posts';
import PopularPostsClient from './PopularPostsClient';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function PopularPostsWidget({
  count = 5,
  siteCode,
}: {
  count?: number;
  siteCode?: string;
}) {
  const posts = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    path: `${BASE}/blog/${p.slug}/`,
  }));

  return (
    <WidgetSection title="Popular Posts">
      <PopularPostsClient posts={posts} count={count} siteCodeOverride={siteCode} />
    </WidgetSection>
  );
}
