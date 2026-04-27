'use client';

import { useEffect, useRef } from 'react';
import Editor from '@toast-ui/editor';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js';
// @ts-expect-error - no types shipped
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import 'tui-color-picker/dist/tui-color-picker.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import 'prismjs/themes/prism.css';
import { uploadImage } from '@/lib/github';
import { searchLanguages, type Language } from '@/lib/languages';

type Props = {
  value: string;
  onChange: (v: string) => void;
  slug: string;
  onImageSlugRequired?: () => void;
};

type AlignDir = 'left' | 'center' | 'right';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ALIGN_DIV_OPEN = `<div class="text-(?:left|center|right)"(?:\\s+style="text-align:(?:left|center|right)")?>`;

function collapseNestedAlignDivs(md: string): string {
  // Collapse nested alignment wrappers, keeping the innermost (user's latest).
  const nestRe = new RegExp(
    `${ALIGN_DIV_OPEN}\\s*\\n+\\s*(${ALIGN_DIV_OPEN}[\\s\\S]*?<\\/div>)\\s*\\n+\\s*<\\/div>`,
    'g',
  );
  let prev = '';
  let cur = md;
  let safety = 10;
  while (prev !== cur && safety-- > 0) {
    prev = cur;
    cur = cur.replace(nestRe, '$1');
  }
  return cur;
}

type CursorContext = {
  isTable: boolean;
  tableFirstCellText: string | null;
  blockText: string | null;
};

function getCursorContext(ed: Editor): CursorContext {
  try {
    const ww = (ed as unknown as {
      getCurrentModeEditor: () => { view?: unknown } | undefined;
    }).getCurrentModeEditor?.();
    const view = (ww as { view?: unknown } | undefined)?.view as
      | {
          state: {
            selection: {
              $from: {
                depth: number;
                node: (d: number) => {
                  type: { name: string };
                  textContent: string;
                  isBlock: boolean;
                  firstChild?: { textContent?: string } | null;
                };
              };
            };
          };
        }
      | undefined;
    if (!view) return { isTable: false, tableFirstCellText: null, blockText: null };
    const $from = view.state.selection.$from;
    let tableNode: { textContent: string } | null = null;
    let blockText: string | null = null;
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d);
      if (!tableNode && node.type.name === 'table') {
        tableNode = node;
      }
      if (
        !blockText &&
        node.isBlock &&
        !['doc', 'table', 'tableBody', 'tableHead', 'tableRow', 'tableHeadCell', 'tableBodyCell'].includes(
          node.type.name,
        )
      ) {
        blockText = node.textContent;
      }
    }
    let firstCell: string | null = null;
    if (tableNode) {
      const lines = tableNode.textContent.split('\n').map((l) => l.trim()).filter(Boolean);
      firstCell = lines[0] ?? null;
    }
    return { isTable: !!tableNode, tableFirstCellText: firstCell, blockText };
  } catch {
    return { isTable: false, tableFirstCellText: null, blockText: null };
  }
}

function findTableMarkdownBlock(md: string, firstCellHint: string | null): { full: string; start: number; end: number } | null {
  const re = /(?:^|\n)(\|[^\n]*\|\n\|[\s\-:|]+\|\n(?:\|[^\n]*\|\n?)+)/g;
  const matches: Array<{ full: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    matches.push({ full: m[1], start: m.index + (m[0].length - m[1].length), end: m.index + m[0].length });
  }
  if (matches.length === 0) return null;
  if (!firstCellHint) return matches[0];
  // Prefer the table whose first data cell matches the hint
  const hit = matches.find((x) => x.full.includes(firstCellHint));
  return hit ?? matches[0];
}

function applyTableAlignment(_ed: Editor, _dir: AlignDir, _firstCellHint: string | null) {
  // Table alignment is not supported because:
  // 1. Markdown tables require multi-line syntax (\n between rows).
  // 2. Toast UI's WYSIWYG doesn't preserve <div> wrappers around tables — the
  //    alignment info is stripped on round-trip (setMarkdown → edit → getMarkdown).
  // 3. Registering <div> as an htmlBlock node makes it atom: true → the whole
  //    table becomes non-editable.
  // Until Toast UI supports alignment natively (or we fork the schema), we
  // explicitly block this to avoid silently mangling the table.
  alert(
    '테이블 정렬은 현재 지원되지 않습니다.\n\n' +
      'Toast UI Editor 한계로 테이블 래퍼가 저장 시 유실되거나 파이프 기호만 남는 문제가 생깁니다. ' +
      '테이블 밖 문단으로 커서를 이동한 후 정렬 버튼을 눌러주세요.',
  );
}

