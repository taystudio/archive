export type Parsed = {
  data: Record<string, string | string[]>;
  body: string;
};

export function parseFrontmatter(raw: string): Parsed {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const [, fm, body] = m;
  const data: Record<string, string | string[]> = {};
  for (const line of fm.split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    const [, key, rawVal] = mm;
    let val: string | string[] = rawVal.trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      val = val.replace(/^['"]|['"]$/g, '');
    }
    data[key] = val;
  }
  return { data, body: body.trimStart() };
}

export function serializeFrontmatter(
  data: Record<string, string | string[]>,
  body: string,
): string {
  const lines: string[] = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`);
    } else {
      const needsQuote = /[:#\-\[\]]/.test(v);
      lines.push(`${k}: ${needsQuote ? JSON.stringify(v) : v}`);
    }
  }
  lines.push('---', '', body.trimStart());
  return lines.join('\n');
}
