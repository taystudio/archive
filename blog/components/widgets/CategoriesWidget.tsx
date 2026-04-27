import WidgetSection from './WidgetSection';
import CategoriesTreeClient, { type TreeNode } from './CategoriesTreeClient';
import { CATEGORIES, type Category } from '@/lib/categories';
import { countByCategory } from '@/lib/posts';

function buildTree(
  nodes: Category[],
  parents: string[],
  counts: Record<string, number>,
): TreeNode[] {
  return nodes.map((c) => {
    const pathArr = [...parents, c.slug];
    const key = pathArr.join('/');
    return {
      slug: c.slug,
      name: c.name,
      pathKey: key,
      href: `/category/${key}`,
      count: counts[key] ?? 0,
      children: c.children ? buildTree(c.children, pathArr, counts) : [],
    };
  });
}

export default function CategoriesWidget() {
  const counts = countByCategory();
  const tree = buildTree(CATEGORIES, [], counts);
  return (
    <WidgetSection title="Categories">
      <CategoriesTreeClient tree={tree} />
    </WidgetSection>
  );
}
