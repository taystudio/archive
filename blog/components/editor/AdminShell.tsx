'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/github';

const TABS = [
  { href: '/admin', label: '📝 글 목록', match: (p: string) => p === '/admin' || p === '/admin/' },
  { href: '/admin/settings', label: '⚙ 설정', match: (p: string) => p.startsWith('/admin/settings') },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();

  const logout = () => {
    clearToken();
    router.replace('/admin');
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <meta name="robots" content="noindex,nofollow" />

      <nav className="mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const active = t.match(pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  'px-3 py-2 text-sm border-b-2 -mb-px no-underline ' +
                  (active
                    ? 'border-[var(--accent)] text-[var(--accent)] font-medium'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--fg)]')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={logout}
          className="text-xs text-[var(--muted)] hover:text-[var(--fg)] px-2"
        >
          로그아웃
        </button>
      </nav>

      {children}
    </div>
  );
}