function applyAlignment(ed: Editor, dir: AlignDir) {
  let selected = (ed.getSelectedText() || '').trim();

  if (!selected) {
    const ctx = getCursorContext(ed);
    if (ctx.isTable) {
      applyTableAlignment(ed, dir, ctx.tableFirstCellText);
      return;
    }
    selected = (ctx.blockText ?? '').trim();
  }

  if (!selected) {
    alert('정렬할 텍스트를 드래그하거나 해당 줄에 커서를 두세요.');
    return;
  }

  const md = ed.getMarkdown();
  const esc = escapeRegex(selected);

  // Case 1: selection is inside an existing wrapper — swap class
  const wrapperRe = new RegExp(
    `${ALIGN_DIV_OPEN}([\\s\\S]*?${esc}[\\s\\S]*?)</div>`,
  );
  const m = md.match(wrapperRe);
  if (m) {
    const inner = m[1].trim();
    const replacement = `<div class="text-${dir}" style="text-align:${dir}">${inner.trim().replace(/\n\n+/g, '<br>').replace(/\n/g, ' ')}</div>`;
    const swapped = md.replace(wrapperRe, replacement);
    ed.setMarkdown(collapseNestedAlignDivs(swapped));
    return;
  }

  // Case 2: fresh wrap at the first occurrence.
  const selRe = new RegExp(esc);
  if (!selRe.test(md)) {
    alert('해당 텍스트를 마크다운에서 찾지 못했습니다.');
    return;
  }
  // Replace just the text in-place. Rely on surrounding paragraph boundaries
  // for block-level HTML spacing — adding extra \n\n here would create a
  // visible empty paragraph above the wrapped content.
  // Single-line HTML block form: `<div>content</div>` on one line.
  // This keeps it as ONE markdown HTML block (type 6) so Toast UI preserves
  // the div with its attributes. Multi-paragraph or blank lines inside the div
  // would split into two blocks and break parsing.
  const inline = selected
    .replace(/\n\n+/g, '<br>') // collapse blank-line breaks to <br>
    .replace(/\n/g, ' '); // soft line-breaks to space
  const newMd = md.replace(
    selRe,
    `<div class="text-${dir}" style="text-align:${dir}">${inline}</div>`,
  );
  ed.setMarkdown(collapseNestedAlignDivs(newMd));
}

function buildMarkdownTable(rows: number, cols: number): string {
  const safeRows = Math.max(1, Math.min(50, Math.floor(rows)));
  const safeCols = Math.max(1, Math.min(20, Math.floor(cols)));
  const emptyRow = '|' + '     |'.repeat(safeCols);
  const sep = '|' + ' --- |'.repeat(safeCols);
  const body = Array.from({ length: safeRows }, () => emptyRow).join('\n');
  return `\n\n${emptyRow}\n${sep}\n${body}\n\n`;
}

function showTableDialog(getEditor: () => Editor | null) {
  if (document.querySelector('.tbl-dialog-backdrop')) return;

  const MAX_ROWS = 10;
  const MAX_COLS = 10;

  const backdrop = document.createElement('div');
  backdrop.className = 'tbl-dialog-backdrop';
  backdrop.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:9999;display:flex;align-items:center;justify-content:center;';

  const panel = document.createElement('div');
  panel.style.cssText =
    'background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:10px;padding:18px;min-width:320px;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-size:13px;';

  // Build grid picker cells (MAX_ROWS x MAX_COLS). Hover = highlight top-left to cursor, click = select.
  const cellsHtml = Array.from({ length: MAX_ROWS }, (_, r) =>
    Array.from({ length: MAX_COLS }, (_, c) =>
      `<div class="tbl-cell" data-r="${r + 1}" data-c="${c + 1}" style="width:18px;height:18px;border:1px solid var(--border);background:var(--surface);box-sizing:border-box;cursor:pointer;"></div>`,
    ).join(''),
  ).join('');

  panel.innerHTML = `
    <div style="font-weight:600;margin-bottom:12px;">테이블 만들기</div>

    <div id="tbl-grid" style="display:grid;grid-template-columns:repeat(${MAX_COLS}, 18px);gap:2px;margin-bottom:6px;user-select:none;">
      ${cellsHtml}
    </div>
    <div id="tbl-grid-label" style="font-size:11px;color:var(--muted);margin-bottom:12px;">마우스로 크기 지정 · 클릭해서 삽입</div>

    <div style="border-top:1px solid var(--border);padding-top:12px;">
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">또는 직접 입력</div>
      <div style="display:grid;grid-template-columns:60px 1fr;gap:8px;align-items:center;margin-bottom:12px;">
        <label for="tbl-rows-input">행 (body)</label>
        <input id="tbl-rows-input" type="number" min="1" max="50" value="3"
          style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--fg);font-size:13px;" />
        <label for="tbl-cols-input">열</label>
        <input id="tbl-cols-input" type="number" min="1" max="20" value="3"
          style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--fg);font-size:13px;" />
      </div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:12px;">
        첫 줄은 자동으로 헤더가 됩니다. 행은 본문 행 수.
      </div>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button type="button" id="tbl-cancel" style="padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--fg);cursor:pointer;font-size:12px;">취소</button>
      <button type="button" id="tbl-ok" style="padding:5px 14px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600;">삽입</button>
    </div>
  `;
  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);

  const rowsInput = panel.querySelector<HTMLInputElement>('#tbl-rows-input')!;
  const colsInput = panel.querySelector<HTMLInputElement>('#tbl-cols-input')!;
  const okBtn = panel.querySelector<HTMLButtonElement>('#tbl-ok')!;
  const cancelBtn = panel.querySelector<HTMLButtonElement>('#tbl-cancel')!;
  const grid = panel.querySelector<HTMLDivElement>('#tbl-grid')!;
  const label = panel.querySelector<HTMLDivElement>('#tbl-grid-label')!;

  const highlightGrid = (rows: number, cols: number) => {
    grid.querySelectorAll<HTMLDivElement>('.tbl-cell').forEach((cell) => {
      const r = Number(cell.dataset.r);
      const c = Number(cell.dataset.c);
      const active = r <= rows && c <= cols;
      cell.style.background = active ? 'var(--accent-soft)' : 'var(--surface)';
      cell.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
    });
  };

  grid.addEventListener('mouseover', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('.tbl-cell');
    if (!t) return;
    const r = Number(t.dataset.r);
    const c = Number(t.dataset.c);
    highlightGrid(r, c);
    label.textContent = `${r} × ${c}`;
    rowsInput.value = String(Math.max(1, r - 1) || 1);
    colsInput.value = String(c);
  });
  grid.addEventListener('mouseleave', () => {
    highlightGrid(0, 0);
    label.textContent = '마우스로 크기 지정 · 클릭해서 삽입';
  });
  grid.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('.tbl-cell');
    if (!t) return;
    const r = Number(t.dataset.r);
    const c = Number(t.dataset.c);
    rowsInput.value = String(Math.max(1, r - 1) || 1);
    colsInput.value = String(c);
    submit();
  });

  setTimeout(() => rowsInput.select(), 0);

  const close = () => backdrop.remove();
  const submit = () => {
    const rows = Number(rowsInput.value) || 3;
    const cols = Number(colsInput.value) || 3;
    const ed = getEditor();
    if (!ed) return close();
    const table = buildMarkdownTable(rows, cols);
    const md = ed.getMarkdown();
    ed.setMarkdown((md ? md.replace(/\s+$/, '') : '') + table);
    close();
  };

  okBtn.addEventListener('click', submit);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    } else if (e.key === 'Enter' && document.activeElement !== grid) {
      submit();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);
}

