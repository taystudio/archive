'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const calc = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const y = window.scrollY || doc.scrollTop;
      const p = total > 0 ? Math.min(100, Math.max(0, (y / total) * 100)) : 0;
      setPct(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="reading-progress" style={{ width: `${pct}%` }} aria-hidden="true" />;
}
