'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

      // Redirect based on signup fee status
      if ((session.user as any).signupFeePaid) {
        router.push('/dashboard');
      } else {
        router.push('/signup-fee');
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mb-4"></div>
        <p className="text-white">Completing sign in...</p>
      </div>
    </div>
  );
}
