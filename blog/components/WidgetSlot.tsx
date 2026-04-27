import { getWidgetsForSlot } from '@/lib/widgets-server';
import type { WidgetSlotName } from '@/lib/widgets';
import { WIDGET_REGISTRY } from './widgets/registry';

type Props = {
  name: WidgetSlotName;
  className?: string;
  layout?: 'column' | 'row';
};

export default function WidgetSlot({ name, className, layout = 'column' }: Props) {
  const widgets = getWidgetsForSlot(name).filter((w) => w.enabled !== false);
  if (widgets.length === 0) return null;

  const direction =
    layout === 'row'
      ? 'flex flex-col sm:flex-row flex-wrap gap-4'
      : 'flex flex-col gap-4';

  return (
    <div className={`${direction} ${className ?? ''}`.trim()}>
      {widgets.map((w, idx) => {
        const Comp = WIDGET_REGISTRY[w.type];
        if (!Comp) return null;
        return <Comp key={`${name}-${w.type}-${idx}`} {...(w.props ?? {})} />;
      })}
    </div>
  );
}
