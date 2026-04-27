import Link from 'next/link';
import WidgetSection from './WidgetSection';
import { countByTag } from '@/lib/posts';

export default function TagCloudWidget({ max = 30 }: { max?: number }) {
  const tags = countByTag().slice(0, max);
  if (tags.length === 0) return null;

  return (
    <WidgetSection title="Tag Cloud">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(([t, n]) => (
          <Link
            key={t}
            href={`/tags#${t}`}
            className="text-[11px] rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5 no-underline text-[var(--muted)] hover:text-[var(--fg)]"
          >
            #{t} {n > 1 && <span className="opacity-60">{n}</span>}
          </Link>
        ))}
      </div>
    </WidgetSection>
  );
}
