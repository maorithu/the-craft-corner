'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff');
  }, [router]);

  return (
    <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Redirecting to unified Staff Portal...</p>
    </div>
  );
}
