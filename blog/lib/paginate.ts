import type { PostMeta } from './posts';

export const POSTS_PER_PAGE = 10;

export function paginate(posts: PostMeta[], page: number, per = POSTS_PER_PAGE) {
  const total = Math.max(1, Math.ceil(posts.length / per));
  const current = Math.min(Math.max(1, page), total);
  const start = (current - 1) * per;
  return {
    items: posts.slice(start, start + per),
    current,
    total,
  };
}
