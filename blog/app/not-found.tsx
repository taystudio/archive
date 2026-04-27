import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-[var(--muted)] mt-2">페이지를 찾을 수 없습니다.</p>
      <Link href="/" className="inline-block mt-6">← 홈으로</Link>
    </div>
  );
}
