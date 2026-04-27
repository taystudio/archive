import AdSense, { type AdVariant } from './AdSense';

type SlotKey = 'post-top' | 'post-mid' | 'post-end' | 'rail' | 'infeed' | 'mobile-sticky';

const SLOT_MAP: Record<SlotKey, { slot: string; variant: AdVariant }> = {
  'post-top': { slot: '1111111111', variant: 'inline' },
  'post-mid': { slot: '2222222222', variant: 'inline' },
  'post-end': { slot: '3333333333', variant: 'inline' },
  rail: { slot: '4444444444', variant: 'rail' },
  infeed: { slot: '5555555555', variant: 'infeed' },
  'mobile-sticky': { slot: '6666666666', variant: 'mobile-sticky' },
};

export default function AdSlot({ name }: { name: SlotKey }) {
  const cfg = SLOT_MAP[name];
  return <AdSense slot={cfg.slot} variant={cfg.variant} />;
}

export function injectAdsInContent(html: string, adHtml: string, afterH2: number = 2): string {
  let count = 0;
  return html.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi, (match) => {
    count += 1;
    if (count === afterH2) return `${match}${adHtml}`;
    return match;
  });
}
