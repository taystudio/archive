'use client';

import { useState } from 'react';
import { DEV_SENTINEL, saveToken, verifyToken } from '@/lib/github';

const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_PASSWORD ?? '1';

export default function PATLogin({ onSuccess }: { onSuccess: (login: string) => void }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    setLoading(true);
    setErr(null);
    try {
      if (v === DEV_PASSWORD) {
        saveToken(DEV_SENTINEL);
      } else {
        saveToken(v);
      }
      const user = await verifyToken();
      if (!user) {
        setErr('인증 실패. PAT 또는 비밀번호를 확인하세요.');
        return;
      }
      onSuccess(user.login);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const hasDevToken = !!process.env.NEXT_PUBLIC_DEV_GH_TOKEN;

  return (
    <div className="max-w-md mx-auto mt-20 border border-[var(--border)] rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-1">Admin Login</h1>
      <p className="text-sm text-[var(--muted)] mb-4">
        GitHub PAT 또는 개발용 비밀번호 입력.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          autoComplete="off"
          placeholder={`PAT(ghp_...) 또는 "${DEV_PASSWORD}"`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--accent)] text-white py-2 text-sm disabled:opacity-50"
        >
          {loading ? '확인 중…' : '로그인'}
        </button>
      </form>
      <div className="mt-4 p-3 rounded-md bg-black/5 dark:bg-white/5 text-xs text-[var(--muted)] space-y-1">
        <p>
          <strong>개발용 비번 "{DEV_PASSWORD}"</strong>: 비번만으로 로그인하면 로컬
          파일 시스템에 직접 읽기/쓰기 (GitHub 커밋 없이 전체 기능 사용 가능).
        </p>
        <p>
          {hasDevToken ? (
            <span className="text-green-600 dark:text-green-400">
              ✓ DEV 토큰 설정됨 — 저장 시 GitHub에 실제 커밋됨
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-400">
              ✓ 로컬 fs 모드 — 저장 시 워킹 디렉토리 파일이 바로 수정됨 (커밋은 수동)
            </span>
          )}
        </p>
        <p>
          PAT로 로그인하면 (또는 <code>NEXT_PUBLIC_DEV_GH_TOKEN</code> 설정 시)
          저장 시 실제 GitHub에 커밋됩니다.{' '}
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noreferrer"
          >
            PAT 발급
          </a>
        </p>
      </div>
    </div>
  );
}
