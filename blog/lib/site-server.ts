import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_SITE_CONFIG, type SiteConfig } from './site';

export function getSiteConfig(): SiteConfig {
  try {
    const p = path.join(process.cwd(), 'config', 'site.json');
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      analytics: { ...DEFAULT_SITE_CONFIG.analytics, ...(parsed.analytics ?? {}) },
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}
