'use client';

import { useEffect, useState } from 'react';
import { getPostHistory, type PostSnapshot } from '@/lib/post-history';

type Props = {
  slug: string;
  currentBody: string;
  currentData: Record<string, unknown>;
  refreshKey?: number;
  onRestore?: (data: Record<string, unknown>, body: string) => void;
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return d.toISOString().slice(0, 10);
}

function fmValue(data: Record<string, unknown> | null, key: string): string {
  if (!data) return '';
  const v = data[key];
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

const META_KEYS: Array<{ key: string; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'tags', label: 'Tags' },
  { key: 'description', label: 'Description' },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'thumbnail', label: 'Thumbnail' },
];

export default function PostHistory({
  slug,
  currentBody,
  currentData,
  refreshKey,
  onRestore,
}: Props) {
  const [snapshots, setSnapshots] = useState<PostSnapshot[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<PostSnapshot | null>(null);

  useEffect(() => {
    if (!slug) {
      setSnapshots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const hist = await getPostHistory(slug);
        if (!cancelled) setSnapshots(hist.snapshots);
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, refreshKey]);

  if (!slug) {
    return (
      <p className="p-4 text-sm text-[var(--muted)]">
        새 글은 저장 전이라 이력이 없습니다. 처음 저장하면 그 시점부터 스냅샷이 쌓입니다.
      </p>
    );
  }

  if (err) {
    return <div className="p-4 text-sm text-red-500">이력 로드 실패: {err}</div>;
  }

  if (snapshots == null) {
    return <p className="p-4 text-sm text-[var(--muted)]">불러오는 중…</p>;
  }

  if (snapshots.length === 0) {
    return (
      <p className="p-4 text-sm text-[var(--muted)]">
        아직 저장된 스냅샷이 없습니다. 다음에 "Publish" 를 누르면 첫 스냅샷이 기록됩니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ul className="shrink-0 max-h-[40vh] overflow-y-auto divide-y divide-[var(--border)]">
        {snapshots.map((s, idx) => {
          const active = selected?.id === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(s)}
                className={
                  'w-full text-left px-4 py-2.5 hover:bg-[var(--accent-soft)] transition ' +
                  (active ? 'bg-[var(--accent-soft)]' : '')
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--fg)]">
                    #{snapshots.length - idx}
                    {idx === 0 && (
                      <span className="ml-1.5 text-[10px] font-normal text-[var(--accent)]">
                        최신
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-[var(--muted)] shrink-0">
                    {relativeTime(s.timestamp)}
                  </span>
                </div>
                <div className="text-sm mt-1 line-clamp-1 leading-snug">
                  {fmValue(s.fm, 'title') || '(제목 없음)'}
                </div>
                <div className="text-[11px] text-[var(--muted-2)] mt-0.5">
                  {new Date(s.timestamp).toLocaleString()}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex-1 min-h-0 overflow-y-auto border-t border-[var(--border)]">
        {selected == null ? (
          <p className="p-4 text-sm text-[var(--muted)]">
            위에서 스냅샷을 클릭하면 그 시점 값이 여기에 나옵니다. 현재 편집 중인 값과 다른 필드는 배경색으로 표시됩니다.
          </p>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--muted)]">
                {new Date(selected.timestamp).toLocaleString()}
              </div>
              {onRestore && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        '이 시점 값으로 현재 편집 내용을 덮어쓸까요? (저장 전까지 파일엔 반영되지 않음)',
                      )
                    ) {
                      onRestore(selected.fm, selected.body);
                    }
                  }}
                  className="text-xs rounded-md border border-[var(--border)] hover:border-[var(--accent)] px-2 py-1"
                >
                  이 시점으로 복원
                </button>
              )}
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--muted)] text-left">
                  <th className="py-1 w-24">필드</th>
                  <th className="py-1">이 시점</th>
                </tr>
              </thead>
              <tbody>
                {META_KEYS.map(({ key, label }) => {
                  const past = fmValue(selected.fm, key);
                  const curr = fmValue(currentData, key);
                  const changed = past !== curr;
                  return (
                    <tr key={key} className="align-top">
                      <td className="py-1.5 pr-2 text-[var(--muted)]">{label}</td>
                      <td
                        className={
                          'py-1.5 pr-2 break-all ' +
                          (changed ? 'bg-[var(--accent-soft)] rounded px-1.5' : '')
                        }
                      >
                        {past || <span className="text-[var(--muted-2)]">(비어있음)</span>}
                        {changed && (
                          <div className="text-[10px] text-[var(--muted)] mt-0.5">
                            현재: {curr || '(비어있음)'}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="align-top">
                  <td className="py-1.5 pr-2 text-[var(--muted)]">본문 길이</td>
                  <td
                    className={
                      'py-1.5 pr-2 ' +
                      (selected.body.length !== currentBody.length
                        ? 'bg-[var(--accent-soft)] rounded px-1.5'
                        : '')
                    }
                  >
                    {selected.body.length.toLocaleString()} 자
                    {selected.body.length !== currentBody.length && (
                      <span className="ml-1 text-[10px] text-[var(--muted)]">
                        (현재 {currentBody.length.toLocaleString()} 자)
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <details className="pt-2 border-t border-[var(--border-2)]">
              <summary className="text-xs cursor-pointer text-[var(--muted)] hover:text-[var(--fg)]">
                이 시점 본문 미리보기
              </summary>
              <pre className="mt-2 text-[11px] bg-[var(--surface)] border border-[var(--border)] rounded p-2 max-h-64 overflow-auto whitespace-pre-wrap break-all">
                {selected.body.length > 4000
                  ? selected.body.slice(0, 4000) + '\n...(잘림)'
                  : selected.body}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
