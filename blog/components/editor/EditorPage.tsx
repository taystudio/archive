'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import FrontmatterForm, { type Frontmatter } from './FrontmatterForm';
import PostHistory from './PostHistory';
import { getFile, putFile } from '@/lib/github';
import { parseFrontmatter, serializeFrontmatter } from '@/lib/frontmatter';
import { appendPostSnapshot } from '@/lib/post-history';

const RichEditor = dynamic(() => import('./RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm text-[var(--muted)]">
      에디터 로딩 중…
    </div>
  ),
});

type Props = {
  initialSlug?: string;
  onClose: () => void;
  onSaved: () => void;
};

const DEFAULT_BODY = `## 안녕하세요

여기에 글을 작성하세요. 툴바에서 **B**, **H1**, **코드블록**, **이미지** 등을 사용하거나
상단의 Markdown / WYSIWYG 탭으로 모드를 전환할 수 있습니다.

\`\`\`ts
// 코드블록 예시
export function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`

여기서부터 이어서 작성하세요.
`;

const todayISO = () => new Date().toISOString().slice(0, 10);

// If the markdown body ends with a code fence, append an empty paragraph so
// the editor cursor can escape the code block after the last ``` line.
function ensureEscapableTrailing(md: string): string {
  const trimmed = md.replace(/\s+$/, '');
  if (/```[^\n]*$/.test(trimmed.split('\n').slice(-1)[0] ?? '')) {
    return trimmed + '\n\n\n';
  }
  return md;
}

export default function EditorPage({ initialSlug, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(!!initialSlug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMeta(false);
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [fm, setFm] = useState<Frontmatter>({
    title: '',
    description: '',
    excerpt: '',
    date: todayISO(),
    tags: '',
    slug: initialSlug ?? '',
    category: '',
    thumbnail: '',
  });
  const [body, setBody] = useState(DEFAULT_BODY);
  const shaRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialSlug) return;
    setLoading(true);
    getFile(`blog/posts/${initialSlug}.mdx`)
      .then((f) => {
        if (!f) {
          setError('파일을 찾을 수 없습니다.');
          return;
        }
        shaRef.current = f.sha;
        const { data, body: b } = parseFrontmatter(f.content);
        const catVal = data.category;
        const catStr = Array.isArray(catVal)
          ? catVal.join('/')
          : typeof catVal === 'string'
            ? catVal
            : '';
        setFm({
          title: String(data.title ?? ''),
          description: String(data.description ?? ''),
          excerpt: String(data.excerpt ?? ''),
          date: String(data.date ?? todayISO()),
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags ?? ''),
          slug: initialSlug,
          category: catStr,
          thumbnail: String(data.thumbnail ?? ''),
        });
        setBody(ensureEscapableTrailing(b));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug]);

  const handlePublish = async () => {
    if (!fm.title.trim()) return alert('제목을 입력해주세요.');
    if (!fm.slug.trim()) return alert('slug를 입력해주세요.');
    setSaving(true);
    setError(null);
    try {
      const tags = fm.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const category = fm.category
        ? fm.category.split('/').map((s) => s.trim()).filter(Boolean)
        : [];

      const data: Record<string, string | string[]> = {
        title: fm.title,
        description: fm.description,
        date: fm.date,
        tags,
      };
      if (fm.excerpt.trim()) data.excerpt = fm.excerpt.trim();
      if (category.length) data.category = category;
      if (fm.thumbnail.trim()) data.thumbnail = fm.thumbnail.trim();

      const content = serializeFrontmatter(data, body);
      const path = `blog/posts/${fm.slug}.mdx`;
      const message = shaRef.current
        ? `docs(blog): update "${fm.title}"`
        : `docs(blog): add "${fm.title}"`;
      await putFile(path, content, message, shaRef.current ?? undefined);

      try {
        await appendPostSnapshot(fm.slug, data, body);
      } catch (histErr) {
        console.warn('snapshot failed (post saved OK):', histErr);
      }

      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-[var(--muted)]">불러오는 중…</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 h-12 border-b border-[var(--border)]">
        <button onClick={onClose} className="text-sm hover:underline shrink-0">
          ← 목록
        </button>
        <div className="text-xs text-[var(--muted)] hidden sm:block shrink-0">
          {initialSlug ? `편집: ${initialSlug}` : '새 글'}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {initialSlug && (
            <button
              onClick={() => setShowHistory(true)}
              className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs hover:border-[var(--accent)]"
              title="이전 버전 이력 보기"
            >
              📜 히스토리
            </button>
          )}
          <button
            onClick={() => setShowMeta(true)}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs hover:border-[var(--accent)]"
            title="메타/옵션 (카테고리, 태그, 썸네일, 설명 등)"
          >
            ⚙ 옵션
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="rounded-md bg-[var(--accent)] text-white px-3 py-1 text-sm disabled:opacity-50"
          >
            {saving ? '발행 중…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* title + slug strip — always visible */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-[var(--border-2)]">
        <input
          className="flex-1 bg-transparent outline-none text-lg font-semibold placeholder:text-[var(--muted-2)]"
          placeholder="제목을 입력하세요"
          value={fm.title}
          onChange={(e) => setFm((f) => ({ ...f, title: e.target.value }))}
        />
        <span className="text-[var(--muted-2)] text-xs shrink-0">/</span>
        <input
          className="w-36 sm:w-48 bg-transparent outline-none text-xs text-[var(--muted)] placeholder:text-[var(--muted-2)] disabled:opacity-60"
          placeholder="slug"
          value={fm.slug}
          disabled={!!initialSlug}
          onChange={(e) =>
            setFm((f) => ({
              ...f,
              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
            }))
          }
        />
      </div>

      {error && (
        <div className="shrink-0 px-4 py-2 bg-red-500/10 text-red-600 text-sm border-b border-red-500/20">
          {error}
        </div>
      )}

      {/* editor — fills the rest */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <RichEditor value={body} onChange={setBody} slug={fm.slug} />
      </div>

      {/* history drawer (right side, overlay) */}
      {showHistory && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setShowHistory(false)}
          role="dialog"
          aria-label="포스트 이력"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          <aside
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[520px] max-w-full bg-[var(--bg)] border-l border-[var(--border)] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-4 h-11 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold">📜 이력</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-sm text-[var(--muted)] hover:text-[var(--fg)] px-2"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PostHistory
                slug={initialSlug ?? ''}
                currentBody={body}
                currentData={{
                  title: fm.title,
                  date: fm.date,
                  category: fm.category,
                  tags: fm.tags
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  description: fm.description,
                  excerpt: fm.excerpt,
                  thumbnail: fm.thumbnail,
                }}
                onRestore={(data, bodyText) => {
                  const catVal = data.category;
                  const catStr = Array.isArray(catVal)
                    ? catVal.join('/')
                    : typeof catVal === 'string'
                      ? catVal
                      : '';
                  const tagsVal = data.tags;
                  const tagsStr = Array.isArray(tagsVal)
                    ? tagsVal.join(', ')
                    : typeof tagsVal === 'string'
                      ? tagsVal
                      : '';
                  setFm((f) => ({
                    ...f,
                    title: String(data.title ?? f.title),
                    description: String(data.description ?? ''),
                    excerpt: String(data.excerpt ?? ''),
                    date: String(data.date ?? f.date),
                    tags: tagsStr,
                    category: catStr,
                    thumbnail: String(data.thumbnail ?? ''),
                  }));
                  setBody(bodyText);
                  setShowHistory(false);
                }}
              />
            </div>
          </aside>
        </div>
      )}

      {/* meta drawer (right side, overlay) */}
      {showMeta && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setShowMeta(false)}
          role="dialog"
          aria-label="메타 옵션"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          <aside
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] max-w-full bg-[var(--bg)] border-l border-[var(--border)] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-11 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
              <h3 className="text-sm font-semibold">옵션</h3>
              <button
                onClick={() => setShowMeta(false)}
                className="text-sm text-[var(--muted)] hover:text-[var(--fg)] px-2"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <FrontmatterForm
              value={fm}
              onChange={setFm}
              slugLocked={!!initialSlug}
              hideTitleAndSlug
            />
          </aside>
        </div>
      )}
    </div>
  );
}
