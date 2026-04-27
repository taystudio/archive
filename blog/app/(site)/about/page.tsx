import type { Metadata } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const PORTFOLIO_URL = `${BASE.replace('/blog', '')}/`;

export const metadata: Metadata = {
  title: 'About',
  description: 'About TayLee — 엔지니어 프로필과 포트폴리오',
};

export default function AboutPage() {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h1>About</h1>
      <p>
        안녕하세요. <strong>TayLee</strong> 입니다. 소프트웨어/엔지니어링
        전반에 관심이 있고, 이 블로그는 제가 공부하고 실험한 것을 기록하는
        공간입니다.
      </p>

      <h2>Portfolio</h2>
      <p>
        공식 포트폴리오는 같은 도메인의 루트 경로에 있습니다. 이력, 프로젝트,
        문서 아카이브를 확인하실 수 있습니다.
      </p>
      <p>
        → <a href={PORTFOLIO_URL || '/'}>포트폴리오 보러가기</a>
      </p>

      <h2>Links</h2>
      <ul>
        <li>GitHub: <a href="https://github.com/taehyuklee">@taehyuklee</a></li>
        <li>Email: <a href="mailto:thlee991@gmail.com">thlee991@gmail.com</a></li>
      </ul>

      <h2>About this blog</h2>
      <p>
        Next.js 정적 사이트로 빌드되어 GitHub Pages에서 서빙됩니다.
        MDX로 글을 쓰고, 소스는 GitHub에서 공개로 관리합니다.
      </p>
    </article>
  );
}
