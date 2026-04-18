'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Store the API token and user info in localStorage for compatibility
      const apiToken = (session as any).apiToken;
      if (apiToken) {
        localStorage.setItem('token', apiToken);
        localStorage.setItem('user', JSON.stringify({
          id: (session.user as any).id,
          email: session.user?.email,
          firstName: session.user?.name?.split(' ')[0] || '',
          lastName: session.user?.name?.split(' ').slice(1).join(' ') || '',
          signupFeePaid: (session.user as any).signupFeePaid,
        }));
      }

      // Check if this is an admin login attempt
      if (redirectTo === 'admin') {
        // Verify admin role via API
        fetch('/api/admin/auth/verify-google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user?.email }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.isAdmin) {
              localStorage.setItem('adminToken', data.token);
              router.push('/admin');
            } else {
              router.push('/admin/login?error=not_admin');
            }
          })
          .catch(() => {
            router.push('/admin/login?error=verification_failed');
          });
        return;
      }

      // Always redirect to dashboard - signup fee check happens when bidding
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [session, status, router, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mb-4"></div>
        <p className="text-white">Completing sign in...</p>
      </div>
    </div>
  );
}
