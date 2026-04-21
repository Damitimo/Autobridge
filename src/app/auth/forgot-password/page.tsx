'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-dark flex-col justify-center items-center p-12">
        <Link href="/">
          <Image
            src="/logo-square.svg"
            alt="AutoBridge"
            width={250}
            height={250}
            className="mb-8 cursor-pointer"
          />
        </Link>
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Reset Your Password
        </h2>
        <p className="text-primary-200 text-center max-w-md">
          Don't worry, it happens to the best of us. Enter your email and we'll send you a reset link.
        </p>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <Link href="/">
                <Image
                  src="/logo-wide.svg"
                  alt="AutoBridge"
                  width={180}
                  height={50}
                />
              </Link>
            </div>
            {submitted ? (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription className="mt-2">
                  If an account exists for {email}, we've sent a password reset link.
                  Please check your inbox and spam folder.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-3xl">Forgot Password?</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                >
                  Try another email
                </Button>
                <Link href="/auth/login">
                  <Button className="w-full bg-brand-dark hover:bg-primary-700 text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label="Email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  error={error}
                  required
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-brand-dark hover:bg-primary-700 text-white"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>

                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
