import { Base64 } from 'js-base64';

const OWNER = 'taehyuklee';
const REPO = 'Archive';
const BRANCH = 'main';
const API = 'https://api.github.com';
const LOCAL_API = '/api/local';

const TOKEN_KEY = 'gh_pat';
const USER_KEY = 'gh_user';
export const DEV_SENTINEL = '__DEV__';

function syncPatClass() {
  if (typeof document === 'undefined') return;
  const hasToken = !!localStorage.getItem(TOKEN_KEY);
  document.documentElement.classList.toggle('has-gh-pat', hasToken);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  syncPatClass();
}
export function getRawToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function getToken(): string | null {
  const raw = getRawToken();
  if (!raw) return null;
  if (raw === DEV_SENTINEL) {
    const dev = process.env.NEXT_PUBLIC_DEV_GH_TOKEN;
    return dev && dev.length > 10 ? dev : null;
  }
  return raw;
}
export function isDevMode(): boolean {
  return getRawToken() === DEV_SENTINEL;
}

function useLocalFs(): boolean {
  return isDevMode() && !getToken();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  syncPatClass();
}

function authHeaders(): HeadersInit {
  const t = getToken();
  if (!t) throw new Error('GitHub 토큰이 필요합니다.');
  return {
    Authorization: `token ${t}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function verifyToken(): Promise<{ login: string } | null> {
  const raw = getRawToken();
  if (!raw) return null;
  const t = getToken();
  if (!t) {
    if (raw === DEV_SENTINEL) {
      const login = 'dev (local fs)';
      localStorage.setItem(USER_KEY, login);
      return { login };
    }
    return null;
  }
  const res = await fetch(`${API}/user`, { headers: authHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  const login = raw === DEV_SENTINEL ? `${data.login} (dev)` : data.login;
  localStorage.setItem(USER_KEY, login);
  return { login };
}

export type GhFile = {
  path: string;
  sha: string;
  content: string;
};

export async function getFile(path: string): Promise<GhFile | null> {
  if (useLocalFs()) {
    const res = await fetch(`${LOCAL_API}?path=${encodeURIComponent(path)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`local getFile ${path} failed: ${res.status}`);
    return res.json();
  }

  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`,
    { headers: authHeaders() },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getFile ${path} failed: ${res.status}`);
  const data = await res.json();
  return {
    path: data.path,
    sha: data.sha,
    content: Base64.decode(data.content.replace(/\n/g, '')),
  };
}

export async function listDir(path: string): Promise<Array<{ name: string; path: string; sha: string; type: string }>> {
  if (useLocalFs()) {
    const res = await fetch(`${LOCAL_API}?op=list&path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error(`local listDir ${path} failed: ${res.status}`);
    return res.json();
  }

  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`,
    { headers: authHeaders() },
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`listDir ${path} failed: ${res.status}`);
  return res.json();
}

export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<void> {
  if (useLocalFs()) {
    const res = await fetch(LOCAL_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, encoding: 'utf-8' }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`local putFile failed: ${res.status} ${err}`);
    }
    return;
  }

  const body: Record<string, string> = {
    message,
    content: Base64.encode(content),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`putFile failed: ${res.status} ${err}`);
  }
}

export async function deleteFile(path: string, sha: string, message: string): Promise<void> {
  if (useLocalFs()) {
    const res = await fetch(`${LOCAL_API}?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`local deleteFile failed: ${res.status} ${err}`);
    }
    return;
  }

  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
    {
      method: 'DELETE',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sha, branch: BRANCH }),
    },
  );
  if (!res.ok) throw new Error(`deleteFile failed: ${res.status}`);
}

export async function uploadImage(file: File, slug: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const safe = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9가-힣-_]/g, '-');
  const filename = `${Date.now()}-${safe}.${ext}`;
  const path = `blog/public/images/${slug}/${filename}`;

  const buf = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const content = btoa(binary);

  if (useLocalFs()) {
    const res = await fetch(LOCAL_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, encoding: 'base64' }),
    });
    if (!res.ok) throw new Error(`local uploadImage failed: ${res.status}`);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    return `${basePath}/images/${slug}/${filename}`;
  }

  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `chore(blog): upload image ${filename}`,
        content,
        branch: BRANCH,
      }),
    },
  );
  if (!res.ok) throw new Error(`uploadImage failed: ${res.status}`);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return `${basePath}/images/${slug}/${filename}`;
}

export const GH = { OWNER, REPO, BRANCH };
