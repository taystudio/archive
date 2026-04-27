'use client';

import PostList from '@/components/editor/PostList';
import AdminShell from '@/components/editor/AdminShell';

export default function AdminHomePage() {
  return (
    <AdminShell>
      <PostList />
    </AdminShell>
  );
}
