import WidgetSection from './WidgetSection';
import { countByTag, getAllPosts } from '@/lib/posts';

export default function StatsWidget() {
  const posts = getAllPosts();
  const tags = countByTag().length;

  return (
    <WidgetSection title="Stats">
      <ul className="text-xs text-[var(--muted)] space-y-1">
        <li>
          총 글 수: <strong className="text-[var(--fg)]">{posts.length}</strong>
        </li>
        <li>
          태그 수: <strong className="text-[var(--fg)]">{tags}</strong>
        </li>
      </ul>
    </WidgetSection>
  );
}
