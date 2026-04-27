import PostGrid from '@/components/PostGrid';
import Pagination from '@/components/Pagination';
import WidgetSlot from '@/components/WidgetSlot';
import { getAllPosts } from '@/lib/posts';
import { paginate } from '@/lib/paginate';
import { getSiteConfig } from '@/lib/site-server';

export default function Home() {
  const all = getAllPosts();
  const { items, current, total } = paginate(all, 1);
  const site = getSiteConfig();

  return (
    <div>
      <section className="mb-8 pb-6 border-b border-[var(--border-2)]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{site.title}</h1>
        <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
          {site.description ?? '엔지니어의 기술·커리어 기록 아카이브'}
        </p>
        <p className="text-xs text-[var(--muted-2)] mt-3">
          전체 {all.length}개의 글 · 최신순 정렬
        </p>
      </section>

      <WidgetSlot name="home_hero" layout="row" className="mb-8" />

      <PostGrid posts={items} />

      <Pagination
        current={current}
        total={total}
        hrefFor={(p) => (p === 1 ? '/' : `/p/${p}`)}
      />
    </div>
  );
}
