import { Fragment } from 'react';
import PostCard from './PostCard';
import AdSlot from './AdSlot';
import type { PostMeta } from '@/lib/posts';

const INFEED_EVERY = 6;

export default function PostGrid({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--muted)] border border-dashed border-[var(--border)] rounded-xl">
        아직 등록된 글이 없습니다.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {posts.map((p, idx) => (
        <Fragment key={p.slug}>
          <PostCard post={p} />
          {(idx + 1) % INFEED_EVERY === 0 && idx !== posts.length - 1 && (
            <li aria-hidden="true">
              <AdSlot name="infeed" />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  );
}
