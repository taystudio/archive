import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_WIDGETS,
  normalizeWidgetsFile,
  type WidgetConfig,
  type WidgetSlotName,
  type WidgetsFile,
} from './widgets';

export function getWidgetsConfig(): WidgetsFile {
  try {
    const p = path.join(process.cwd(), 'config', 'widgets.json');
    const raw = fs.readFileSync(p, 'utf8');
    return normalizeWidgetsFile(JSON.parse(raw));
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function getWidgetsForSlot(slot: WidgetSlotName): WidgetConfig[] {
  return getWidgetsConfig().slots[slot] ?? [];
}
