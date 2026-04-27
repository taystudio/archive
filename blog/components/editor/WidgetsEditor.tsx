'use client';

import { useEffect, useRef, useState } from 'react';
import { getFile, putFile } from '@/lib/github';
import {
  SLOT_LABELS,
  SLOT_NAMES,
  type WidgetConfig,
  type WidgetSlotName,
  type WidgetType,
  type WidgetsFile,
} from '@/lib/widgets';
import { WIDGET_META, WIDGET_TYPES, type FieldSchema } from '@/lib/widget-schemas';

const CONFIG_PATH = 'blog/config/widgets.json';

const EMPTY_FILE: WidgetsFile = {
  slots: { sidebar: [], home_hero: [], post_bottom: [] },
};

const input =
  'rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm outline-none focus:border-[var(--accent)]';

type Props = {
  onSavedMessage?: (msg: string) => void;
};

function normalize(raw: unknown): WidgetsFile {
  if (raw && typeof raw === 'object' && 'widgets' in raw && Array.isArray((raw as { widgets: unknown }).widgets)) {
    return {
      slots: {
        sidebar: (raw as { widgets: WidgetConfig[] }).widgets,
        home_hero: [],
        post_bottom: [],
      },
    };
  }
  const r = raw as Partial<WidgetsFile> | null;
  if (!r || typeof r !== 'object' || !r.slots) return EMPTY_FILE;
  return {
    slots: {
      sidebar: Array.isArray(r.slots.sidebar) ? r.slots.sidebar : [],
      home_hero: Array.isArray(r.slots.home_hero) ? r.slots.home_hero : [],
      post_bottom: Array.isArray(r.slots.post_bottom) ? r.slots.post_bottom : [],
    },
  };
}

