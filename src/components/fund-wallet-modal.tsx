'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Wallet, CheckCircle, AlertCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requiredAmount: number;
  availableBalance: number;
  vehicleName?: string;
}

const NGN_RATE = 1550;

export default function FundWalletModal({
  isOpen,
  onClose,
  onSuccess,
  requiredAmount,
  availableBalance,
  vehicleName,
}: FundWalletModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(availableBalance);
  const [funded, setFunded] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [view, setView] = useState<'form' | 'paystack' | 'verifying' | 'success'>('form');
  const [paystackUrl, setPaystackUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const shortfall = Math.max(0, requiredAmount - walletBalance);
  const suggestedAmount = Math.ceil(shortfall * NGN_RATE / 1000) * 1000;

  useEffect(() => {
    if (isOpen) {
      setWalletBalance(availableBalance);
      setFunded(false);
      setError('');
      setFundAmount(suggestedAmount.toString());
      setView('form');
      setPaystackUrl('');
      setPaymentReference('');
      fetchUserEmail();
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, availableBalance, suggestedAmount]);

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

  const fetchWalletBalance = async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.data.available || 0);
        return data.data.available || 0;
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
    return walletBalance;
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
    // Poll every 3 seconds to check if payment was completed
    pollingRef.current = setInterval(async () => {
      const success = await verifyPayment(reference);
      if (success) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        setView('verifying');
        const newBalance = await fetchWalletBalance();
        if (newBalance >= requiredAmount) {
          setView('success');
          setFunded(true);
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 1500);
        } else {
          // Need more funds
          setFundAmount(Math.ceil((requiredAmount - newBalance) * NGN_RATE / 1000) * 1000 + '');
          setView('form');
          setError('');
        }
      }
    }, 3000);
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

  const handleBackToForm = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setView('form');
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
            {view === 'paystack' && (
              <button
                onClick={handleBackToForm}
                className="text-white/70 hover:text-white transition-colors mr-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-brand-dark" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {view === 'paystack' ? 'Complete Payment' : 'Fund Wallet to Bid'}
              </h2>
              <p className="text-white/70 text-xs">
                {view === 'paystack' ? 'Secure payment via Paystack' : 'Add funds to cover your bid'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={view === 'paystack' ? 'h-[calc(600px-72px)]' : 'p-6'}>
          {view === 'success' || funded ? (
            <div className="text-center py-6 px-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Wallet Funded!</h3>
              <p className="text-green-600">Submitting your bid request...</p>
            </div>
          ) : view === 'verifying' ? (
            <div className="text-center py-6 px-6">
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
          ) : (
            <>
              {vehicleName && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <span className="text-gray-500">Bidding on:</span>
                  <p className="font-semibold text-gray-900">{vehicleName}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Insufficient Balance</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your max bid amount:</span>
                    <span className="font-bold text-gray-900">${requiredAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your wallet balance:</span>
                    <span className="font-bold text-red-600">${walletBalance.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-600">Amount needed:</span>
                    <span className="font-bold text-yellow-700">${shortfall.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                <p>
                  <strong>Why fund upfront?</strong> Your bid amount is held in escrow to ensure you can pay if you win.
                  If you don&apos;t win, funds remain in your wallet.
                </p>
              </div>

              <div className="mb-4">
                <Label>Amount to Fund (₦)</Label>
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
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pay with Paystack
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Secure payment powered by Paystack
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
