import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import WriteButton from './WriteButton';
import { getSiteConfig } from '@/lib/site-server';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Header() {
  const site = getSiteConfig();

  const resolveHref = (href: string, portfolio?: boolean) => {
    if (portfolio) return `${BASE.replace('/blog', '')}/`;
    return href;
  };

  return (
    <header className="border-b border-[var(--border-2)] sticky top-0 z-20 backdrop-blur bg-[var(--bg)]/85">
      <div className="mx-auto max-w-[1240px] px-4 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-semibold tracking-tight no-underline text-[var(--fg)] shrink-0 text-lg sm:text-xl"
        >
          {site.title}
        </Link>
        <nav className="flex items-center gap-3 md:gap-4 text-sm">
          {site.menu.map((m) =>
            m.external ? (
              <a
                key={m.label}
                href={resolveHref(m.href, m.portfolio)}
                className="no-underline text-[var(--fg)] hidden md:inline"
                target={m.portfolio ? undefined : '_blank'}
                rel={m.external && !m.portfolio ? 'noreferrer' : undefined}
              >
                {m.label}
              </a>
            ) : (
              <Link
                key={m.label}
                href={m.href}
                className="no-underline text-[var(--fg)] hidden sm:inline"
              >
                {m.label}
              </Link>
            ),
          )}
          <WriteButton />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
