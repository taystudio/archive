'use client';

import { useRouter } from 'next/navigation';
import EditorPage from '@/components/editor/EditorPage';

export default function NewPostPage() {
  const router = useRouter();
  return (
    <EditorPage
      onClose={() => router.push('/admin')}
      onSaved={() => router.push('/admin')}
    />
  );
}
