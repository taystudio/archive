import Link from 'next/link';

const base =
  'rounded-md border border-[var(--border)] px-2.5 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5 no-underline text-[var(--fg)]';

export default function WriteButton() {
  return (
    <>
      <Link href="/admin/write" className={`wb-write ${base}`} title="새 글 쓰기">
        ✏️ Write
      </Link>
      <Link href="/admin" className={`wb-admin ${base}`} title="관리자 로그인">
        🔒 Admin
      </Link>
    </>
  );
}
