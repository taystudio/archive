import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '방명록',
  description: '방문자 방명록',
};

export default function GuestbookPage() {
  return (
    <div>
      <section className="mb-8 pb-6 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold">방명록</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          편하게 한마디 남겨주세요.
        </p>
      </section>

      <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
        <p className="mb-2">💬 댓글 시스템 연결 예정 (Giscus)</p>
        <p className="text-xs">
          GitHub Discussions를 이용한 무료 댓글/방명록이 연결될 자리입니다.
        </p>
      </div>
    </div>
  );
}