const CUSTOM_TOOLBAR_BTN_STYLE =
  'display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;background:transparent;border:none;width:32px;height:32px;color:var(--fg);cursor:pointer;padding:0;margin:0;border-radius:3px;line-height:1;box-sizing:border-box;';

function makeToolbarButton(svgInner: string, ariaLabel: string): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'custom-toolbar-btn';
  el.setAttribute('aria-label', ariaLabel);
  el.style.cssText = CUSTOM_TOOLBAR_BTN_STYLE;
  el.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="display:block;">${svgInner}</svg>`;
  el.addEventListener('mousedown', (e) => e.preventDefault());
  return el;
}

function makeTableItem(getEditor: () => Editor | null) {
  const svg = `
    <rect x="2" y="3" width="16" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" />
    <rect x="2" y="3" width="16" height="4.5" fill="currentColor" fill-opacity="0.18" stroke="none" />
    <line x1="2" y1="7.5" x2="18" y2="7.5" stroke="currentColor" stroke-width="1.6" />
    <line x1="2" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="1.6" />
    <line x1="7.5" y1="3" x2="7.5" y2="17" stroke="currentColor" stroke-width="1.6" />
    <line x1="13" y1="3" x2="13" y2="17" stroke="currentColor" stroke-width="1.6" />
  `;
  const el = makeToolbarButton(svg, '테이블 삽입');
  el.addEventListener('click', (e) => {
    e.preventDefault();
    showTableDialog(getEditor);
  });
  return {
    el,
    tooltip: '테이블 (그리드 또는 행/열 입력)',
    name: 'customTable',
  };
}

const ALIGN_ICONS: Record<AlignDir, string> = {
  left: `
    <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="3" y1="9" x2="12" y2="9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="3" y1="13" x2="17" y2="13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="3" y1="17" x2="12" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  `,
  center: `
    <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="5.5" y1="9" x2="14.5" y2="9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="3" y1="13" x2="17" y2="13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="5.5" y1="17" x2="14.5" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  `,
  right: `
    <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="8" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="3" y1="13" x2="17" y2="13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    <line x1="8" y1="17" x2="17" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  `,
};

function makeAlignItem(
  dir: AlignDir,
  _glyph: string,
  tooltip: string,
  getEditor: () => Editor | null,
) {
  const el = makeToolbarButton(ALIGN_ICONS[dir], tooltip);
  el.dataset.align = dir;
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const ed = getEditor();
    if (ed) applyAlignment(ed, dir);
  });
  return {
    el,
    tooltip,
    name: `customAlign-${dir}`,
  };
}

