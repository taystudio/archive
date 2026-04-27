import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_THEME_ID, getThemeById, type ThemePreset } from './themes';

export type ThemeConfig = {
  preset: string;
};

export function getThemeConfig(): ThemeConfig {
  try {
    const p = path.join(process.cwd(), 'config', 'theme.json');
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>;
    return { preset: parsed.preset || DEFAULT_THEME_ID };
  } catch {
    return { preset: DEFAULT_THEME_ID };
  }
}

export function getActiveTheme(): ThemePreset {
  return getThemeById(getThemeConfig().preset);
}
