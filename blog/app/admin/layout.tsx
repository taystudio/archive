'use client';

import { useEffect, useState } from 'react';
import PATLogin from '@/components/editor/PATLogin';
import { verifyToken } from '@/lib/github';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await verifyToken().catch(() => null);
      if (u) setUser(u.login);
      setChecked(true);
    })();
  }, []);

  if (!checked) {
    return <div className="py-20 text-center text-[var(--muted)]">확인 중…</div>;
  }

  if (!user) {
    return <PATLogin onSuccess={setUser} />;
  }

  return <>{children}</>;
}
