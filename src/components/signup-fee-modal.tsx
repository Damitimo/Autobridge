'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Wallet, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SIGNUP_FEE_NGN = 100000;
const NGN_RATE = 1500; // Match backend exchange rate
const SIGNUP_FEE_USD = Math.ceil(SIGNUP_FEE_NGN / NGN_RATE); // ~$67

export default function SignupFeeModal({ isOpen, onClose, onSuccess }: SignupFeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [paid, setPaid] = useState(false);
  const [view, setView] = useState<'main' | 'fund' | 'paystack' | 'verifying'>('main');
  const [fundAmount, setFundAmount] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [paystackUrl, setPaystackUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
      fetchUserEmail();
      setView('main');
      setPaid(false);
      setError('');
      setPaystackUrl('');
      setPaymentReference('');
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen]);

  const fetchUserEmail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    } catch (err) {
      console.error('Failed to fetch user email:', err);
    }
  };

  const fetchWalletBalance = async () => {
    setFetchingBalance(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.data.available || 0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setFetchingBalance(false);
    }
  };

  const verifyPayment = async (reference: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reference }),
      });
      const data = await response.json();
      return data.success === true;
    } catch (err) {
      return false;
    }
  };

  const startPolling = (reference: string) => {
    pollingRef.current = setInterval(async () => {
      const success = await verifyPayment(reference);
      if (success) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        setView('verifying');
        await fetchWalletBalance();
        setView('main');
        setError('');
      }
    }, 3000);
  };

  const handlePayFromWallet = async () => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payment/signup-fee-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPaid(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, currency: 'NGN' }),
      });

      const data = await response.json();

      if (data.success && data.authorizationUrl && data.reference) {
        setPaystackUrl(data.authorizationUrl);
        setPaymentReference(data.reference);
        setView('paystack');
        startPolling(data.reference);
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Fund wallet error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToFund = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setView('fund');
    setPaystackUrl('');
    setPaymentReference('');
  };

  const handleClose = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;

  const walletBalanceNGN = walletBalance * NGN_RATE;
  const hasEnoughBalance = walletBalanceNGN >= SIGNUP_FEE_NGN;
  const shortfallNGN = SIGNUP_FEE_NGN - walletBalanceNGN;
  const suggestedAmount = Math.ceil(shortfallNGN / 1000) * 1000;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full overflow-hidden transition-all duration-300 ${
        view === 'paystack' ? 'max-w-lg h-[600px]' : 'max-w-md'
      }`}>
        {/* Header */}
        <div className="bg-brand-dark text-white p-4 relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {(view === 'fund' || view === 'paystack') && (
              <button
                onClick={view === 'paystack' ? handleBackToFund : () => setView('main')}
                className="text-white/70 hover:text-white transition-colors mr-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-brand-dark" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {view === 'paystack' ? 'Complete Payment' : view === 'fund' ? 'Fund Wallet' : 'Signup Fee Required'}
              </h2>
              <p className="text-white/70 text-xs">
                {view === 'paystack' ? 'Secure payment via Paystack' : view === 'fund' ? 'Add money via Paystack' : 'One-time payment to start bidding'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={view === 'paystack' ? 'h-[calc(600px-72px)]' : 'p-6'}>
          {paid ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Signup Fee Paid!</h3>
              <p className="text-green-600">You can now place bids on vehicles.</p>
            </div>
          ) : view === 'verifying' ? (
            <div className="text-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-brand-dark mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Verifying Payment</h3>
              <p className="text-gray-600 text-sm">Please wait while we confirm your payment...</p>
            </div>
          ) : view === 'paystack' ? (
            <iframe
              src={paystackUrl}
              className="w-full h-full border-0"
              title="Paystack Payment"
              allow="payment"
            />
          ) : view === 'fund' ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm mb-4">
                <p className="text-yellow-800">
                  You need <strong>₦{suggestedAmount.toLocaleString()}</strong> more for the signup fee.
                </p>
              </div>

              <div className="mb-4">
                <Label>Amount in Naira (₦)</Label>
                <Input
                  type="number"
                  placeholder={suggestedAmount.toString()}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="mt-1"
                />
                {fundAmount && (
                  <p className="text-sm text-gray-600 mt-1">
                    ≈ ${(parseFloat(fundAmount) / NGN_RATE).toFixed(2)} USD
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleFundWallet}
                disabled={loading || !fundAmount}
                className="w-full bg-brand-gold hover:bg-yellow-500 text-brand-dark font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay with Paystack'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Fee Amount */}
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-brand-dark mb-1">₦{SIGNUP_FEE_NGN.toLocaleString()}</p>
                <p className="text-gray-500 text-sm">(≈ ${SIGNUP_FEE_USD})</p>
              </div>

              {/* Wallet Balance */}
              <div className={`rounded-lg p-4 mb-6 ${hasEnoughBalance ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Wallet Balance</span>
                  {fetchingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <span className={`font-bold ${hasEnoughBalance ? 'text-green-700' : 'text-yellow-700'}`}>
                      ₦{walletBalanceNGN.toLocaleString()}
                    </span>
                  )}
                </div>
                {!fetchingBalance && !hasEnoughBalance && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-700 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>You need ₦{suggestedAmount.toLocaleString()} more</span>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">What you get:</p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">Access to bid on all U.S. auctions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">Professional bidding assistance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">End-to-end shipping coordination</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {hasEnoughBalance ? (
                <Button
                  onClick={handlePayFromWallet}
                  disabled={loading || fetchingBalance}
                  className="w-full bg-brand-gold hover:bg-yellow-500 text-brand-dark font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay from Wallet'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setView('fund');
                    setFundAmount(suggestedAmount.toString());
                    setError('');
                  }}
                  disabled={fetchingBalance}
                  className="w-full bg-brand-gold hover:bg-yellow-500 text-brand-dark font-semibold"
                  size="lg"
                >
                  Fund Wallet
                </Button>
              )}

              <p className="text-xs text-gray-400 text-center mt-4">
                Funds are securely stored in your AutoBridge wallet
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
