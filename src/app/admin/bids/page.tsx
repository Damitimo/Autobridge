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
  Car,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface Bid {
  id: string;
  status: string;
  maxBidAmount: string;
  currentBidAmount: string | null;
  finalBidAmount: string | null;
  depositAmount: string | null;
  depositLocked: boolean;
  externalBidId: string | null;
  externalSource: string | null;
  externalStatus: string | null;
  wonAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  vehicleId: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin: string;
  lotNumber: string | null;
  auctionDate: string | null;
}

const BID_STATUSES = ['pending', 'won', 'lost', 'outbid'];

export default function AdminBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [finalBidAmount, setFinalBidAmount] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBids();
  }, [pagination.page, statusFilter]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/bids?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setBids(data.bids);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchBids();
  };

  const handleBidUpdate = async () => {
    if (!selectedBid || !newStatus) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');

      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'won' && finalBidAmount) {
        updateData.finalBidAmount = finalBidAmount;
      }

      const response = await fetch(`/api/admin/bids/${selectedBid.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setSelectedBid(null);
        setNewStatus('');
        setFinalBidAmount('');
        fetchBids();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Bid update error:', error);
      alert('An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      won: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      lost: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      outbid: { color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null };

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | null, currency = 'USD') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by VIN, email, lot number, or external bid ID..."
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
                {BID_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bids Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bids ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bids found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Bid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bids.map((bid) => (
                      <tr key={bid.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">
                              {bid.vehicleYear} {bid.vehicleMake} {bid.vehicleModel}
                            </p>
                            <p className="text-sm text-gray-500 font-mono">{bid.vehicleVin}</p>
                            {bid.lotNumber && (
                              <p className="text-xs text-gray-400">Lot: {bid.lotNumber}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm">{bid.userFirstName} {bid.userLastName}</p>
                          <p className="text-sm text-gray-500">{bid.userEmail}</p>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(bid.status)}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-green-600">{formatCurrency(bid.maxBidAmount)}</p>
                          {bid.currentBidAmount && (
                            <p className="text-xs text-gray-500">Current: {formatCurrency(bid.currentBidAmount)}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {bid.finalBidAmount ? (
                            <p className="font-medium">{formatCurrency(bid.finalBidAmount)}</p>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                          {bid.wonAt && (
                            <p className="text-xs text-gray-500">Won: {formatDate(bid.wonAt)}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {bid.depositAmount ? (
                            <div>
                              <p className="text-sm">{formatCurrency(bid.depositAmount)}</p>
                              <Badge className={bid.depositLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                {bid.depositLocked ? 'Locked' : 'Available'}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBid(bid);
                                setNewStatus(bid.status);
                                setFinalBidAmount(bid.finalBidAmount || '');
                                setShowModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Update
                            </Button>
                          </div>
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
                  {pagination.total} bids
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

      {/* Update Bid Modal */}
      {showModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Update Bid</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBid(null);
                    setNewStatus('');
                    setFinalBidAmount('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Vehicle Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-5 w-5 text-brand-dark" />
                    <span className="font-semibold">
                      {selectedBid.vehicleYear} {selectedBid.vehicleMake} {selectedBid.vehicleModel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{selectedBid.vehicleVin}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Customer: {selectedBid.userFirstName} {selectedBid.userLastName}
                  </p>
                  {selectedBid.lotNumber && (
                    <p className="text-sm text-gray-600">Lot: {selectedBid.lotNumber}</p>
                  )}
                </div>

                {/* Bid Amounts */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Bid Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Max Bid</p>
                      <p className="font-medium">{formatCurrency(selectedBid.maxBidAmount)}</p>
                    </div>
                    {selectedBid.currentBidAmount && (
                      <div>
                        <p className="text-gray-500">Current Bid</p>
                        <p className="font-medium">{formatCurrency(selectedBid.currentBidAmount)}</p>
                      </div>
                    )}
                    {selectedBid.depositAmount && (
                      <div>
                        <p className="text-gray-500">Deposit</p>
                        <p className="font-medium">{formatCurrency(selectedBid.depositAmount)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* External Info */}
                {(selectedBid.externalBidId || selectedBid.externalSource) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">External Auction Info</p>
                    {selectedBid.externalSource && (
                      <p className="text-sm text-blue-700">Source: {selectedBid.externalSource.toUpperCase()}</p>
                    )}
                    {selectedBid.externalBidId && (
                      <p className="text-sm text-blue-700">Bid ID: {selectedBid.externalBidId}</p>
                    )}
                    {selectedBid.externalStatus && (
                      <p className="text-sm text-blue-700">Status: {selectedBid.externalStatus}</p>
                    )}
                  </div>
                )}

                {/* Current Status */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Status</p>
                  {getStatusBadge(selectedBid.status)}
                </div>

                {/* New Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Update Status To</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {BID_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Final Bid Amount (shown when marking as won) */}
                {newStatus === 'won' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Final Bid Amount (USD)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter final winning amount"
                      value={finalBidAmount}
                      onChange={(e) => setFinalBidAmount(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A shipment will be automatically created when marked as won.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleBidUpdate}
                  disabled={updating || newStatus === selectedBid.status}
                >
                  {updating ? 'Updating...' : 'Update Bid'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
