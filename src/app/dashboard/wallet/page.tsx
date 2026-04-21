'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, ArrowUpRight, ArrowDownRight, Lock, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// Paystack types
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref: string;
        container?: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

interface WalletBalance {
  total: number;
  available: number;
  locked: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  usdAmount: string;
  status: string;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundCurrency, setFundCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paystackUrl, setPaystackUrl] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch balance
      const balanceRes = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const balanceData = await balanceRes.json();
      
      if (balanceData.success) {
        setBalance(balanceData.data);
      }
      
      // Fetch transactions
      const txRes = await fetch('/api/wallet/transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const txData = await txRes.json();
      
      if (txData.success) {
        setTransactions(txData.data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setFunding(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');

      const response = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(fundAmount),
          currency: fundCurrency,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (fundCurrency === 'NGN' && data.publicKey) {
          // Show Paystack in iframe
          setPaystackUrl(data.authorizationUrl);
          setFunding(false);

          // Listen for payment completion via polling
          const checkPayment = async () => {
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
              setSuccess('Payment successful! Your wallet has been funded.');
              setFundAmount('');
              setPaystackUrl('');
              fetchWalletData();
              setTimeout(() => {
                setShowFundModal(false);
                setSuccess('');
              }, 2000);
              return true;
            }
            return false;
          };

          // Poll for payment completion every 3 seconds
          const pollInterval = setInterval(async () => {
            const completed = await checkPayment();
            if (completed) {
              clearInterval(pollInterval);
            }
          }, 3000);

          // Stop polling after 5 minutes
          setTimeout(() => clearInterval(pollInterval), 300000);
        } else if (fundCurrency === 'USD') {
          // Show wire transfer instructions
          alert('Wire transfer instructions:\n\n' + JSON.stringify(data.instructions, null, 2));
          setShowFundModal(false);
          setFunding(false);
        }
      } else {
        setError(data.error || 'Failed to initiate payment');
        setFunding(false);
      }
    } catch (error) {
      console.error('Funding error:', error);
      setError('Failed to fund wallet');
      setFunding(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit') return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    if (type === 'bid_lock') return <Lock className="h-4 w-4 text-orange-600" />;
    if (type === 'bid_unlock') return <ArrowUpRight className="h-4 w-4 text-brand-dark" />;
    if (type === 'bid_forfeit') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  const getTransactionColor = (type: string) => {
    if (type === 'deposit') return 'text-green-600';
    if (type === 'bid_lock') return 'text-orange-600';
    if (type === 'bid_unlock') return 'text-brand-dark';
    if (type === 'bid_forfeit') return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your funds and view transaction history</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-brand-dark">
                    {formatCurrency(balance?.total || 0, 'USD')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ≈ ₦{((balance?.total || 0) * 1550).toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-12 w-12 text-brand-dark opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Available Balance */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(balance?.available || 0, 'USD')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Can be used for bids
                  </p>
                </div>
                <ArrowUpRight className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Locked Balance */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Locked (Deposits)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatCurrency(balance?.locked || 0, 'USD')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    In active bids
                  </p>
                </div>
                <Lock className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={() => setShowFundModal(true)}
                className="flex-1"
              >
                <Wallet className="mr-2 h-5 w-5" />
                Fund Wallet
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={fetchWalletData}
                className="flex-1"
              >
                Refresh Balance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent wallet transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No transactions yet</p>
                <p className="text-sm text-gray-500">Fund your wallet to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.type)}
                          <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className={getTransactionColor(tx.type)}>
                        <span className="font-semibold">
                          {tx.currency === 'USD' ? '$' : '₦'}{parseFloat(tx.amount).toLocaleString()}
                        </span>
                        {tx.currency !== 'USD' && (
                          <span className="text-xs text-gray-500 ml-1">
                            (${parseFloat(tx.usdAmount).toFixed(2)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(tx.createdAt, 'short')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fund Wallet Modal */}
      <Dialog open={showFundModal} onOpenChange={(open) => {
        setShowFundModal(open);
        if (!open) {
          setPaystackUrl('');
          setError('');
          setSuccess('');
        }
      }}>
        <DialogContent className={paystackUrl ? "sm:max-w-lg" : "sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
            <DialogDescription>
              {paystackUrl ? 'Complete your payment below' : 'Add money to your wallet to start bidding'}
            </DialogDescription>
          </DialogHeader>

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Paystack Iframe */}
          {paystackUrl && (
            <div className="relative">
              <iframe
                src={paystackUrl}
                className="w-full h-[500px] border-0 rounded-lg"
                title="Paystack Payment"
                allow="payment"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setPaystackUrl('')}
              >
                ← Back to amount
              </Button>
            </div>
          )}

          {/* Amount Entry Form */}
          {!paystackUrl && !success && (
            <div className="space-y-4">
              <div>
                <Label>Currency</Label>
                <Select
                  value={fundCurrency}
                  onValueChange={(value: 'NGN' | 'USD') => setFundCurrency(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder={fundCurrency === 'NGN' ? '100000' : '100'}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                />
                {fundCurrency === 'NGN' && fundAmount && (
                  <p className="text-sm text-gray-600 mt-1">
                    ≈ ${(parseFloat(fundAmount) / 1550).toFixed(2)} USD
                  </p>
                )}
              </div>

              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-primary-900 font-medium">
                  {fundCurrency === 'NGN' ? (
                    <>💳 Secure payment powered by Paystack</>
                  ) : (
                    <>🏦 Wire transfer instructions will be provided. Funds will be credited after verification.</>
                  )}
                </p>
              </div>

              <Button
                onClick={handleFundWallet}
                disabled={funding || !fundAmount}
                className="w-full"
                size="lg"
              >
                {funding ? 'Processing...' : `Continue to Payment`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
