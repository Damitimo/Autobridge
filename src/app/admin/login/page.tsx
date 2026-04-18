'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';
import { signIn } from 'next-auth/react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/auth/callback?redirect=admin' });
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Check for error from Google auth redirect
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'not_admin') {
      setErrors({ submit: 'This account does not have admin access.' });
    } else if (error === 'verification_failed') {
      setErrors({ submit: 'Failed to verify admin access. Please try again.' });
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        router.push('/admin');
      } else {
        setErrors({ submit: data.error || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark py-12 px-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6 -mt-2">
            <Image
              src="/logo-wide-gold.svg"
              alt="AutoBridge"
              width={220}
              height={60}
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-brand-dark" />
            <CardTitle className="text-2xl">Admin Login</CardTitle>
          </div>
          <CardDescription>Access the AutoBridge admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mb-4 flex items-center justify-center gap-3"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <FormInput
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-brand-dark hover:bg-primary-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login to Admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
