import type { ComponentType } from 'react';
import type { WidgetType } from '@/lib/widgets';
import CategoriesWidget from './CategoriesWidget';
import RecentPostsWidget from './RecentPostsWidget';
import TagCloudWidget from './TagCloudWidget';
import StatsWidget from './StatsWidget';
import VisitorCounterWidget from './VisitorCounterWidget';
import PostStatsWidget from './PostStatsWidget';
import PopularPostsWidget from './PopularPostsWidget';

type AnyProps = Record<string, unknown>;

export const WIDGET_REGISTRY: Record<WidgetType, ComponentType<AnyProps>> = {
  categories: CategoriesWidget as ComponentType<AnyProps>,
  'recent-posts': RecentPostsWidget as ComponentType<AnyProps>,
  'tag-cloud': TagCloudWidget as ComponentType<AnyProps>,
  stats: StatsWidget as ComponentType<AnyProps>,
  'visitor-counter': VisitorCounterWidget as ComponentType<AnyProps>,
  'post-stats': PostStatsWidget as ComponentType<AnyProps>,
  'popular-posts': PopularPostsWidget as ComponentType<AnyProps>,
};
