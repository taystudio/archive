export type MenuItem = {
  label: string;
  href: string;
  external?: boolean;
  portfolio?: boolean;
};

export type AnalyticsConfig = {
  goatcounter?: string;
};

export type TableStyle = 'classic' | 'minimal' | 'striped' | 'card' | 'compact';

export const TABLE_STYLES: Array<{ id: TableStyle; name: string; description: string }> = [
  { id: 'classic', name: 'Classic (기본)', description: '둥근 테두리 + 줄무늬 + hover' },
  { id: 'minimal', name: 'Minimal', description: '테두리 없음 + 헤더 밑줄만' },
  { id: 'striped', name: 'Striped', description: '진한 줄무늬 + accent 헤더' },
  { id: 'card', name: 'Card', description: '각 행이 분리된 카드' },
  { id: 'compact', name: 'Compact', description: 'padding/폰트 최소, 많은 행에 적합' },
];

export type SiteConfig = {
  title: string;
  description: string;
  menu: MenuItem[];
  analytics?: AnalyticsConfig;
  favicon?: string;
  tableStyle?: TableStyle;
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  title: 'TayLee Tech & Career Lab',
  description: '',
  menu: [
    { label: 'Home', href: '/' },
    { label: 'Tags', href: '/tags' },
    { label: '방명록', href: '/guestbook' },
    { label: 'About', href: '/about' },
  ],
  analytics: {},
  tableStyle: 'classic',
};
