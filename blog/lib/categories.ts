import categoriesData from '@/config/categories.json';

export type Category = {
  slug: string;
  name: string;
  children?: Category[];
};

export const CATEGORIES: Category[] = categoriesData as Category[];

export type FlatCategory = { path: string[]; name: string; fullName: string };

export function flattenCategories(tree: Category[] = CATEGORIES, parents: string[] = []): FlatCategory[] {
  const out: FlatCategory[] = [];
  for (const c of tree) {
    const path = [...parents, c.slug];
    const pathNames =
      parents.length === 0
        ? c.name
        : parents.map((p) => findByPath([p])?.name).filter(Boolean).join(' / ') + ' / ' + c.name;
    out.push({ path, name: c.name, fullName: pathNames });
    if (c.children) out.push(...flattenCategories(c.children, path));
  }
  return out;
}

export function findByPath(path: string[], tree: Category[] = CATEGORIES): Category | null {
  let current: Category | undefined;
  let level = tree;
  for (const slug of path) {
    current = level.find((c) => c.slug === slug);
    if (!current) return null;
    level = current.children ?? [];
  }
  return current ?? null;
}

export function categoryLabel(path: string[] | undefined): string {
  if (!path || path.length === 0) return '';
  const parts: string[] = [];
  let level: Category[] | undefined = CATEGORIES;
  for (const slug of path) {
    const c: Category | undefined = level?.find((x) => x.slug === slug);
    if (!c) break;
    parts.push(c.name);
    level = c.children;
  }
  return parts.join(' / ');
}

export function allCategoryPaths(tree: Category[] = CATEGORIES, parents: string[] = []): string[][] {
  const out: string[][] = [];
  for (const c of tree) {
    const path = [...parents, c.slug];
    out.push(path);
    if (c.children) out.push(...allCategoryPaths(c.children, path));
  }
  return out;
}
