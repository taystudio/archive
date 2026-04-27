import type { WidgetType } from './widgets';

export type FieldKind = 'text' | 'number' | 'select';

export type FieldSchema = {
  label: string;
  kind: FieldKind;
  default?: string | number;
  placeholder?: string;
  options?: string[];
  hint?: string;
};

export type WidgetMeta = {
  type: WidgetType;
  label: string;
  description: string;
  defaultProps?: Record<string, unknown>;
  fields: Record<string, FieldSchema>;
};

export const WIDGET_META: Record<WidgetType, WidgetMeta> = {
  categories: {
    type: 'categories',
    label: 'Categories',
    description: '카테고리 트리',
    fields: {},
  },
  'recent-posts': {
    type: 'recent-posts',
    label: 'Recent Posts',
    description: '최근 글 목록',
    defaultProps: { count: 5 },
    fields: {
      count: { label: '표시 개수', kind: 'number', default: 5 },
    },
  },
  'tag-cloud': {
    type: 'tag-cloud',
    label: 'Tag Cloud',
    description: '태그 클라우드',
    defaultProps: { max: 30 },
    fields: {
      max: { label: '최대 태그 수', kind: 'number', default: 30 },
    },
  },
  stats: {
    type: 'stats',
    label: 'Stats',
    description: '글/태그 개수',
    fields: {},
  },
  'post-stats': {
    type: 'post-stats',
    label: 'Post Stats',
    description: '현재 포스트 조회수 (Total/Today) · 포스트 하단 전용',
    fields: {
      title: { label: '제목', kind: 'text', default: '이 글의 조회수' },
      siteCode: {
        label: 'GoatCounter site code',
        kind: 'text',
        placeholder: '(비워두면 Settings > Analytics 값 사용)',
      },
    },
  },
  'popular-posts': {
    type: 'popular-posts',
    label: 'Popular Posts',
    description: '조회수 상위 N개 포스트',
    defaultProps: { count: 5 },
    fields: {
      count: { label: '표시 개수', kind: 'number', default: 5 },
      siteCode: {
        label: 'GoatCounter site code',
        kind: 'text',
        placeholder: '(비워두면 Settings > Analytics 값 사용)',
      },
    },
  },
  'visitor-counter': {
    type: 'visitor-counter',
    label: 'Visitor Counter',
    description: '방문자 카운터',
    defaultProps: { provider: 'visitor-badge', pageId: '' },
    fields: {
      provider: {
        label: 'Provider',
        kind: 'select',
        options: ['visitor-badge', 'goatcounter', 'custom'],
        default: 'visitor-badge',
        hint: 'visitor-badge = visitor-badge.laobi.icu (가입 불필요, Total만) / goatcounter = 가입 필요 (Total+Today) / custom = 자체 API',
      },
      pageId: {
        label: 'Page ID',
        kind: 'text',
        placeholder: 'taehyuklee.Archive',
        hint: 'visitor-badge provider 사용 시. 고유 ID (비워두면 target URL에서 자동 추출)',
      },
      target: {
        label: 'Target URL',
        kind: 'text',
        placeholder: 'https://taehyuklee.github.io/Archive/blog',
        hint: 'pageId 자동 추출용 (visitor-badge provider)',
      },
      siteCode: {
        label: 'GoatCounter site code',
        kind: 'text',
        placeholder: 'myblog',
        hint: 'goatcounter provider 사용 시 필수. 별도 pixel script를 layout.tsx에 추가해야 카운팅됨',
      },
      customTotalUrl: {
        label: 'Custom Total URL',
        kind: 'text',
        placeholder: 'https://...',
        hint: 'custom provider 사용 시. JSON `{count: n}` 반환',
      },
      customTodayUrl: {
        label: 'Custom Today URL',
        kind: 'text',
        placeholder: 'https://...',
        hint: 'custom provider 사용 시',
      },
    },
  },
};

export const WIDGET_TYPES: WidgetType[] = Object.keys(WIDGET_META) as WidgetType[];
