import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPO_ROOT = path.resolve(process.cwd(), '..');

function resolveSafe(relPath: string): string {
  if (!relPath || relPath.includes('\0')) throw new Error('invalid path');
  const normalized = path.normalize(relPath).replace(/^[/\\]+/, '');
  const full = path.resolve(REPO_ROOT, normalized);
  if (!full.startsWith(REPO_ROOT + path.sep) && full !== REPO_ROOT) {
    throw new Error('path escapes repo root');
  }
  return full;
}

function forbidProd() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev-only endpoint' }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const blocked = forbidProd();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const op = searchParams.get('op');
  const p = searchParams.get('path');
  if (!p) return NextResponse.json({ error: 'missing path' }, { status: 400 });

  try {
    const full = resolveSafe(p);

    if (op === 'list') {
      try {
        const entries = await fs.readdir(full, { withFileTypes: true });
        const items = entries.map((e) => ({
          name: e.name,
          path: `${p.replace(/\/$/, '')}/${e.name}`,
          sha: 'local',
          type: e.isDirectory() ? 'dir' : 'file',
        }));
        return NextResponse.json(items);
      } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') return NextResponse.json([]);
        throw e;
      }
    }

    try {
      const content = await fs.readFile(full, 'utf-8');
      return NextResponse.json({ path: p, sha: 'local', content });
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') return NextResponse.json(null, { status: 404 });
      throw e;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const blocked = forbidProd();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { path: relPath, content, encoding } = body as {
      path: string;
      content: string;
      encoding?: 'utf-8' | 'base64';
    };
    if (!relPath || typeof content !== 'string') {
      return NextResponse.json({ error: 'missing path or content' }, { status: 400 });
    }
    const full = resolveSafe(relPath);
    await fs.mkdir(path.dirname(full), { recursive: true });

    if (encoding === 'base64') {
      const buf = Buffer.from(content, 'base64');
      await fs.writeFile(full, buf);
    } else {
      await fs.writeFile(full, content, 'utf-8');
    }
    return NextResponse.json({ ok: true, path: relPath, sha: 'local' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const blocked = forbidProd();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const p = searchParams.get('path');
  if (!p) return NextResponse.json({ error: 'missing path' }, { status: 400 });

  try {
    const full = resolveSafe(p);
    await fs.unlink(full);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return NextResponse.json({ ok: true });
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
