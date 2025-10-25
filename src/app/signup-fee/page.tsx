'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';

export default function SignupFeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    checkSignupFeeStatus();
  }, []);

  const checkSignupFeeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.user.signupFeePaid) {
        setAlreadyPaid(true);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    try {
      setApplyingCoupon(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch('/api/payment/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ couponCode: couponCode.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // Coupon applied successfully
        alert('🎉 Coupon applied! Your account is now activated.');
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon error:', error);
      setError('Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch('/api/payment/signup-fee', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  if (alreadyPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle>Signup Fee Already Paid</CardTitle>
                <CardDescription>Your account is fully activated</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You have already paid the signup fee. You can now start browsing vehicles and placing bids.
            </p>
            <Button onClick={() => router.push('/vehicles')} className="w-full">
              Browse Vehicles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
          <CardDescription>One-time signup fee to activate your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Signup Fee</h3>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">₦100,000</p>
                <p className="text-sm text-blue-600">≈ $64.52 USD</p>
              </div>
            </div>
            <p className="text-sm text-blue-800">
              This is a one-time, non-refundable registration fee to activate your AutoBridge account.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">What you get:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Access to all US auction vehicles (Copart & IAAI)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Ability to place bids on vehicles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">AI-powered cost calculator for Nigerian importers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">End-to-end shipping and customs clearance support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Real-time tracking of your shipments</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">24/7 customer support</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-blue-900">Have a Coupon Code?</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponCode.trim()}
                variant="outline"
                className="border-blue-300"
              >
                {applyingCoupon ? 'Applying...' : 'Apply'}
              </Button>
            </div>
            <p className="text-xs text-blue-700 mt-2 font-medium">
              COUPON: NOKINGS
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or pay with</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Payment Method</h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CreditCard className="h-5 w-5" />
              <span>Secure payment via Paystack (Card, Bank Transfer, USSD)</span>
            </div>
          </div>

          <Button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing...' : 'Pay ₦100,000 Now'}
          </Button>

          <p className="text-xs text-center text-gray-500">
            You will be redirected to Paystack to complete your payment securely.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
