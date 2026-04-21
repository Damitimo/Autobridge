'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/auth/callback' });
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number is too short';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: formData.referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresVerification) {
          // Store verification token and redirect to verify page
          sessionStorage.setItem('verificationToken', data.verificationToken);
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
        } else {
          // Direct login (shouldn't happen with new flow, but just in case)
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          router.push('/dashboard');
        }
      } else {
        setErrors({ submit: data.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
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
          Your Gateway to U.S. Auto Auctions
        </h2>
        <p className="text-primary-200 text-center max-w-md mb-8">
          Join thousands of buyers who trust AutoBridge to import quality vehicles from Copart and IAAI auctions.
        </p>
        <div className="grid grid-cols-2 gap-4 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark font-bold">✓</span>
            Transparent Pricing
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark font-bold">✓</span>
            Expert Bidding
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark font-bold">✓</span>
            Door-to-Door Shipping
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark font-bold">✓</span>
            Customs Clearance
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-xl">
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
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Start importing vehicles from U.S. auctions</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full mb-4 flex items-center justify-center gap-3"
              onClick={handleGoogleSignUp}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
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
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />
                <FormInput
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  placeholder="+234 800 000 0000"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                />

                <FormInput
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                />
              </div>

              <FormInput
                label="Referral Code (Optional)"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Enter referral code if you have one"
              />

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
                Create Account
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-brand-dark font-semibold hover:underline">
                  Login here
                </Link>
              </p>

              <p className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-brand-dark hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-brand-dark hover:underline">Privacy Policy</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