export default function WidgetsEditor({ onSavedMessage }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cfg, setCfg] = useState<WidgetsFile>(EMPTY_FILE);
  const [activeSlot, setActiveSlot] = useState<WidgetSlotName>('sidebar');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const shaRef = useRef<string | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const f = await getFile(CONFIG_PATH);
        if (f) {
          shaRef.current = f.sha;
          try {
            setCfg(normalize(JSON.parse(f.content)));
          } catch {
            setErr('widgets.json 파싱 실패. 기본값으로 표시.');
          }
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = cfg.slots[activeSlot] ?? [];

  const updateList = (next: WidgetConfig[]) => {
    setCfg((c) => ({ ...c, slots: { ...c.slots, [activeSlot]: next } }));
  };

  const addWidget = (type: WidgetType) => {
    const meta = WIDGET_META[type];
    updateList([...list, { type, enabled: true, props: { ...(meta.defaultProps ?? {}) } }]);
    setOpenIdx(list.length);
  };

  const toggleEnabled = (i: number) => {
    updateList(list.map((w, idx) => (idx === i ? { ...w, enabled: w.enabled === false } : w)));
  };

  const remove = (i: number) => {
    if (!confirm('이 위젯을 삭제할까요?')) return;
    updateList(list.filter((_, idx) => idx !== i));
    setOpenIdx(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const arr = [...list];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    updateList(arr);
    setOpenIdx((cur) => (cur === i ? j : cur === j ? i : cur));
  };

  const moveTo = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const arr = [...list];
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    updateList(arr);
    setOpenIdx((cur) => (cur === from ? to : cur));
  };

  const updateProp = (i: number, key: string, value: string | number) => {
    updateList(
      list.map((w, idx) =>
        idx === i
          ? { ...w, props: { ...(w.props ?? {}), [key]: value } }
          : w,
      ),
    );
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const content = JSON.stringify(cfg, null, 2) + '\n';
      await putFile(
        CONFIG_PATH,
        content,
        `chore(blog): update widgets config`,
        shaRef.current ?? undefined,
      );
      const refreshed = await getFile(CONFIG_PATH);
      if (refreshed) shaRef.current = refreshed.sha;
      onSavedMessage?.('위젯 설정 저장됨. 사이트 재빌드 후 반영.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-center text-[var(--muted)] text-sm">위젯 설정 로딩 중…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          위젯 ({Object.values(cfg.slots).reduce((n, arr) => n + arr.length, 0)})
        </h2>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {saving ? '저장 중…' : '위젯만 저장'}
        </button>
      </div>

      {err && <p className="text-red-500 text-xs mb-3">{err}</p>}

      {/* Slot tabs */}
      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {SLOT_NAMES.map((s) => {
          const active = s === activeSlot;
          const count = cfg.slots[s]?.length ?? 0;
          return (
            <button
              key={s}
              onClick={() => {
                setActiveSlot(s);
                setOpenIdx(null);
              }}
              className={
                'px-3 py-2 text-xs border-b-2 -mb-px ' +
                (active
                  ? 'border-[var(--accent)] text-[var(--accent)] font-medium'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--fg)]')
              }
            >
              {SLOT_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Add widget */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--muted)]">추가:</span>
        {WIDGET_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => addWidget(t)}
            className="text-xs rounded-md border border-[var(--border)] px-2 py-1 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            + {WIDGET_META[t].label}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-6 text-center border border-dashed border-[var(--border)] rounded-md">
          이 슬롯에 위젯이 없습니다. 위에서 추가하세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((w, i) => {
            const meta = WIDGET_META[w.type];
            const isOpen = openIdx === i;
            const disabled = w.enabled === false;
            return (
              <li
                key={`${w.type}-${i}`}
                draggable
                onDragStart={(e) => {
                  dragIdxRef.current = i;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragIdxRef.current;
                  dragIdxRef.current = null;
                  if (from == null || from === i) return;
                  moveTo(from, i);
                }}
                className={
                  'rounded-md border p-2 ' +
                  (disabled
                    ? 'border-[var(--border)] bg-transparent opacity-60'
                    : 'border-[var(--border)] bg-[var(--surface)]')
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className="cursor-grab select-none text-[var(--muted)] text-sm px-1"
                    title="드래그하여 순서 변경"
                  >
                    ≡
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="text-[10px] px-1 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === list.length - 1}
                      className="text-[10px] px-1 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {meta?.label ?? w.type}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] truncate">
                      {meta?.description ?? w.type}
                    </div>
                  </div>

                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={!disabled}
                      onChange={() => toggleEnabled(i)}
                    />
                    활성
                  </label>

                  {meta && Object.keys(meta.fields).length > 0 && (
                    <button
                      onClick={() => setOpenIdx((cur) => (cur === i ? null : i))}
                      className="text-xs rounded-md border border-[var(--border)] px-2 py-1"
                    >
                      {isOpen ? '닫기' : '편집'}
                    </button>
                  )}

                  <button
                    onClick={() => remove(i)}
                    className="text-xs rounded-md border border-red-500/50 text-red-500 px-2 py-1"
                  >
                    삭제
                  </button>
                </div>

                {isOpen && meta && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] grid gap-3 sm:grid-cols-2">
                    {Object.entries(meta.fields).map(([key, schema]) => (
                      <FieldInput
                        key={key}
                        name={key}
                        schema={schema}
                        value={
                          (w.props?.[key] as string | number | undefined) ??
                          schema.default ??
                          ''
                        }
                        onChange={(v) => updateProp(i, key, v)}
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FieldInput({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: FieldSchema;
  value: string | number;
  onChange: (v: string | number) => void;
}) {
  return (
    <div>
      <label className="text-xs block mb-1">
        {schema.label}
        <span className="ml-1 text-[10px] text-[var(--muted-2)]">({name})</span>
      </label>
      {schema.kind === 'select' ? (
        <select
          className={`${input} w-full`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          {(schema.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : schema.kind === 'number' ? (
        <input
          type="number"
          className={`${input} w-full`}
          value={String(value ?? '')}
          placeholder={schema.placeholder}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
        />
      ) : (
        <input
          type="text"
          className={`${input} w-full`}
          value={String(value ?? '')}
          placeholder={schema.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {schema.hint && (
        <p className="text-[10px] text-[var(--muted)] mt-1 leading-snug">{schema.hint}</p>
      )}
    </div>
  );
}
