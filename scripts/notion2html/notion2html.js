#!/usr/bin/env node
/**
 * Notion public page → HTML converter.
 * Uses notion.site internal loadPageChunk API (no auth needed for public pages).
 *
 * Usage:
 *   node notion2html.js <url|pageId> <outDir> <slug> [host]
 *   node notion2html.js 6bf95ecb0201461983cc23c058acd3f6 ../../portfolio/html/document/posts fourier
 *   node notion2html.js https://www.notion.so/Title-26e71ceb5558818d9b35fbc87e39de0d ../../portfolio/html/document/posts api-gateway
 *
 * The host is taken from the URL when a full URL is given, else from the optional
 * [host] arg, else defaults to DEFAULT_HOST.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEFAULT_HOST = 'jealous-watch-86a.notion.site';

function dashId(id) {
  const s = id.replace(/-/g, '');
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

// Accept either a bare 32-char page id or a full Notion URL.
// Returns { host, pageId } (host null when not derivable from input).
function parseInput(input) {
  const idRe = /([0-9a-f]{32})/i;
  if (/^https?:\/\//i.test(input)) {
    const u = new URL(input);
    const m = u.pathname.match(idRe) || (u.searchParams.get('p') || '').match(idRe);
    if (!m) throw new Error(`No 32-char page id found in URL: ${input}`);
    return { host: u.host, pageId: m[1] };
  }
  const m = input.match(idRe);
  if (!m) throw new Error(`Not a valid page id or URL: ${input}`);
  return { host: null, pageId: m[1] };
}

function postJSON(host, pathName, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      host, path: pathName, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function loadPageChunk(host, pageId, cursor = { stack: [] }) {
  return postJSON(host, '/api/v3/loadPageChunk', {
    pageId: dashId(pageId),
    limit: 200,
    chunkNumber: 0,
    cursor,
    verticalColumns: false,
  });
}

// Notion returns content in chunks; an empty first chunk may still hand back a
// cursor pointing at the real records. Follow the cursor until it's empty and
// merge every recordMap so large pages aren't truncated.
async function loadAllBlocks(host, pageId) {
  const blocks = {};
  let cursor = { stack: [] };
  for (let i = 0; i < 50; i++) {
    const data = await loadPageChunk(host, pageId, cursor);
    Object.assign(blocks, data?.recordMap?.block || {});
    const stack = data?.cursor?.stack || [];
    if (!stack.length) break;
    cursor = data.cursor;
  }
  return blocks;
}

async function getSignedUrls(host, items) {
  if (!items.length) return {};
  const res = await postJSON(host, '/api/v3/getSignedFileUrls', {
    urls: items.map(it => ({
      permissionRecord: { table: 'block', id: dashId(it.blockId) },
      url: it.url,
    })),
  });
  const map = {};
  (res.signedUrls || []).forEach((u, i) => { map[items[i].blockId] = u; });
  return map;
}

function downloadFile(url, outPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outPath);
    const get = (u, redirects = 0) => {
      https.get(u, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects > 5) return reject(new Error('too many redirects'));
          return get(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${u.slice(0, 80)}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      }).on('error', reject);
    };
    get(url);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Notion rich text array → HTML
function richToHtml(rich) {
  if (!Array.isArray(rich)) return '';
  let html = '';
  for (const seg of rich) {
    if (!Array.isArray(seg) || !seg.length) continue;
    let text = seg[0];
    const annotations = seg[1] || [];
    let inline = '';
    let openTags = [];
    let href = null;
    let isEquation = false;
    for (const a of annotations) {
      const tag = a[0];
      switch (tag) {
        case 'b': openTags.push('strong'); break;
        case 'i': openTags.push('em'); break;
        case 'u': openTags.push('u'); break;
        case 's': openTags.push('del'); break;
        case 'c': openTags.push('code'); break;
        case 'a': href = a[1]; break;
        case 'e': isEquation = true; text = a[1] || text; break;
        case 'h': /* color/highlight */ break;
      }
    }
    if (isEquation) {
      inline = `<span class="docs-eq">\\(${escapeHtml(text)}\\)</span>`;
    } else {
      inline = escapeHtml(text).replace(/\n/g, '<br>');
      for (const t of openTags) inline = `<${t}>${inline}</${t}>`;
      if (href) {
        const safeHref = href.startsWith('http') || href.startsWith('/')
          ? escapeHtml(href) : '#';
        inline = `<a href="${safeHref}" target="_blank" rel="noopener">${inline}</a>`;
      }
    }
    html += inline;
  }
  return html;
}

function getChildren(block, blocks) {
  const ids = block.content || [];
  return ids.map(id => blocks[id]?.value?.value).filter(Boolean);
}

