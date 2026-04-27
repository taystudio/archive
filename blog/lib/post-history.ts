import { getFile, putFile } from './github';

export type PostSnapshot = {
  id: string;
  timestamp: string;
  fm: Record<string, unknown>;
  body: string;
};

export type PostHistoryFile = {
  slug: string;
  snapshots: PostSnapshot[];
};

const MAX_SNAPSHOTS = 30;

function historyPath(slug: string): string {
  return `blog/posts/_history/${slug}.json`;
}

function genId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getPostHistory(slug: string): Promise<PostHistoryFile> {
  if (!slug) return { slug, snapshots: [] };
  try {
    const f = await getFile(historyPath(slug));
    if (!f) return { slug, snapshots: [] };
    const parsed = JSON.parse(f.content);
    if (!Array.isArray(parsed?.snapshots)) return { slug, snapshots: [] };
    return { slug, snapshots: parsed.snapshots as PostSnapshot[] };
  } catch {
    return { slug, snapshots: [] };
  }
}

export async function appendPostSnapshot(
  slug: string,
  fm: Record<string, unknown>,
  body: string,
): Promise<void> {
  if (!slug) return;
  const path = historyPath(slug);
  const existing = await getFile(path);
  let current: PostSnapshot[] = [];
  if (existing) {
    try {
      const parsed = JSON.parse(existing.content);
      if (Array.isArray(parsed?.snapshots)) current = parsed.snapshots as PostSnapshot[];
    } catch {
      current = [];
    }
  }

  // Skip if latest snapshot is identical
  const latest = current[0];
  if (
    latest &&
    latest.body === body &&
    JSON.stringify(latest.fm) === JSON.stringify(fm)
  ) {
    return;
  }

  const next: PostSnapshot = {
    id: genId(),
    timestamp: new Date().toISOString(),
    fm,
    body,
  };
  const snapshots = [next, ...current].slice(0, MAX_SNAPSHOTS);
  const content = JSON.stringify({ slug, snapshots }, null, 2) + '\n';

  await putFile(
    path,
    content,
    `chore(blog): snapshot ${slug}`,
    existing?.sha,
  );
}
