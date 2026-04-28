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
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface BidRequest {
  id: string;
  auctionLink: string;
  auctionSource: string;
  maxBidAmount: string;
  notes: string | null;
  status: string;
  adminNotes: string | null;
  rejectionReason: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleVin: string | null;
  lotNumber: string | null;
  bidId: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
}

const REQUEST_STATUSES = ['pending', 'won', 'lost', 'rejected', 'withdrawn'];

export default function AdminBidRequestsPage() {
  const [requests, setRequests] = useState<BidRequest[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<BidRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState({
    year: '',
    make: '',
    model: '',
    vin: '',
    lotNumber: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/bid-requests?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests);
        setStats(data.stats || {});
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch bid requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchRequests();
  };

  const handleUpdate = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');

      const updateData: any = {
        status: newStatus,
        adminNotes,
      };

      if (newStatus === 'rejected') {
        updateData.rejectionReason = rejectionReason;
      }

      if (vehicleInfo.year) updateData.vehicleYear = parseInt(vehicleInfo.year);
      if (vehicleInfo.make) updateData.vehicleMake = vehicleInfo.make;
      if (vehicleInfo.model) updateData.vehicleModel = vehicleInfo.model;
      if (vehicleInfo.vin) updateData.vehicleVin = vehicleInfo.vin;
      if (vehicleInfo.lotNumber) updateData.lotNumber = vehicleInfo.lotNumber;

      const response = await fetch(`/api/admin/bid-requests/${selectedRequest.id}`, {
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
        setSelectedRequest(null);
        resetForm();
        fetchRequests();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setNewStatus('');
    setAdminNotes('');
    setRejectionReason('');
    setVehicleInfo({ year: '', make: '', model: '', vin: '', lotNumber: '' });
  };

  const openModal = (req: BidRequest) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setAdminNotes(req.adminNotes || '');
    setRejectionReason(req.rejectionReason || '');
    setVehicleInfo({
      year: req.vehicleYear?.toString() || '',
      make: req.vehicleMake || '',
      model: req.vehicleModel || '',
      vin: req.vehicleVin || '',
      lotNumber: req.lotNumber || '',
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      bid_placed: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3" /> },
      won: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      lost: { color: 'bg-orange-100 text-orange-800', icon: <XCircle className="h-3 w-3" /> },
      rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null };

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status.replace('_', ' ')}
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {REQUEST_STATUSES.map((status) => (
          <Card key={status} className="cursor-pointer hover:shadow-md" onClick={() => {
            setStatusFilter(status);
            setPagination({ ...pagination, page: 1 });
          }}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 capitalize">{status.replace('_', ' ')}</p>
                  <p className="text-2xl font-bold">{stats[status] || 0}</p>
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
                  placeholder="Search by email, URL, VIN, or lot number..."
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
                {REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bid Requests ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bid requests found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auction Link</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Info</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Bid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium">{req.userFirstName} {req.userLastName}</p>
                          <p className="text-sm text-gray-500">{req.userEmail}</p>
                          <p className="text-xs text-gray-400">{req.userPhone}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="uppercase text-xs">
                              {req.auctionSource}
                            </Badge>
                            <a
                              href={req.auctionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          {req.lotNumber && (
                            <p className="text-xs text-gray-500 mt-1">Lot: {req.lotNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {req.vehicleYear ? (
                            <div>
                              <p className="text-sm">
                                {req.vehicleYear} {req.vehicleMake} {req.vehicleModel}
                              </p>
                              {req.vehicleVin && (
                                <p className="text-xs text-gray-500 font-mono">{req.vehicleVin}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not extracted</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-green-600">{formatCurrency(req.maxBidAmount)}</p>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(req.status)}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/messages?userId=${req.userId}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-500 hover:text-brand-dark"
                                title="Message customer"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openModal(req)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Review
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
                  {pagination.total} requests
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

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Review Bid Request</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Customer</p>
                  <p className="text-sm">{selectedRequest.userFirstName} {selectedRequest.userLastName}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.userEmail}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.userPhone}</p>
                </div>

                {/* Auction Link */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Auction Link</p>
                  <div className="flex items-center gap-2">
                    <Badge className="uppercase">{selectedRequest.auctionSource}</Badge>
                    <a
                      href={selectedRequest.auctionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1 break-all"
                    >
                      {selectedRequest.auctionLink} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Max Bid:</span> {formatCurrency(selectedRequest.maxBidAmount)}
                  </p>
                  {selectedRequest.notes && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Customer Notes:</span> {selectedRequest.notes}
                    </p>
                  )}
                </div>

                {/* Vehicle Info (editable) */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-3">Vehicle Information (extract from link)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Year</label>
                      <Input
                        type="number"
                        value={vehicleInfo.year}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                        placeholder="2021"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Make</label>
                      <Input
                        value={vehicleInfo.make}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Model</label>
                      <Input
                        value={vehicleInfo.model}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                        placeholder="Camry"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Lot Number</label>
                      <Input
                        value={vehicleInfo.lotNumber}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, lotNumber: e.target.value })}
                        placeholder="12345678"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">VIN</label>
                      <Input
                        value={vehicleInfo.vin}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, vin: e.target.value })}
                        placeholder="1HGBH41JXMN109186"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium mb-1">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {REQUEST_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rejection Reason (shown when rejecting) */}
                {newStatus === 'rejected' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      rows={2}
                      placeholder="Explain why this request is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Notes (internal)</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows={2}
                    placeholder="Internal notes about this request..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={handleUpdate}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Update Request'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRequest(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