export default function RichEditor({ value, onChange, slug, onImageSlugRequired }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const slugRef = useRef(slug);
  const onChangeRef = useRef(onChange);
  const onImageSlugRequiredRef = useRef(onImageSlugRequired);

  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onImageSlugRequiredRef.current = onImageSlugRequired;
  }, [onImageSlugRequired]);

  // Suppress known ProseMirror TransformErrors (table boundary Enter/Backspace edge
  // cases in @toast-ui/editor 3.2.2). Without this, the console turns red even
  // though the key action is correctly a no-op.
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const err = e.error as Error | undefined;
      const msg = err?.message ?? e.message ?? '';
      const isTransform =
        err?.name === 'TransformError' ||
        /TransformError/.test(String(err)) ||
        /Cannot (join|split) /.test(msg);
      if (isTransform) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        // eslint-disable-next-line no-console
        console.warn('[editor] suppressed transform error (table boundary edge case):', msg);
      }
    };
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, []);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Note on alignment wrappers: we intentionally DON'T register <div> as an
    // htmlBlock in customHTMLRenderer here. If we did, Toast UI's ProseMirror
    // schema would treat the wrapped block as `atom: true` — turning centered
    // content into an uneditable widget. Instead we let the div fall through
    // Toast UI's DOMParser path, which strips the div in WYSIWYG but preserves
    // it in markdown source + published output. Visual centering therefore
    // appears on the rendered post (where CSS matches the class), not in the
    // editor preview. See docs/ALIGNMENT_TRADEOFF.md for the reasoning.

    const editor = new Editor({
      el: containerRef.current,
      initialValue: value,
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      height: '100%',
      usageStatistics: false,
      autofocus: false,
      plugins: [codeSyntaxHighlight, colorSyntax],
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task', 'indent', 'outdent'],
        [
          makeAlignItem('left', '⫷', '왼쪽 정렬', () => editorRef.current),
          makeAlignItem('center', '≡', '가운데 정렬', () => editorRef.current),
          makeAlignItem('right', '⫸', '오른쪽 정렬', () => editorRef.current),
        ],
        [makeTableItem(() => editorRef.current), 'image', 'link'],
        ['codeblock'],
        ['scrollSync'],
      ],
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          const s = slugRef.current;
          if (!s) {
            onImageSlugRequiredRef.current?.();
            alert('먼저 slug를 입력해주세요.');
            return;
          }
          try {
            const file =
              blob instanceof File
                ? blob
                : new File([blob], `upload-${Date.now()}.png`, {
                    type: blob.type || 'image/png',
                  });
            const url = await uploadImage(file, s);
            callback(url, file.name);
          } catch (e: unknown) {
            alert('이미지 업로드 실패: ' + (e instanceof Error ? e.message : String(e)));
          }
        },
      },
    });

    editor.on('change', () => {
      onChangeRef.current(editor.getMarkdown());
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. loading an existing post)
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const current = ed.getMarkdown();
    if (current !== value) ed.setMarkdown(value);
  }, [value]);

  // Click in empty area at the bottom → append paragraph + focus.
  // Works even when the last block is a table/code-block/image.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const appendParagraphAtEnd = (): boolean => {
      const ed = editorRef.current;
      if (!ed) return false;
      try {
        // Prefer ProseMirror direct API — survives block-level trailing nodes
        // (tables, code blocks) that setMarkdown + trailing \n\n may strip.
        const wwEditor = (ed as unknown as {
          getCurrentModeEditor: () => { view?: unknown } | undefined;
        }).getCurrentModeEditor?.();
        const view = (wwEditor as { view?: { state: unknown; dispatch: unknown; focus: () => void } } | undefined)?.view;
        if (view) {
          const v = view as {
            state: {
              tr: {
                insert: (pos: number, node: unknown) => unknown;
              };
              doc: { content: { size: number } };
              schema: { nodes: { paragraph: { create: () => unknown } } };
            };
            dispatch: (tr: unknown) => void;
            focus: () => void;
          };
          const { state } = v;
          const paragraphType = state.schema.nodes.paragraph;
          if (paragraphType) {
            const pNode = paragraphType.create();
            const end = state.doc.content.size;
            v.dispatch(state.tr.insert(end, pNode));
            setTimeout(() => {
              try {
                ed.moveCursorToEnd?.();
              } catch {
                /* noop */
              }
              v.focus();
            }, 0);
            return true;
          }
        }
      } catch {
        /* fall through */
      }

      // Fallback: markdown append
      const md = ed.getMarkdown().replace(/\s+$/, '');
      ed.setMarkdown(md + '\n\n\u200B');
      setTimeout(() => {
        ed.moveCursorToEnd?.();
        ed.focus();
      }, 0);
      return true;
    };

    const handler = (e: MouseEvent) => {
      const ed = editorRef.current;
      if (!ed) return;
      const wysiwygEl = container.querySelector<HTMLElement>(
        '.toastui-editor-ww-container .ProseMirror',
      );
      if (!wysiwygEl || !wysiwygEl.isConnected) return;

      // If click is inside any existing block (text, table cell, etc) — let native behavior handle.
      const lastChild = wysiwygEl.lastElementChild;
      if (lastChild) {
        const rect = lastChild.getBoundingClientRect();
        if (e.clientY <= rect.bottom + 2) return;
      }

      // Must be within the editor's horizontal/vertical area (not on toolbar etc)
      const rootRect = wysiwygEl.getBoundingClientRect();
      if (e.clientX < rootRect.left || e.clientX > rootRect.right) return;
      // Ignore clicks that are WAY below (outside editor entirely)
      const scrollRoot = container.querySelector<HTMLElement>(
        '.toastui-editor-ww-container',
      );
      const scrollRect = scrollRoot?.getBoundingClientRect();
      if (scrollRect && e.clientY > scrollRect.bottom) return;

      e.preventDefault();
      appendParagraphAtEnd();
    };

    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
  }, []);

  // === Floating "표 삭제" button when cursor is inside a table ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', '표 전체 삭제');
    btn.style.cssText =
      'position:fixed;z-index:9999;display:none;align-items:center;gap:4px;background:var(--surface);color:#ef4444;border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path d="M3 5 L13 5 M5 5 L5 13 A1 1 0 0 0 6 14 L10 14 A1 1 0 0 0 11 13 L11 5 M6 5 L6 3 A1 1 0 0 1 7 2 L9 2 A1 1 0 0 1 10 3 L10 5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>표 삭제</span>
    `;
    document.body.appendChild(btn);

    let activeTable: HTMLTableElement | null = null;

    const position = () => {
      if (!activeTable) return;
      const r = activeTable.getBoundingClientRect();
      const w = 84;
      btn.style.top = Math.max(8, r.top - 32) + 'px';
      btn.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, r.right - w)) + 'px';
      btn.style.display = 'flex';
    };

    const hide = () => {
      btn.style.display = 'none';
      activeTable = null;
    };

    const findTable = (el: Element | null): HTMLTableElement | null => {
      if (!el) return null;
      const t = (el as HTMLElement).closest?.('table');
      if (!t) return null;
      if (!t.closest('.toastui-editor-ww-container .ProseMirror')) return null;
      return t as HTMLTableElement;
    };

    const refreshFromSelection = () => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0) return hide();
      const anchor = sel.anchorNode;
      const node =
        anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : (anchor as Element | null);
      const table = findTable(node);
      if (table) {
        activeTable = table;
        position();
      } else {
        hide();
      }
    };

    const deleteActiveTable = () => {
      const ed = editorRef.current;
      if (!ed || !activeTable) return;
      try {
        const ww = (ed as unknown as {
          getCurrentModeEditor: () => { view?: unknown } | undefined;
        }).getCurrentModeEditor?.();
        const view = (ww as { view?: unknown } | undefined)?.view as
          | {
              state: {
                tr: { delete: (from: number, to: number) => unknown };
                selection: { $from: { depth: number; node: (d: number) => { type: { name: string }; nodeSize: number }; before: (d: number) => number } };
              };
              dispatch: (tr: unknown) => void;
              focus: () => void;
            }
          | undefined;
        if (view) {
          const { state } = view;
          const $from = state.selection.$from;
          for (let d = $from.depth; d >= 0; d--) {
            const n = $from.node(d);
            if (n.type.name === 'table') {
              const pos = $from.before(d);
              view.dispatch(state.tr.delete(pos, pos + n.nodeSize));
              hide();
              view.focus();
              return;
            }
          }
        }
      } catch (err) {
        console.warn('table delete via ProseMirror failed, falling back:', err);
      }
      // Fallback: visual remove + markdown re-sync
      const tbl = activeTable;
      if (tbl?.parentElement) tbl.parentElement.removeChild(tbl);
      hide();
      const md = ed.getMarkdown();
      ed.setMarkdown(md);
    };

    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteActiveTable();
    });

    // === Drag-to-resize via ProseMirror transactions (persists across renders) ===
    // We patched Toast UI's cell schemas to include a `cellWidth` attribute.
    // Instead of touching DOM directly, we dispatch transactions that update
    // the attribute — ProseMirror then re-renders with the new width baked in,
    // so typing / selection changes no longer wipe our width.
    type DragCtx = {
      type: 'col' | 'row';
      startPointer: number;
      startColWidth: number;
      startRowHeight: number;
      colIdx: number;
      // Positions of every cell in this column (one per row)
      cellPositions: number[];
      // Position of the tableRow node being resized (for row case)
      rowPos: number | null;
    };
    let drag: DragCtx | null = null;
    const BORDER_THRESHOLD = 6;

    const cellInEditor = (el: EventTarget | null): HTMLTableCellElement | null => {
      if (!(el instanceof HTMLElement)) return null;
      const cell = el.closest<HTMLTableCellElement>('td, th');
      if (!cell) return null;
      if (!cell.closest('.toastui-editor-ww-container .ProseMirror')) return null;
      return cell;
    };

    const nearBorder = (
      clientX: number,
      clientY: number,
      cell: HTMLTableCellElement,
    ): { type: 'col' | 'row' } | null => {
      const r = cell.getBoundingClientRect();
      const distRight = Math.abs(clientX - r.right);
      const distBottom = Math.abs(clientY - r.bottom);
      const inY = clientY >= r.top - 2 && clientY <= r.bottom + 2;
      const inX = clientX >= r.left - 2 && clientX <= r.right + 2;
      if (distRight <= BORDER_THRESHOLD && inY) return { type: 'col' };
      if (distBottom <= BORDER_THRESHOLD && inX) return { type: 'row' };
      return null;
    };

    const cursorClass = (type: 'col' | 'row' | null) => {
      const pm = container.querySelector<HTMLElement>('.toastui-editor-ww-container .ProseMirror');
      if (!pm) return;
      pm.classList.remove('tbl-col-resize', 'tbl-row-resize');
      if (type === 'col') pm.classList.add('tbl-col-resize');
      else if (type === 'row') pm.classList.add('tbl-row-resize');
    };

    type PMView = {
      state: {
        doc: {
          nodeAt: (pos: number) => { attrs: Record<string, unknown>; type: { name: string } } | null;
          resolve: (pos: number) => {
            depth: number;
            before: (depth?: number) => number;
            node: (depth?: number) => { type: { name: string } };
          };
        };
        tr: {
          setNodeMarkup: (
            pos: number,
            type: unknown,
            attrs: Record<string, unknown>,
          ) => unknown;
        };
      };
      dispatch: (tr: unknown) => void;
      posAtDOM: (domNode: Node, offset: number) => number;
    };

    const getWwView = (): PMView | null => {
      const ed = editorRef.current;
      if (!ed) return null;
      const ww = (ed as unknown as {
        getCurrentModeEditor?: () => { view?: unknown } | undefined;
      }).getCurrentModeEditor?.();
      const view = (ww as { view?: unknown } | undefined)?.view as PMView | undefined;
      return view ?? null;
    };

    const getCellPos = (cell: HTMLTableCellElement): number | null => {
      const view = getWwView();
      if (!view) return null;
      try {
        // posAtDOM with offset 0 → position inside the cell. The cell itself
        // is one position before. Actually posAtDOM returns the position just
        // inside at offset 0, which for a node element wraps to the position
        // AFTER the cell's opening token. Use -1 to get the enclosing node start.
        const pos = view.posAtDOM(cell, 0);
        return pos - 1; // step back to the node's own position
      } catch {
        return null;
      }
    };

    const setCellWidthAttr = (cellPos: number, widthPx: number | null) => {
      const view = getWwView();
      if (!view) return;
      const node = view.state.doc.nodeAt(cellPos);
      if (!node) return;
      if (!/tableHeadCell|tableBodyCell/.test(node.type.name)) return;
      const newAttrs = { ...node.attrs, cellWidth: widthPx };
      const tr = view.state.tr.setNodeMarkup(cellPos, null, newAttrs);
      view.dispatch(tr);
    };

    const onHoverMove = (e: MouseEvent) => {
      if (drag) return;
      const cell = cellInEditor(e.target);
      if (!cell) return cursorClass(null);
      cursorClass(nearBorder(e.clientX, e.clientY, cell)?.type ?? null);
    };

    const onDragMove = (e: PointerEvent) => {
      if (!drag) return;
      e.preventDefault();
      const view = getWwView();
      if (!view) return;
      if (drag.type === 'col') {
        const delta = e.clientX - drag.startPointer;
        const newColW = Math.max(40, drag.startColWidth + delta);
        let tr: ReturnType<typeof view.state.tr.setNodeMarkup> = view.state.tr;
        for (const pos of drag.cellPositions) {
          const node = view.state.doc.nodeAt(pos);
          if (!node) continue;
          if (!/tableHeadCell|tableBodyCell/.test(node.type.name)) continue;
          tr = (tr as unknown as {
            setNodeMarkup: (
              p: number,
              t: unknown,
              a: Record<string, unknown>,
            ) => unknown;
          }).setNodeMarkup(pos, null, { ...node.attrs, cellWidth: newColW });
        }
        view.dispatch(tr);
      } else if (drag.type === 'row' && drag.rowPos !== null) {
        const delta = e.clientY - drag.startPointer;
        const newRowH = Math.max(24, drag.startRowHeight + delta);
        const node = view.state.doc.nodeAt(drag.rowPos);
        if (!node || node.type.name !== 'tableRow') return;
        const tr = view.state.tr.setNodeMarkup(drag.rowPos, null, {
          ...node.attrs,
          rowHeight: newRowH,
        });
        view.dispatch(tr);
      }
    };

    const startDrag = (e: PointerEvent) => {
      const cell = cellInEditor(e.target);
      if (!cell) return;
      const near = nearBorder(e.clientX, e.clientY, cell);
      if (!near) return;
      const table = cell.closest('table') as HTMLTableElement | null;
      if (!table) return;
      e.preventDefault();
      e.stopPropagation();
      (e as Event).stopImmediatePropagation?.();

      const cellRect = cell.getBoundingClientRect();
      const row = cell.parentElement as HTMLTableRowElement;
      const colIdx = Array.prototype.indexOf.call(row.cells, cell);

      // Collect positions of every cell in this column via posAtDOM
      const cellPositions: number[] = [];
      if (near.type === 'col') {
        const allRows = table.querySelectorAll<HTMLTableRowElement>('tr');
        allRows.forEach((r) => {
          const c = r.cells[colIdx];
          if (c) {
            const p = getCellPos(c);
            if (p != null) cellPositions.push(p);
          }
        });
      }

      // For row resize: get the parent tableRow node position
      let rowPos: number | null = null;
      if (near.type === 'row') {
        const cellPos = getCellPos(cell);
        if (cellPos != null) {
          const view = getWwView();
          if (view) {
            // tableRow is the cell's parent — its position is cellPos - 1
            // Actually in ProseMirror, parent pos = cell pos - 1 (enters parent
            // before entering cell). Use doc.resolve to walk up.
            try {
              const resolved = (view.state.doc as unknown as {
                resolve: (pos: number) => { before: (depth?: number) => number; depth: number };
              }).resolve(cellPos);
              // cell depth is resolved.depth (at cellPos we're AT the cell node)
              // parent (tableRow) is depth - 1
              rowPos = resolved.before(resolved.depth);
            } catch {
              rowPos = null;
            }
          }
        }
      }
      drag = {
        type: near.type,
        startPointer: near.type === 'col' ? e.clientX : e.clientY,
        startColWidth: cellRect.width,
        startRowHeight: (cell.parentElement as HTMLTableRowElement | null)?.getBoundingClientRect().height ?? cellRect.height,
        colIdx,
        cellPositions,
        rowPos,
      };
      document.body.style.userSelect = 'none';
      cursorClass(near.type);
      document.addEventListener('pointermove', onDragMove, true);
      document.addEventListener('pointerup', endDrag, true);
      document.addEventListener('pointercancel', endDrag, true);
    };

    const endDrag = () => {
      if (!drag) return;
      drag = null;
      document.body.style.userSelect = '';
      cursorClass(null);
      document.removeEventListener('pointermove', onDragMove, true);
      document.removeEventListener('pointerup', endDrag, true);
      document.removeEventListener('pointercancel', endDrag, true);
    };

    document.addEventListener('mousemove', onHoverMove);
    document.addEventListener('pointerdown', startDrag, true);
    // Keep the unused setCellWidthAttr accessible to silence TS
    void setCellWidthAttr;

    // Intercept Enter inside a table cell — Toast UI's default splitBlock
    // duplicates the entire table / throws TransformError. Replace with a
    // hardBreak insertion that keeps the cursor inside the cell.
    //
    // Important: in a contenteditable, the keydown's `e.target` is the
    // ProseMirror ROOT, not the specific <td>. We must use the current
    // browser selection to find the enclosing cell.
    const cursorIsInTableCell = (): boolean => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      let node: Node | null = sel.anchorNode;
      while (node && node !== container) {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'TD' || node.tagName === 'TH') {
            if (node.closest('.toastui-editor-ww-container .ProseMirror')) return true;
          }
        }
        node = node.parentNode;
      }
      return false;
    };

    const onKeyDownInTable = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      // Block ALL Enter variants in cells (plain / Shift / Ctrl / Meta / Alt)
      // because Toast UI's default splitBlock duplicates the table on any of them.
      if (!cursorIsInTableCell()) return;
      e.preventDefault();
      e.stopPropagation();
      (e as Event).stopImmediatePropagation?.();

      const view = getWwView() as unknown as
        | {
            state: {
              selection: { from: number; $from: { depth: number; node: (d: number) => { type: { name: string } } } };
              tr: {
                split: (pos: number, depth?: number) => unknown;
                insertText: (text: string) => unknown;
              };
            };
            dispatch: (tr: unknown) => void;
            focus?: () => void;
          }
        | null;
      if (!view) return;
      try {
        const { state } = view;
        const $from = state.selection.$from;
        // Verify we're inside a paragraph (ProseMirror schema-level check)
        let inParagraph = false;
        for (let d = $from.depth; d >= 0; d--) {
          if ($from.node(d).type.name === 'paragraph') {
            inParagraph = true;
            break;
          }
        }
        if (inParagraph) {
          // Split the paragraph at current position. Because table cells are
          // `isolating: true` in the schema, the split stays within the cell
          // — creating a new paragraph block below the current one.
          const tr = state.tr.split(state.selection.from, 1);
          view.dispatch(tr);
        } else {
          // Fallback for unusual structures (e.g. a list inside a body cell):
          // drop a literal newline.
          const tr = state.tr.insertText('\n');
          view.dispatch(tr);
        }
        view.focus?.();
      } catch {
        /* noop — at worst the Enter is blocked, which is preferable to
           Toast UI's default behavior that duplicates the table. */
      }
    };

    // beforeinput also needs to be intercepted — modern browsers use it for
    // Enter handling in contenteditable; ProseMirror inspects it too.
    const onBeforeInputInTable = (e: InputEvent) => {
      if (e.inputType !== 'insertParagraph' && e.inputType !== 'insertLineBreak') return;
      if (!cursorIsInTableCell()) return;
      e.preventDefault();
      e.stopPropagation();
      (e as Event).stopImmediatePropagation?.();
    };

    document.addEventListener('keydown', onKeyDownInTable, true);
    document.addEventListener('beforeinput', onBeforeInputInTable, true);

    const onDocClick = (e: MouseEvent) => {
      if (btn.contains(e.target as Node)) return;
      setTimeout(refreshFromSelection, 0);
    };
    document.addEventListener('selectionchange', refreshFromSelection);
    document.addEventListener('click', onDocClick, true);
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);

    return () => {
      document.removeEventListener('selectionchange', refreshFromSelection);
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('mousemove', onHoverMove);
      document.removeEventListener('pointerdown', startDrag, true);
      document.removeEventListener('pointermove', onDragMove, true);
      document.removeEventListener('pointerup', endDrag, true);
      document.removeEventListener('pointercancel', endDrag, true);
      document.removeEventListener('keydown', onKeyDownInTable, true);
      document.removeEventListener('beforeinput', onBeforeInputInTable, true);
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
      btn.remove();
    };
  }, []);

  // === Image resize with drag handles at 4 corners ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Overlay frame (dashed border) rendered outside the editor DOM
    const overlay = document.createElement('div');
    overlay.className = 'img-resize-overlay';
    overlay.style.cssText =
      'position:fixed;display:none;pointer-events:none;z-index:9999;border:1.5px dashed var(--accent);box-sizing:border-box;';

    type HandlePos = 'nw' | 'ne' | 'sw' | 'se';
    const handles: Record<HandlePos, HTMLElement> = {} as Record<HandlePos, HTMLElement>;

    (['nw', 'ne', 'sw', 'se'] as HandlePos[]).forEach((pos) => {
      const h = document.createElement('div');
      h.className = `img-handle img-handle-${pos}`;
      const cursor = pos === 'nw' || pos === 'se' ? 'nwse-resize' : 'nesw-resize';
      h.style.cssText = `position:absolute;width:12px;height:12px;background:var(--accent);border:2px solid var(--surface);border-radius:50%;pointer-events:auto;cursor:${cursor};box-shadow:0 1px 3px rgba(0,0,0,0.25);`;
      if (pos.includes('n')) h.style.top = '-7px';
      if (pos.includes('s')) h.style.bottom = '-7px';
      if (pos.includes('w')) h.style.left = '-7px';
      if (pos.includes('e')) h.style.right = '-7px';
      overlay.appendChild(h);
      handles[pos] = h;
    });

    const sizeLabel = document.createElement('div');
    sizeLabel.style.cssText =
      'position:absolute;left:50%;top:-22px;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:10px;padding:1px 6px;border-radius:3px;white-space:nowrap;font-weight:600;pointer-events:none;display:none;';
    overlay.appendChild(sizeLabel);

    document.body.appendChild(overlay);

    let activeImg: HTMLImageElement | null = null;
    let startRect: DOMRect | null = null;
    let startWidth = 0;
    let aspect = 1;
    let dragHandle: HandlePos | null = null;

    const positionOverlay = () => {
      if (!activeImg) return;
      const r = activeImg.getBoundingClientRect();
      overlay.style.display = 'block';
      overlay.style.left = r.left + 'px';
      overlay.style.top = r.top + 'px';
      overlay.style.width = r.width + 'px';
      overlay.style.height = r.height + 'px';
    };

    const hideOverlay = () => {
      overlay.style.display = 'none';
      sizeLabel.style.display = 'none';
      activeImg = null;
    };

    const showOverlay = (img: HTMLImageElement) => {
      activeImg = img;
      positionOverlay();
    };

    const escapeR = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const commitSize = (src: string, width: number | null) => {
      const ed = editorRef.current;
      if (!ed || !src) return;
      const md = ed.getMarkdown();
      const esc = escapeR(src);
      const mdRe = new RegExp(`!\\[([^\\]]*)\\]\\(${esc}(?:\\s+"[^"]*")?\\)`);
      const htmlRe = new RegExp(`<img\\b([^>]*?)src=["']${esc}["']([^>]*?)\\/?>`);

      let newMd: string = md;
      const mdMatch = md.match(mdRe);
      if (mdMatch) {
        const alt = mdMatch[1] ?? '';
        newMd = md.replace(
          mdRe,
          width == null
            ? `![${alt}](${src})`
            : `<img src="${src}" alt="${alt}" width="${Math.round(width)}" />`,
        );
      } else if (htmlRe.test(md)) {
        newMd = md.replace(htmlRe, (_f, before: string, after: string) => {
          const altMatch = (before + after).match(/alt=["']([^"']*)["']/);
          const alt = altMatch?.[1] ?? '';
          return width == null
            ? `![${alt}](${src})`
            : `<img src="${src}" alt="${alt}" width="${Math.round(width)}" />`;
        });
      }

      if (newMd !== md) ed.setMarkdown(newMd);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activeImg || !startRect || !dragHandle) return;
      let deltaX = 0;
      if (dragHandle.includes('e')) deltaX = e.clientX - startRect.right;
      else deltaX = startRect.left - e.clientX;
      const newWidth = Math.max(60, Math.min(2000, startWidth + deltaX));
      activeImg.style.width = newWidth + 'px';
      activeImg.style.height = 'auto';
      aspect = startRect.width / startRect.height;
      void aspect;
      positionOverlay();
      sizeLabel.textContent = `${Math.round(newWidth)} px`;
      sizeLabel.style.display = 'block';
    };

    const onPointerUp = () => {
      if (!activeImg || !dragHandle) return;
      const finalWidth = activeImg.offsetWidth;
      const src = activeImg.getAttribute('src') || '';
      dragHandle = null;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      sizeLabel.style.display = 'none';
      // setMarkdown will re-render, losing the live DOM ref. Do it last.
      commitSize(src, finalWidth);
    };

    (Object.keys(handles) as HandlePos[]).forEach((pos) => {
      const h = handles[pos];
      h.addEventListener('pointerdown', (e: PointerEvent) => {
        if (!activeImg) return;
        e.preventDefault();
        e.stopPropagation();
        startRect = activeImg.getBoundingClientRect();
        startWidth = startRect.width;
        aspect = startRect.width / startRect.height;
        dragHandle = pos;
        h.setPointerCapture?.(e.pointerId);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
      });
    });

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t) return;
      if (t.tagName === 'IMG') {
        const inEditor = t.closest('.toastui-editor-ww-container .ProseMirror');
        if (inEditor) {
          e.stopPropagation();
          showOverlay(t as HTMLImageElement);
          return;
        }
      }
      if (!overlay.contains(t)) hideOverlay();
    };

    const reposition = () => {
      if (activeImg && overlay.style.display !== 'none') positionOverlay();
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      overlay.remove();
    };
  }, []);

  // === Language autocomplete for native code block language input ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'codeblock-lang-autocomplete';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);

    let active: HTMLInputElement | null = null;
    let cursor = 0;
    let results: Language[] = [];

    const hide = () => {
      dropdown.style.display = 'none';
      active = null;
    };

    const position = () => {
      if (!active) return;
      const r = active.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(Math.max(240, r.width), vw - 16);
      const estHeight = Math.min(280, results.length * 32 + 16);
      let left = r.left;
      let top = r.bottom + 4;
      if (left + width > vw - 8) left = vw - width - 8;
      if (left < 8) left = 8;
      if (top + estHeight > vh - 8 && r.top > estHeight + 8) {
        top = r.top - estHeight - 4;
      }
      dropdown.style.left = left + 'px';
      dropdown.style.top = top + 'px';
      dropdown.style.width = width + 'px';
      dropdown.style.maxWidth = vw - 16 + 'px';
    };

    const repaint = () => {
      dropdown.innerHTML = results.length === 0
        ? `<div class="empty">일치하는 언어 없음 — Enter로 그대로 사용</div>`
        : results
            .map(
              (l, i) => `
                <div class="item${i === cursor ? ' active' : ''}" data-lang="${l.id}">
                  <strong>${l.label}</strong>
                  <span class="id">${l.id}</span>
                  ${
                    l.aliases && l.aliases.length
                      ? `<span class="aliases">${l.aliases.slice(0, 3).join(', ')}</span>`
                      : ''
                  }
                </div>`,
            )
            .join('');
    };

    const render = (query: string) => {
      results = searchLanguages(query, 15);
      cursor = 0;
      repaint();
      position();
      dropdown.style.display = 'block';
    };

    const commit = (lang: string) => {
      if (!active) return;
      const el = active;
      // Set value via native setter (survives framework value trackers)
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc?.set) desc.set.call(el, lang);
      else el.value = lang;

      // Notify DOM listeners of value change
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      // Toast UI applies the language on Enter — simulate it so click
      // selection has the same effect as pressing Enter manually.
      hide();
      const enterDown = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(enterDown);
      const enterPress = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(enterPress);
      const enterUp = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(enterUp);

      // Final fallback: if Toast UI still hasn't applied, blur fires its
      // commit path in some versions.
      el.blur();
    };

    const isLangInput = (t: EventTarget | null): t is HTMLInputElement => {
      if (!(t instanceof HTMLInputElement)) return false;
      return !!t.closest(
        '.toastui-editor-ww-code-block, .toastui-editor-ww-code-block-language, [class*="code-block"]',
      );
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!isLangInput(e.target)) return;
      active = e.target as HTMLInputElement;
      render(active.value || '');
    };
    const onInput = (e: Event) => {
      if (!isLangInput(e.target)) return;
      active = e.target as HTMLInputElement;
      render(active.value);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isLangInput(e.target) || dropdown.style.display === 'none') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cursor = Math.min(Math.max(0, results.length - 1), cursor + 1);
        repaint();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cursor = Math.max(0, cursor - 1);
        repaint();
      } else if (e.key === 'Enter') {
        if (results[cursor]) {
          e.preventDefault();
          commit(results[cursor].id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hide();
      }
    };
    const onFocusOut = () => {
      setTimeout(() => {
        if (!active) return;
        if (document.activeElement !== active) hide();
      }, 150);
    };

    container.addEventListener('focusin', onFocusIn);
    container.addEventListener('input', onInput);
    container.addEventListener('keydown', onKeyDown);
    container.addEventListener('focusout', onFocusOut);

    dropdown.addEventListener('mousedown', (e) => e.preventDefault());
    dropdown.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('.item');
      if (target) commit(target.getAttribute('data-lang') ?? '');
    });

    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);

    return () => {
      container.removeEventListener('focusin', onFocusIn);
      container.removeEventListener('input', onInput);
      container.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      dropdown.remove();
    };
  }, []);

  return <div ref={containerRef} className="h-full" />;
}
