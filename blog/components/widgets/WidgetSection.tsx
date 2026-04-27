import type { ReactNode } from 'react';

export default function WidgetSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 ' +
        (className ?? '')
      }
    >
      {title && (
        <h3 className="font-semibold text-[11px] uppercase tracking-wider text-[var(--muted)] mb-3">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
