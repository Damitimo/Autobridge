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

const SIGNUP_FEE_USD = 67; // ~₦100,000 at current rate
const NGN_RATE = 1550;

export default function SignupFeeModal({ isOpen, onClose, onSuccess }: SignupFeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [paid, setPaid] = useState(false);

  // Fund wallet states
  const [view, setView] = useState<'main' | 'fund'>('main');
  const [fundAmount, setFundAmount] = useState('');
  const [paystackUrl, setPaystackUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
      setView('main');
      setPaid(false);
      setPaystackUrl('');
      setError('');
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    setFetchingBalance(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        setLoading(false);
        // Call onSuccess after showing success message
        setTimeout(() => {
          onClose();
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        setError(data.error || 'Payment failed');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
        body: JSON.stringify({
          amount: amount,
          currency: 'NGN',
        }),
      });

      const data = await response.json();

      if (data.success && data.authorizationUrl) {
        setPaystackUrl(data.authorizationUrl);
        setPaymentReference(data.reference);
        setLoading(false);

        // Open Paystack in new window
        window.open(data.authorizationUrl, '_blank');

        // Start polling for payment verification
        pollIntervalRef.current = setInterval(async () => {
          try {
            const verifyRes = await fetch('/api/wallet/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ reference: data.reference }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
              setPaystackUrl('');
              await fetchWalletBalance();
              setView('main');
              setFundAmount('');
            }
          } catch (err) {
            console.error('Verification check failed:', err);
          }
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        }, 300000);
      } else {
        setError(data.error || 'Failed to initialize payment');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasEnoughBalance = walletBalance >= SIGNUP_FEE_USD;
  const shortfall = SIGNUP_FEE_USD - walletBalance;
  const suggestedAmount = Math.ceil(shortfall * NGN_RATE / 1000) * 1000; // Round up to nearest 1000 NGN

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full overflow-hidden ${paystackUrl ? 'max-w-lg' : 'max-w-md'}`}>
        {/* Header */}
        <div className="bg-brand-dark text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6 text-brand-dark" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {view === 'fund' ? 'Fund Wallet' : 'Signup Fee Required'}
              </h2>
              <p className="text-white/70 text-sm">
                {view === 'fund' ? 'Add money via Paystack' : 'One-time payment to start bidding'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success State */}
          {paid ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Signup Fee Paid!</h3>
              <p className="text-green-600">You can now place bids on vehicles.</p>
            </div>
          ) : view === 'fund' ? (
            /* Fund Wallet View */
            <>
              {paystackUrl ? (
                /* Paystack opened in new window */
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
                  <p className="text-gray-600 mb-4">
                    A new window has opened for payment. Complete the payment there.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Waiting for confirmation...
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(paystackUrl, '_blank')}
                      className="w-full"
                    >
                      Reopen Payment Window
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPaystackUrl('');
                        if (pollIntervalRef.current) {
                          clearInterval(pollIntervalRef.current);
                        }
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Cancel and go back
                    </Button>
                  </div>
                </div>
              ) : (
                /* Amount entry */
                <div className="space-y-4">
                  <button
                    onClick={() => setView('main')}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </button>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <p className="text-yellow-800">
                      You need <strong>${shortfall.toFixed(2)}</strong> more (≈ ₦{suggestedAmount.toLocaleString()}) for the signup fee.
                    </p>
                  </div>

                  <div>
                    <Label>Amount in Naira (₦)</Label>
                    <Input
                      type="number"
                      placeholder={suggestedAmount.toString()}
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                    />
                    {fundAmount && (
                      <p className="text-sm text-gray-600 mt-1">
                        ≈ ${(parseFloat(fundAmount) / NGN_RATE).toFixed(2)} USD
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
                </div>
              )}
            </>
          ) : (
            /* Main View */
            <>
              {/* Fee Amount */}
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-brand-dark mb-1">${SIGNUP_FEE_USD}</p>
                <p className="text-gray-500 text-sm">(≈ ₦{(SIGNUP_FEE_USD * NGN_RATE).toLocaleString()})</p>
              </div>

              {/* Wallet Balance */}
              <div className={`rounded-lg p-4 mb-6 ${hasEnoughBalance ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Wallet Balance</span>
                  {fetchingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <span className={`font-bold ${hasEnoughBalance ? 'text-green-700' : 'text-yellow-700'}`}>
                      ${walletBalance.toFixed(2)}
                    </span>
                  )}
                </div>
                {!fetchingBalance && !hasEnoughBalance && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-700 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>You need ${shortfall.toFixed(2)} more</span>
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

              {/* Action Buttons */}
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
