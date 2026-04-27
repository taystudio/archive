import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  tags: string[];
  category: string[];
  thumbnail?: string;
};

export type Post = PostMeta & { content: string };

const POSTS_DIR = path.join(process.cwd(), 'posts');

function coerceDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string') return v;
  return new Date().toISOString().slice(0, 10);
}

function toCategory(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split('/').map((s) => s.trim()).filter(Boolean);
  return [];
}

function autoExcerpt(body: string, n = 180): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#>*_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > n ? plain.slice(0, n).trimEnd() + '…' : plain;
}

const MDX_VOID_TAGS = [
  'br',
  'hr',
  'img',
  'input',
  'meta',
  'col',
  'area',
  'base',
  'embed',
  'link',
  'param',
  'source',
  'track',
  'wbr',
];

function normalizeMdxVoidTags(md: string): string {
  // MDX parses JSX, which requires void HTML elements to be explicitly
  // self-closed. Editor output (Toast UI) writes them as plain HTML (<br>,
  // <img ...>) which MDX rejects. Rewrite them to self-closing form.
  let out = md;
  for (const tag of MDX_VOID_TAGS) {
    const re = new RegExp(`<${tag}(\\s[^>]*)?(\\/)?>`, 'gi');
    out = out.replace(re, (match, attrs, slash) => {
      if (slash === '/') return match;
      return `<${tag}${attrs ?? ''} />`;
    });
  }
  return out;
}

function readPostFile(slug: string): Post {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    excerpt: data.excerpt || autoExcerpt(content),
    date: coerceDate(data.date),
    tags: data.tags ?? [],
    category: toCategory(data.category),
    thumbnail: data.thumbnail,
    content: normalizeMdxVoidTags(content),
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getAllPosts(): PostMeta[] {
  return getAllSlugs()
    .map((slug) => {
      const { content: _c, ...meta } = readPostFile(slug);
      return meta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post {
  return readPostFile(slug);
}

export function getPostsByCategory(path: string[]): PostMeta[] {
  const all = getAllPosts();
  return all.filter((p) => {
    if (p.category.length < path.length) return false;
    return path.every((seg, i) => p.category[i] === seg);
  });
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function countByCategory(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of getAllPosts()) {
    for (let i = 1; i <= p.category.length; i++) {
      const key = p.category.slice(0, i).join('/');
      out[key] = (out[key] ?? 0) + 1;
    }
  }
  return out;
}

export function countByTag(): Array<[string, number]> {
  const m = new Map<string, number>();
  for (const p of getAllPosts()) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
