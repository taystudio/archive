'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import EditorPage from '@/components/editor/EditorPage';

type Params = { slug: string };

export default function EditPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = use(params);
  const router = useRouter();
  return (
    <EditorPage
      initialSlug={slug}
      onClose={() => router.push('/admin')}
      onSaved={() => router.push('/admin')}
    />
  );
}
