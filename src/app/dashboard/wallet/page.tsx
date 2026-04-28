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
import {
  Wallet, ArrowUpRight, ArrowDownRight, Lock, DollarSign, AlertCircle, CheckCircle,
  Loader2, CreditCard, Building2, Copy, MessageCircle, Calendar, Filter, X,
  Upload, Send
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

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

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Payment method configurations
const WIRE_TRANSFER_DETAILS = {
  bankName: 'Chase Bank',
  accountName: 'AutoBridge Import LLC',
  accountNumber: '000000000000',
  routingNumber: '000000000',
  swiftCode: 'CHASUS33',
  address: '270 Park Avenue, New York, NY 10017',
};

const ZELLE_DETAILS = {
  email: 'payments@autobridge.ng',
  phone: '+1 (xxx) xxx-xxxx',
  accountName: 'AutoBridge Import LLC',
};

const SUPPORT_WHATSAPP = '+2348123456789';
const SUPPORT_EMAIL = 'payments@autobridge.ng';

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundCurrency, setFundCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [usdPaymentMethod, setUsdPaymentMethod] = useState<'wire' | 'zelle' | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paystackUrl, setPaystackUrl] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Date filter state
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchWalletData();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, dateFrom, dateTo, typeFilter]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.user) {
        setUserInfo(data.user);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const balanceRes = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const balanceData = await balanceRes.json();

      if (balanceData.success) {
        setBalance(balanceData.data);
      }

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

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tx => new Date(tx.createdAt) <= toDate);
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
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
          setPaystackUrl(data.authorizationUrl);
          setFunding(false);
          window.open(data.authorizationUrl, '_blank');

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

          const pollInterval = setInterval(async () => {
            const completed = await checkPayment();
            if (completed) {
              clearInterval(pollInterval);
            }
          }, 3000);

          setTimeout(() => clearInterval(pollInterval), 300000);
        } else if (fundCurrency === 'USD') {
          // USD flow - show payment method selection
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit') return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    if (type === 'bid_lock') return <Lock className="h-4 w-4 text-orange-600" />;
    if (type === 'bid_unlock') return <ArrowUpRight className="h-4 w-4 text-brand-dark" />;
    if (type === 'bid_forfeit') return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (type === 'vin_check') return <DollarSign className="h-4 w-4 text-purple-600" />;
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  const getTransactionColor = (type: string) => {
    if (type === 'deposit') return 'text-green-600';
    if (type === 'bid_lock') return 'text-orange-600';
    if (type === 'bid_unlock') return 'text-brand-dark';
    if (type === 'bid_forfeit') return 'text-red-600';
    return 'text-gray-600';
  };

  const resetFundModal = () => {
    setFundCurrency('NGN');
    setUsdPaymentMethod(null);
    setFundAmount('');
    setError('');
    setSuccess('');
    setPaystackUrl('');
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
          <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-brand-dark">
                    {formatCurrency(balance?.available || 0, 'USD')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ≈ ₦{((balance?.available || 0) * 1550).toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-12 w-12 text-brand-dark opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-700">
                    {formatCurrency(balance?.total || 0, 'USD')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Available + Locked</p>
                </div>
                <ArrowUpRight className="h-12 w-12 text-gray-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-sm text-gray-500 mt-1">In active bids</p>
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
                onClick={() => {
                  resetFundModal();
                  setShowFundModal(true);
                }}
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent wallet transactions</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDateFilter(!showDateFilter)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Date Filter */}
            {showDateFilter && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">From Date</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To Date</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Transaction Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="deposit">Deposits</SelectItem>
                        <SelectItem value="bid_lock">Bid Locks</SelectItem>
                        <SelectItem value="bid_unlock">Bid Unlocks</SelectItem>
                        <SelectItem value="payment">Payments</SelectItem>
                        <SelectItem value="vin_check">VIN Checks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
                {(dateFrom || dateTo || typeFilter !== 'all') && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
                </p>
                <p className="text-sm text-gray-500">
                  {transactions.length === 0 ? 'Fund your wallet to get started' : 'Try adjusting your filter criteria'}
                </p>
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
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.type)}
                          <span className="capitalize">{tx.type?.replace('_', ' ') || 'Transaction'}</span>
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
        if (!open) resetFundModal();
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
            <DialogDescription>
              {usdPaymentMethod
                ? `Complete your ${usdPaymentMethod === 'wire' ? 'Wire Transfer' : 'Zelle'} payment`
                : 'Add money to your wallet to start bidding'
              }
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

          {/* Paystack loading state */}
          {paystackUrl && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
              <p className="text-gray-600 mb-4">
                A new window has opened for payment. Complete the payment there.
              </p>
              <p className="text-sm text-gray-500 mb-4">Waiting for confirmation...</p>
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
                  onClick={() => setPaystackUrl('')}
                >
                  ← Cancel and go back
                </Button>
              </div>
            </div>
          )}

          {/* USD Payment Instructions */}
          {fundCurrency === 'USD' && usdPaymentMethod && !paystackUrl && !success && (
            <div className="space-y-4">
              {/* Customer Reference Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Important: Payment Reference</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  When making your transfer, please include your Customer ID in the payment reference/memo:
                </p>
                <div className="flex items-center gap-2 bg-white rounded p-2 border">
                  <code className="flex-1 font-mono text-sm">AB-{userInfo?.id?.slice(0, 8).toUpperCase() || 'XXXXXXXX'}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`AB-${userInfo?.id?.slice(0, 8).toUpperCase()}`, 'customerId')}
                  >
                    {copied === 'customerId' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Wire Transfer Details */}
              {usdPaymentMethod === 'wire' && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Wire Transfer Details
                  </h4>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {[
                      { label: 'Bank Name', value: WIRE_TRANSFER_DETAILS.bankName },
                      { label: 'Account Name', value: WIRE_TRANSFER_DETAILS.accountName },
                      { label: 'Account Number', value: WIRE_TRANSFER_DETAILS.accountNumber },
                      { label: 'Routing Number', value: WIRE_TRANSFER_DETAILS.routingNumber },
                      { label: 'SWIFT Code', value: WIRE_TRANSFER_DETAILS.swiftCode },
                      { label: 'Bank Address', value: WIRE_TRANSFER_DETAILS.address },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className="font-medium">{item.value}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.value, item.label)}
                        >
                          {copied === item.label ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zelle Details */}
              {usdPaymentMethod === 'zelle' && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Zelle Payment Details
                  </h4>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {[
                      { label: 'Recipient Name', value: ZELLE_DETAILS.accountName },
                      { label: 'Zelle Email', value: ZELLE_DETAILS.email },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className="font-medium">{item.value}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.value, item.label)}
                        >
                          {copied === item.label ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount to Send */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Amount to Send:</strong> ${parseFloat(fundAmount || '0').toLocaleString()} USD
                </p>
              </div>

              {/* Send Receipt Instructions */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  After Making Payment
                </h4>
                <p className="text-sm text-green-700">
                  Send your payment receipt/confirmation to us via:
                </p>
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=Hi, I just made a USD ${usdPaymentMethod === 'wire' ? 'Wire Transfer' : 'Zelle'} payment of $${fundAmount}. My Customer ID is AB-${userInfo?.id?.slice(0, 8).toUpperCase()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send via WhatsApp ({SUPPORT_WHATSAPP})
                  </a>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=USD Payment Confirmation - AB-${userInfo?.id?.slice(0, 8).toUpperCase()}&body=Hi, I just made a USD ${usdPaymentMethod === 'wire' ? 'Wire Transfer' : 'Zelle'} payment of $${fundAmount}. My Customer ID is AB-${userInfo?.id?.slice(0, 8).toUpperCase()}. Please find the payment receipt attached.`}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full justify-center"
                  >
                    <DollarSign className="h-4 w-4" />
                    Send via Email ({SUPPORT_EMAIL})
                  </a>
                </div>
              </div>

              {/* Turnaround Time */}
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">
                  <strong>Processing Time:</strong> Your wallet will be credited within <strong>24-48 hours</strong> after we confirm your payment.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => setUsdPaymentMethod(null)}
                className="w-full"
              >
                ← Choose Different Method
              </Button>
            </div>
          )}

          {/* Currency & Amount Selection */}
          {!paystackUrl && !success && (!usdPaymentMethod || fundCurrency === 'NGN') && (
            <div className="space-y-4">
              <div>
                <Label>Currency</Label>
                <Select
                  value={fundCurrency}
                  onValueChange={(value: 'NGN' | 'USD') => {
                    setFundCurrency(value);
                    setUsdPaymentMethod(null);
                  }}
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

              {/* NGN Payment - Paystack */}
              {fundCurrency === 'NGN' && (
                <>
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <p className="text-sm text-primary-900 font-medium">
                      💳 Secure payment powered by Paystack
                    </p>
                  </div>

                  <Button
                    onClick={handleFundWallet}
                    disabled={funding || !fundAmount}
                    className="w-full"
                    size="lg"
                  >
                    {funding ? 'Processing...' : 'Continue to Payment'}
                  </Button>
                </>
              )}

              {/* USD Payment Method Selection */}
              {fundCurrency === 'USD' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">
                      🏦 Choose your preferred payment method below
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setUsdPaymentMethod('wire')}
                      disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                      className="p-4 border-2 rounded-lg hover:border-brand-dark hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <p className="font-semibold">Wire Transfer</p>
                      <p className="text-xs text-gray-500">Bank transfer</p>
                    </button>
                    <button
                      onClick={() => setUsdPaymentMethod('zelle')}
                      disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                      className="p-4 border-2 rounded-lg hover:border-brand-dark hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <p className="font-semibold">Zelle</p>
                      <p className="text-xs text-gray-500">Instant transfer</p>
                    </button>
                  </div>

                  {(!fundAmount || parseFloat(fundAmount) <= 0) && (
                    <p className="text-sm text-gray-500 text-center">
                      Enter an amount to see payment options
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
