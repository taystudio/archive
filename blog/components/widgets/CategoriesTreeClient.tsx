'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type TreeNode = {
  slug: string;
  name: string;
  pathKey: string;
  href: string;
  count: number;
  children: TreeNode[];
};

const STORAGE_KEY = 'sidebar_categories_open';

function isOnPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href);
}

function Branch({
  node,
  openMap,
  toggle,
  pathname,
  depth,
}: {
  node: TreeNode;
  openMap: Record<string, boolean>;
  toggle: (key: string) => void;
  pathname: string;
  depth: number;
}) {
  const hasChildren = node.children.length > 0;
  const collapsible = depth === 0 && hasChildren;
  const open = collapsible ? !!openMap[node.pathKey] : true;

  return (
    <li>
      <div className="flex items-center gap-1 py-1">
        {collapsible ? (
          <button
            type="button"
            onClick={() => toggle(node.pathKey)}
            aria-label={open ? '접기' : '펼치기'}
            aria-expanded={open}
            className="w-4 h-4 flex items-center justify-center text-[10px] text-[var(--muted)] hover:text-[var(--fg)] shrink-0"
          >
            <span
              className="inline-block transition-transform duration-150"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <Link
          href={node.href}
          className={
            'flex-1 min-w-0 flex items-center justify-between text-sm no-underline ' +
            (isOnPath(pathname, node.href)
              ? 'text-[var(--accent)] font-medium'
              : 'text-[var(--fg)] hover:text-[var(--accent)]')
          }
        >
          <span className="truncate">{node.name}</span>
          {node.count > 0 && (
            <span className="text-xs text-[var(--muted)] ml-2 shrink-0">({node.count})</span>
          )}
        </Link>
      </div>
      {hasChildren && open && (
        <ul className="ml-4 pl-2 border-l border-[var(--border)]">
          {node.children.map((c) => (
            <Branch
              key={c.pathKey}
              node={c}
              openMap={openMap}
              toggle={toggle}
              pathname={pathname}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoriesTreeClient({ tree }: { tree: TreeNode[] }) {
  const pathname = usePathname() ?? '';
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let stored: Record<string, boolean> | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      /* noop */
    }
    const initial: Record<string, boolean> = {};
    for (const n of tree) {
      if (n.children.length === 0) continue;
      if (stored && Object.prototype.hasOwnProperty.call(stored, n.pathKey)) {
        initial[n.pathKey] = !!stored[n.pathKey];
      } else {
        initial[n.pathKey] = true;
      }
      if (isOnPath(pathname, n.href)) initial[n.pathKey] = true;
    }
    setOpenMap(initial);
    setHydrated(true);
  }, [pathname, tree]);

  const toggle = (key: string) => {
    setOpenMap((cur) => {
      const next = { ...cur, [key]: !cur[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  if (!hydrated) {
    const ssrMap: Record<string, boolean> = {};
    for (const n of tree) {
      if (n.children.length > 0) ssrMap[n.pathKey] = true;
    }
    return (
      <ul className="space-y-0.5">
        {tree.map((n) => (
          <Branch
            key={n.pathKey}
            node={n}
            openMap={ssrMap}
            toggle={() => undefined}
            pathname={pathname}
            depth={0}
          />
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-0.5">
      {tree.map((n) => (
        <Branch key={n.pathKey} node={n} openMap={openMap} toggle={toggle} pathname={pathname} depth={0} />
      ))}
    </ul>
  );
}
