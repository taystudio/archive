import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export function getCustomCss(): string {
  try {
    const p = path.join(process.cwd(), 'config', 'custom.css');
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}
