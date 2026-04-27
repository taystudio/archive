'use client';

import { useRouter } from 'next/navigation';
import AdminShell from '@/components/editor/AdminShell';
import SettingsEditor from '@/components/editor/SettingsEditor';

export default function SettingsPage() {
  const router = useRouter();
  return (
    <AdminShell>
      <SettingsEditor onClose={() => router.push('/admin')} />
    </AdminShell>
  );
}
