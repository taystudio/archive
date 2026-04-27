const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function resolveAssetPath(src?: string): string | null {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (BASE && src.startsWith(BASE)) return src;
  if (src.startsWith('/')) return `${BASE}${src}`;
  return `${BASE}/${src}`;
}

export function faviconMimeType(src?: string): string | undefined {
  if (!src) return undefined;
  const lower = src.toLowerCase();
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.ico')) return 'image/x-icon';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return undefined;
}
