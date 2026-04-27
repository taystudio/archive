'use client';

import { allCategoryPaths, categoryLabel } from '@/lib/categories';

export type Frontmatter = {
  title: string;
  description: string;
  excerpt: string;
  date: string;
  tags: string;
  slug: string;
  category: string; // stored as "a/b/c"
  thumbnail: string;
};

type Props = {
  value: Frontmatter;
  onChange: (v: Frontmatter) => void;
  slugLocked?: boolean;
  hideTitleAndSlug?: boolean;
};

const input =
  'w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]';
const label = 'text-xs font-medium text-[var(--muted)] mb-1 block';

const categoryOptions = allCategoryPaths().map((p) => ({
  value: p.join('/'),
  label: categoryLabel(p),
}));

export default function FrontmatterForm({ value, onChange, slugLocked, hideTitleAndSlug }: Props) {
  const set = <K extends keyof Frontmatter>(k: K, v: Frontmatter[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="grid gap-3 p-4">
      {!hideTitleAndSlug && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3">
          <div>
            <label className={label}>Title</label>
            <input
              className={input}
              value={value.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="글 제목"
            />
          </div>
          <div>
            <label className={label}>Date</label>
            <input
              type="date"
              className={input}
              value={value.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
        </div>
      )}

      {hideTitleAndSlug && (
        <div>
          <label className={label}>Date</label>
          <input
            type="date"
            className={input}
            value={value.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>
      )}

      {!hideTitleAndSlug && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>Slug (파일명)</label>
            <input
              className={input}
              value={value.slug}
              disabled={slugLocked}
              onChange={(e) =>
                set(
                  'slug',
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
                )
              }
              placeholder="my-post"
            />
          </div>
          <div>
            <label className={label}>Category</label>
            <select
              className={input}
              value={value.category}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">— 선택 없음 —</option>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {hideTitleAndSlug && (
        <div>
          <label className={label}>Category</label>
          <select
            className={input}
            value={value.category}
            onChange={(e) => set('category', e.target.value)}
          >
            <option value="">— 선택 없음 —</option>
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={label}>Tags (쉼표 구분)</label>
        <input
          className={input}
          value={value.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="nextjs, mdx"
        />
      </div>

      <div>
        <label className={label}>Thumbnail URL (선택)</label>
        <input
          className={input}
          value={value.thumbnail}
          onChange={(e) => set('thumbnail', e.target.value)}
          placeholder="/images/my-post/cover.jpg"
        />
      </div>

      <div>
        <label className={label}>Description (SEO 메타)</label>
        <input
          className={input}
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="검색 결과에 노출되는 한 줄 설명"
        />
      </div>

      <div>
        <label className={label}>Excerpt (목록 카드 미리보기 — 비우면 자동 생성)</label>
        <textarea
          className={input + ' min-h-16 resize-y'}
          value={value.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          placeholder="카드 리스트에서 보일 2~3줄 미리보기"
        />
      </div>
    </div>
  );
}