// Convert blocks to HTML, grouping consecutive list items.
function blocksToHtml(blockList, blocks, ctx) {
  let out = '';
  let i = 0;
  while (i < blockList.length) {
    const b = blockList[i];
    if (!b) { i++; continue; }

    // Group consecutive list items of same kind
    if (b.type === 'bulleted_list' || b.type === 'numbered_list') {
      const tag = b.type === 'bulleted_list' ? 'ul' : 'ol';
      let items = '';
      while (i < blockList.length && blockList[i] && blockList[i].type === b.type) {
        const nested = getChildren(blockList[i], blocks);
        const inner = richToHtml(blockList[i].properties?.title);
        const nestedHtml = nested.length ? blocksToHtml(nested, blocks, ctx) : '';
        items += `<li>${inner}${nestedHtml}</li>`;
        i++;
      }
      out += `<${tag} class="docs-list">${items}</${tag}>`;
      continue;
    }

    out += blockToHtml(b, blocks, ctx);
    i++;
  }
  return out;
}

function blockToHtml(b, blocks, ctx) {
  const t = b.type;
  const text = richToHtml(b.properties?.title);
  switch (t) {
    case 'page':
      return ''; // handled separately
    case 'header':
      return `<h2 class="docs-h2">${text}</h2>`;
    case 'sub_header':
      return `<h3 class="docs-h3">${text}</h3>`;
    case 'sub_sub_header':
      return `<h4 class="docs-h4">${text}</h4>`;
    case 'text':
      return text ? `<p class="docs-p">${text}</p>` : '<div class="docs-spacer"></div>';
    case 'quote':
      return `<blockquote class="docs-quote">${text}</blockquote>`;
    case 'callout': {
      const icon = b.format?.page_icon || '💡';
      return `<aside class="docs-callout"><span class="docs-callout__icon">${escapeHtml(icon)}</span><div class="docs-callout__body">${text}</div></aside>`;
    }
    case 'code': {
      const lang = b.properties?.language?.[0]?.[0] || '';
      const raw = (b.properties?.title || []).map(s => s[0]).join('');
      return `<pre class="docs-code"><code data-lang="${escapeHtml(lang)}">${escapeHtml(raw)}</code></pre>`;
    }
    case 'divider':
      return '<hr class="docs-divider">';
    case 'image': {
      const localPath = ctx.imageMap[b.id];
      if (!localPath) return '';
      const caption = richToHtml(b.properties?.caption);
      return `<figure class="docs-figure"><img src="${escapeHtml(localPath)}" alt="${caption ? caption.replace(/<[^>]+>/g, '') : ''}" loading="lazy">${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
    }
    case 'equation': {
      const eq = (b.properties?.title || []).map(s => s[0]).join('');
      return `<div class="docs-equation">\\[${escapeHtml(eq)}\\]</div>`;
    }
    case 'to_do': {
      const checked = b.properties?.checked?.[0]?.[0] === 'Yes';
      return `<div class="docs-todo"><input type="checkbox" ${checked?'checked':''} disabled> <span>${text}</span></div>`;
    }
    case 'toggle': {
      const children = getChildren(b, blocks);
      const inner = blocksToHtml(children, blocks, ctx);
      return `<details class="docs-toggle"><summary>${text}</summary>${inner}</details>`;
    }
    case 'bookmark': {
      const link = b.format?.bookmark_url || '#';
      const title = b.properties?.title?.[0]?.[0] || link;
      return `<a class="docs-bookmark" href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(title)}</a>`;
    }
    case 'embed':
    case 'video': {
      const link = b.format?.display_source || b.properties?.source?.[0]?.[0] || '';
      return link ? `<div class="docs-embed"><a href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(link)}</a></div>` : '';
    }
    case 'table': {
      const rows = getChildren(b, blocks).filter(r => r && r.type === 'table_row');
      if (!rows.length) return '';
      const order = b.format?.table_block_column_order
        || Object.keys(rows[0].properties || {});
      const hasColHeader = b.format?.table_block_column_header;
      const hasRowHeader = b.format?.table_block_row_header;
      const cell = (r, ci, colId) => {
        const html = richToHtml(r.properties?.[colId]);
        const isHead = (hasColHeader && r === rows[0]) || (hasRowHeader && ci === 0);
        const tag = isHead ? 'th' : 'td';
        return `<${tag}>${html}</${tag}>`;
      };
      let body = '';
      rows.forEach((r, ri) => {
        const cells = order.map((colId, ci) => cell(r, ci, colId)).join('');
        body += `<tr>${cells}</tr>`;
      });
      const thead = hasColHeader
        ? `<thead>${body.slice(0, body.indexOf('</tr>') + 5)}</thead>`
        : '';
      const tbody = hasColHeader
        ? `<tbody>${body.slice(body.indexOf('</tr>') + 5)}</tbody>`
        : `<tbody>${body}</tbody>`;
      return `<div class="docs-table-wrap"><table class="docs-table">${thead}${tbody}</table></div>`;
    }
    case 'column_list':
    case 'column': {
      const children = getChildren(b, blocks);
      const cls = t === 'column_list' ? 'docs-columns' : 'docs-column';
      return `<div class="${cls}">${blocksToHtml(children, blocks, ctx)}</div>`;
    }
    default:
      return text ? `<p class="docs-p">${text}</p>` : '';
  }
}

async function buildHtml(opts) {
  const { pageId, outDir, slug, host = DEFAULT_HOST } = opts;
  const blocks = await loadAllBlocks(host, pageId);
  const pageBlock = blocks[dashId(pageId)]?.value?.value;
  if (!pageBlock) {
    throw new Error(
      `Page not accessible (id ${pageId}). The page returned no readable blocks — ` +
      `enable "Share → Publish to web" on this Notion page and retry.`
    );
  }

  const title = (pageBlock.properties?.title || []).map(s => s[0]).join('') || slug;
  const childIds = pageBlock.content || [];
  const childBlocks = childIds.map(id => blocks[id]?.value?.value).filter(Boolean);

  // Collect images
  const imageBlocks = Object.values(blocks)
    .map(v => v.value?.value)
    .filter(b => b && b.type === 'image');

  const assetsDir = path.join(outDir, 'assets', slug);
  fs.mkdirSync(assetsDir, { recursive: true });

  // Resolve signed URLs
  const items = imageBlocks.map(b => ({
    blockId: b.id,
    url: b.properties?.source?.[0]?.[0] || b.format?.display_source || '',
  })).filter(it => it.url);

  console.log(`[${slug}] page="${title}", blocks=${childBlocks.length}, images=${items.length}`);

  const signed = await getSignedUrls(host, items);
  const imageMap = {};
  for (const it of items) {
    const url = signed[it.blockId] || it.url;
    if (!url) continue;
    const ext = (url.split('?')[0].match(/\.(png|jpe?g|gif|webp|svg)$/i)?.[1] || 'png').toLowerCase();
    const fname = `${it.blockId.replace(/-/g, '').slice(0, 12)}.${ext}`;
    const dest = path.join(assetsDir, fname);
    if (!fs.existsSync(dest)) {
      try {
        await downloadFile(url, dest);
        process.stdout.write('.');
      } catch (e) {
        console.warn(`\n  ! image fail ${it.blockId}: ${e.message}`);
        continue;
      }
    }
    imageMap[it.blockId] = `assets/${slug}/${fname}`;
  }
  if (items.length) console.log('');

  const ctx = { imageMap };
  const bodyHtml = blocksToHtml(childBlocks, blocks, ctx);

  const html = renderPage({ title, bodyHtml, slug });
  const outPath = path.join(outDir, `${slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`[${slug}] → ${path.relative(process.cwd(), outPath)}`);
  return { title, slug, outPath };
}

