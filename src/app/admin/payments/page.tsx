'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string | null;
  vehiclePrice: string | null;
  auctionFees: string | null;
  platformFee: string | null;
  shippingCost: string | null;
  customsDuty: string | null;
  otherFees: string | null;
  paidAt: string | null;
  createdAt: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  bidId: string | null;
  bidStatus: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleVin: string | null;
}

interface Stats {
  [key: string]: { count: number; total: number };
}

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partial'];
const PAYMENT_METHODS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
  crypto: 'Crypto',
};

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/payments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setStats(data.stats || {});
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchPayments();
  };

  const handleStatusUpdate = async () => {
    if (!selectedTransaction || !newStatus) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/payments/${selectedTransaction.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: newStatus,
          notes: verificationNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setSelectedTransaction(null);
        setNewStatus('');
        setVerificationNotes('');
        fetchPayments();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Payment update error:', error);
      alert('An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      paid: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      failed: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      refunded: { color: 'bg-purple-100 text-purple-800', icon: <RefreshCw className="h-3 w-3" /> },
      partial: { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null };

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | null, currency = 'NGN') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {PAYMENT_STATUSES.map((status) => (
          <Card key={status}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 capitalize">{status}</p>
                  <p className="text-2xl font-bold">{stats[status]?.count || 0}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(String(stats[status]?.total || 0))}
                  </p>
                </div>
                {getStatusBadge(status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email, reference, or VIN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No payments found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <p className="text-sm font-mono">{txn.paymentReference || txn.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm">{txn.userFirstName} {txn.userLastName}</p>
                          <p className="text-sm text-gray-500">{txn.userEmail}</p>
                        </td>
                        <td className="px-4 py-4">
                          {txn.vehicleYear ? (
                            <div>
                              <p className="text-sm">
                                {txn.vehicleYear} {txn.vehicleMake} {txn.vehicleModel}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">{txn.vehicleVin}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-green-600">
                            {formatCurrency(txn.amount, txn.currency)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline">
                            {PAYMENT_METHODS[txn.paymentMethod] || txn.paymentMethod}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(txn.paymentStatus)}</td>
                        <td className="px-4 py-4 text-sm">
                          {txn.paidAt ? formatDate(txn.paidAt) : formatDate(txn.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransaction(txn);
                              setNewStatus(txn.paymentStatus);
                              setShowModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} payments
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Payment Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTransaction(null);
                    setNewStatus('');
                    setVerificationNotes('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Amount Summary */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Total Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-brand-dark" />
                    <span className="font-semibold">Payment Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Reference</p>
                      <p className="font-mono">{selectedTransaction.paymentReference || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Method</p>
                      <p>{PAYMENT_METHODS[selectedTransaction.paymentMethod]}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p>{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Paid At</p>
                      <p>{selectedTransaction.paidAt ? formatDate(selectedTransaction.paidAt) : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                {(selectedTransaction.vehiclePrice || selectedTransaction.platformFee) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-3">Cost Breakdown</p>
                    <div className="space-y-2 text-sm">
                      {selectedTransaction.vehiclePrice && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vehicle Price</span>
                          <span>{formatCurrency(selectedTransaction.vehiclePrice, 'USD')}</span>
                        </div>
                      )}
                      {selectedTransaction.auctionFees && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Auction Fees</span>
                          <span>{formatCurrency(selectedTransaction.auctionFees, 'USD')}</span>
                        </div>
                      )}
                      {selectedTransaction.platformFee && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Platform Fee</span>
                          <span>{formatCurrency(selectedTransaction.platformFee, 'USD')}</span>
                        </div>
                      )}
                      {selectedTransaction.shippingCost && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shipping</span>
                          <span>{formatCurrency(selectedTransaction.shippingCost, 'USD')}</span>
                        </div>
                      )}
                      {selectedTransaction.customsDuty && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Customs Duty</span>
                          <span>{formatCurrency(selectedTransaction.customsDuty, 'NGN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Customer</p>
                  <p className="text-sm">{selectedTransaction.userFirstName} {selectedTransaction.userLastName}</p>
                  <p className="text-sm text-gray-500">{selectedTransaction.userEmail}</p>
                </div>

                {/* Vehicle Info */}
                {selectedTransaction.vehicleYear && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">Vehicle</p>
                    <p className="text-sm">
                      {selectedTransaction.vehicleYear} {selectedTransaction.vehicleMake} {selectedTransaction.vehicleModel}
                    </p>
                    <p className="text-sm text-gray-500 font-mono">{selectedTransaction.vehicleVin}</p>
                  </div>
                )}

                {/* Current Status */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Status</p>
                  {getStatusBadge(selectedTransaction.paymentStatus)}
                </div>

                {/* Update Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Update Status To</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  {newStatus === 'paid' && selectedTransaction.paymentStatus !== 'paid' && (
                    <p className="text-xs text-green-600 mt-1">
                      Marking as paid will update the shipment status to &quot;payment_received&quot;.
                    </p>
                  )}
                </div>

                {/* Verification Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Verification Notes</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows={3}
                    placeholder="Add notes about this payment verification..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === selectedTransaction.paymentStatus}
                >
                  {updating ? 'Updating...' : 'Update Payment Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
