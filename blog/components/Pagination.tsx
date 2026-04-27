import Link from 'next/link';

type Props = {
  current: number;
  total: number;
  hrefFor: (page: number) => string;
};

export default function Pagination({ current, total, hrefFor }: Props) {
  if (total <= 1) return null;

  const pages: (number | '…')[] = [];
  const push = (n: number | '…') => pages.push(n);
  const range = (s: number, e: number) => {
    for (let i = s; i <= e; i++) push(i);
  };

  if (total <= 7) {
    range(1, total);
  } else {
    push(1);
    if (current > 3) push('…');
    range(Math.max(2, current - 1), Math.min(total - 1, current + 1));
    if (current < total - 2) push('…');
    push(total);
  }

  const btn =
    'inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md text-sm border border-[var(--border)] no-underline';
  const active = 'bg-[var(--accent)] text-white border-[var(--accent)]';
  const base = 'text-[var(--fg)] hover:bg-black/5 dark:hover:bg-white/5';

  return (
    <nav className="flex justify-center gap-1 mt-10" aria-label="pagination">
      {current > 1 && (
        <Link className={`${btn} ${base}`} href={hrefFor(current - 1)}>
          ←
        </Link>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="inline-flex items-center px-2 text-[var(--muted)]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`${btn} ${p === current ? active : base}`}
            aria-current={p === current ? 'page' : undefined}
          >
            {p}
          </Link>
        ),
      )}
      {current < total && (
        <Link className={`${btn} ${base}`} href={hrefFor(current + 1)}>
          →
        </Link>
      )}
    </nav>
  );
}