function renderPage({ title, bodyHtml, slug }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — TAYLEE Archive</title>

<link rel="stylesheet" type="text/css" href="../../../css/style.css">
<link rel="stylesheet" type="text/css" href="../posts.css">

<script src="../../../js/main.js" defer></script>
<script src="../../../js/components/nav.js" sync></script>
<script src="../../../js/components/footer.js" sync></script>
<script src="../../../js/components/header.js" sync></script>

<!-- KaTeX for math -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body,{delimiters:[{left:'\\\\[',right:'\\\\]',display:true},{left:'\\\\(',right:'\\\\)',display:false}]});"></script>

<common-header-component></common-header-component>
</head>
<body>
<nav-component></nav-component>

<main class="docs-post">
  <article class="docs-post__article">
    <header class="docs-post__header">
      <p class="docs-post__eyebrow"><a href="../../TAYLEE documents.html">← Documents</a></p>
      <h1 class="docs-post__title">${escapeHtml(title)}</h1>
    </header>
    <div class="docs-post__body">
${bodyHtml}
    </div>
  </article>
</main>

<footer-component></footer-component>
</body>
</html>
`;
}

if (require.main === module) {
  const [,, input, outDir, slug, hostArg] = process.argv;
  if (!input || !outDir || !slug) {
    console.error('usage: node notion2html.js <url|pageId> <outDir> <slug> [host]');
    process.exit(1);
  }
  const { host: urlHost, pageId } = parseInput(input);
  const host = urlHost || hostArg || DEFAULT_HOST;
  buildHtml({ pageId, outDir: path.resolve(outDir), slug, host })
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { buildHtml };
