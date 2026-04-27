export type ThemeVars = {
  '--bg'?: string;
  '--surface'?: string;
  '--fg'?: string;
  '--muted'?: string;
  '--muted-2'?: string;
  '--accent'?: string;
  '--accent-soft'?: string;
  '--border'?: string;
  '--border-2'?: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  preview: { bg: string; fg: string; accent: string; surface: string };
  light: ThemeVars;
  dark: ThemeVars;
  bodyFontFamily?: string;
};

export const THEMES: ThemePreset[] = [
  {
    id: 'forest',
    name: 'Forest (기본)',
    description: 'Off-white + forest green · 차분하고 가독성 높음',
    preview: { bg: '#fafaf8', surface: '#ffffff', fg: '#1c1c1e', accent: '#3f6f54' },
    light: {
      '--bg': '#fafaf8',
      '--surface': '#ffffff',
      '--fg': '#1c1c1e',
      '--muted': '#6b6b70',
      '--muted-2': '#8a8a8f',
      '--accent': '#3f6f54',
      '--accent-soft': '#e9f0ec',
      '--border': '#ececea',
      '--border-2': '#f2f2f0',
    },
    dark: {
      '--bg': '#0f1012',
      '--surface': '#16181c',
      '--fg': '#ececed',
      '--muted': '#9a9aa0',
      '--muted-2': '#6b6b70',
      '--accent': '#8fb89e',
      '--accent-soft': 'rgba(143, 184, 158, 0.12)',
      '--border': '#24262b',
      '--border-2': '#1b1d21',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Cool gray + ocean blue · 테크/개발자 톤',
    preview: { bg: '#f7f8fa', surface: '#ffffff', fg: '#0f172a', accent: '#2563eb' },
    light: {
      '--bg': '#f7f8fa',
      '--surface': '#ffffff',
      '--fg': '#0f172a',
      '--muted': '#64748b',
      '--muted-2': '#94a3b8',
      '--accent': '#2563eb',
      '--accent-soft': '#dbeafe',
      '--border': '#e2e8f0',
      '--border-2': '#eef2f7',
    },
    dark: {
      '--bg': '#0b1220',
      '--surface': '#111a2c',
      '--fg': '#e2e8f0',
      '--muted': '#94a3b8',
      '--muted-2': '#64748b',
      '--accent': '#60a5fa',
      '--accent-soft': 'rgba(96, 165, 250, 0.14)',
      '--border': '#1e293b',
      '--border-2': '#152138',
    },
  },
  {
    id: 'rose',
    name: 'Rosé',
    description: 'Cream + burgundy · 따뜻한 일기/에세이 톤',
    preview: { bg: '#fdf8f4', surface: '#ffffff', fg: '#3a2c27', accent: '#9f3455' },
    light: {
      '--bg': '#fdf8f4',
      '--surface': '#ffffff',
      '--fg': '#3a2c27',
      '--muted': '#85706a',
      '--muted-2': '#a89991',
      '--accent': '#9f3455',
      '--accent-soft': '#fae3ea',
      '--border': '#f0e4db',
      '--border-2': '#f7ece5',
    },
    dark: {
      '--bg': '#1a1315',
      '--surface': '#211a1c',
      '--fg': '#eedfd9',
      '--muted': '#a89991',
      '--muted-2': '#85706a',
      '--accent': '#e87b99',
      '--accent-soft': 'rgba(232, 123, 153, 0.14)',
      '--border': '#2a2023',
      '--border-2': '#221a1d',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: '다크 퍼스트 · 코딩 블로그 · AMOLED 블랙 느낌',
    preview: { bg: '#0a0a0b', surface: '#151518', fg: '#f0f0f0', accent: '#a78bfa' },
    light: {
      '--bg': '#0a0a0b',
      '--surface': '#151518',
      '--fg': '#f0f0f0',
      '--muted': '#8a8a90',
      '--muted-2': '#666670',
      '--accent': '#a78bfa',
      '--accent-soft': 'rgba(167, 139, 250, 0.14)',
      '--border': '#222228',
      '--border-2': '#1a1a1f',
    },
    dark: {
      '--bg': '#050506',
      '--surface': '#0f0f12',
      '--fg': '#f4f4f5',
      '--muted': '#8a8a90',
      '--muted-2': '#5a5a65',
      '--accent': '#c4b5fd',
      '--accent-soft': 'rgba(196, 181, 253, 0.14)',
      '--border': '#1d1d22',
      '--border-2': '#131316',
    },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Monospace + neon green · 해커/터미널 룩',
    preview: { bg: '#0d1117', surface: '#161b22', fg: '#c9d1d9', accent: '#39d353' },
    light: {
      '--bg': '#0d1117',
      '--surface': '#161b22',
      '--fg': '#c9d1d9',
      '--muted': '#8b949e',
      '--muted-2': '#6e7681',
      '--accent': '#39d353',
      '--accent-soft': 'rgba(57, 211, 83, 0.12)',
      '--border': '#21262d',
      '--border-2': '#161b22',
    },
    dark: {
      '--bg': '#010409',
      '--surface': '#0d1117',
      '--fg': '#c9d1d9',
      '--muted': '#8b949e',
      '--muted-2': '#6e7681',
      '--accent': '#39d353',
      '--accent-soft': 'rgba(57, 211, 83, 0.14)',
      '--border': '#21262d',
      '--border-2': '#0d1117',
    },
    bodyFontFamily:
      'ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, Consolas, monospace',
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    description: 'Serif + warm paper · 글쓰기 중심 블로그',
    preview: { bg: '#f8f5ee', surface: '#fffdf7', fg: '#1a1a1a', accent: '#b84a1e' },
    light: {
      '--bg': '#f8f5ee',
      '--surface': '#fffdf7',
      '--fg': '#1a1a1a',
      '--muted': '#5e574b',
      '--muted-2': '#8f8777',
      '--accent': '#b84a1e',
      '--accent-soft': '#fae5d9',
      '--border': '#e8dfca',
      '--border-2': '#efe8d5',
    },
    dark: {
      '--bg': '#1d1a15',
      '--surface': '#242019',
      '--fg': '#ece7dc',
      '--muted': '#a89f8d',
      '--muted-2': '#6e6756',
      '--accent': '#e88a58',
      '--accent-soft': 'rgba(232, 138, 88, 0.15)',
      '--border': '#2d2820',
      '--border-2': '#221e17',
    },
    bodyFontFamily:
      '"Iowan Old Style", "Palatino Linotype", Palatino, "URW Palladio L", serif',
  },
];

export const DEFAULT_THEME_ID = 'forest';

export function getThemeById(id: string | undefined | null): ThemePreset {
  if (!id) return THEMES[0];
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function serializeThemeCSS(theme: ThemePreset): string {
  const kv = (obj: ThemeVars) =>
    Object.entries(obj)
      .filter(([, v]) => !!v)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
  const body = theme.bodyFontFamily
    ? `body{font-family:${theme.bodyFontFamily};}`
    : '';
  return `:root{${kv(theme.light)}}.dark{${kv(theme.dark)}}${body}`;
}
