export type WidgetType =
  | 'categories'
  | 'recent-posts'
  | 'tag-cloud'
  | 'stats'
  | 'visitor-counter'
  | 'post-stats'
  | 'popular-posts';

export type WidgetConfig = {
  type: WidgetType;
  enabled?: boolean;
  props?: Record<string, unknown>;
};

export type WidgetSlotName = 'sidebar' | 'post_bottom' | 'home_hero';

export const SLOT_NAMES: WidgetSlotName[] = ['sidebar', 'home_hero', 'post_bottom'];

export const SLOT_LABELS: Record<WidgetSlotName, string> = {
  sidebar: '사이드바',
  home_hero: '홈 상단',
  post_bottom: '포스트 하단',
};

export type WidgetsFile = {
  slots: Record<WidgetSlotName, WidgetConfig[]>;
};

export const DEFAULT_WIDGETS: WidgetsFile = {
  slots: {
    sidebar: [
      { type: 'categories', enabled: true },
      { type: 'recent-posts', enabled: true, props: { count: 5 } },
      { type: 'tag-cloud', enabled: true, props: { max: 30 } },
      { type: 'stats', enabled: true },
    ],
    home_hero: [],
    post_bottom: [],
  },
};

type LegacyShape = { widgets: WidgetConfig[] };

function isLegacy(x: unknown): x is LegacyShape {
  return !!x && typeof x === 'object' && Array.isArray((x as LegacyShape).widgets);
}

export function normalizeWidgetsFile(raw: unknown): WidgetsFile {
  if (isLegacy(raw)) {
    return {
      slots: {
        sidebar: raw.widgets,
        home_hero: [],
        post_bottom: [],
      },
    };
  }
  const candidate = raw as Partial<WidgetsFile> | null;
  if (!candidate || typeof candidate !== 'object' || !candidate.slots) return DEFAULT_WIDGETS;
  return {
    slots: {
      sidebar: Array.isArray(candidate.slots.sidebar) ? candidate.slots.sidebar : [],
      home_hero: Array.isArray(candidate.slots.home_hero) ? candidate.slots.home_hero : [],
      post_bottom: Array.isArray(candidate.slots.post_bottom) ? candidate.slots.post_bottom : [],
    },
  };
}
