'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Loader2,
  AlertCircle,
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
  auctionDate: string | null;
  bidId: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
}

interface CustomerGroup {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  requests: BidRequest[];
  totalBids: number;
  pendingCount: number;
  wonCount: number;
}

const REQUEST_STATUSES = ['pending', 'won', 'lost', 'outbidded', 'rejected', 'withdrawn'];

export default function AdminBidRequestsPage() {
  const [requests, setRequests] = useState<BidRequest[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    // Group requests by customer
    const groups = new Map<string, CustomerGroup>();

    requests.forEach((req) => {
      if (!groups.has(req.userId)) {
        groups.set(req.userId, {
          userId: req.userId,
          firstName: req.userFirstName,
          lastName: req.userLastName,
          email: req.userEmail,
          phone: req.userPhone,
          requests: [],
          totalBids: 0,
          pendingCount: 0,
          wonCount: 0,
        });
      }

      const group = groups.get(req.userId)!;
      group.requests.push(req);
      group.totalBids++;
      if (req.status === 'pending') group.pendingCount++;
      if (req.status === 'won') group.wonCount++;
    });

    // Sort groups by most recent activity
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      const aDate = new Date(a.requests[0]?.createdAt || 0).getTime();
      const bDate = new Date(b.requests[0]?.createdAt || 0).getTime();
      return bDate - aDate;
    });

    setCustomerGroups(sortedGroups);
  }, [requests]);

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

  const toggleCustomer = (userId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedCustomers(newExpanded);
  };

  const expandAll = () => {
    setExpandedCustomers(new Set(customerGroups.map(g => g.userId)));
  };

  const collapseAll = () => {
    setExpandedCustomers(new Set());
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      setUpdatingId(requestId);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/bid-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setRequests(prev => prev.map(req =>
          req.id === requestId ? { ...req, status: newStatus } : req
        ));
        // Refresh to get updated stats
        fetchRequests();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      won: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      lost: { color: 'bg-orange-100 text-orange-800', icon: <XCircle className="h-3 w-3" /> },
      outbidded: { color: 'bg-purple-100 text-purple-800', icon: <AlertCircle className="h-3 w-3" /> },
      rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      withdrawn: { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null };

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status?.replace('_', ' ') || 'Unknown'}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {REQUEST_STATUSES.map((status) => (
          <Card
            key={status}
            className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === status ? 'ring-2 ring-brand-dark' : ''}`}
            onClick={() => {
              setStatusFilter(statusFilter === status ? 'all' : status);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats[status] || 0}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{status.replace('_', ' ')}</p>
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
                  placeholder="Search by customer name, email, VIN, or lot number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customers ({customerGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
            </div>
          ) : customerGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bid requests found</div>
          ) : (
            <div className="space-y-4">
              {customerGroups.map((customer) => (
                <div key={customer.userId} className="border rounded-lg overflow-hidden">
                  {/* Customer Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleCustomer(customer.userId)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-brand-dark text-white flex items-center justify-center font-semibold text-sm">
                        {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{customer.firstName} {customer.lastName}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">{customer.totalBids} bid{customer.totalBids !== 1 ? 's' : ''}</Badge>
                        {customer.pendingCount > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">{customer.pendingCount} pending</Badge>
                        )}
                        {customer.wonCount > 0 && (
                          <Badge className="bg-green-100 text-green-800">{customer.wonCount} won</Badge>
                        )}
                      </div>
                      <Link href={`/admin/messages?userId=${customer.userId}`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" title="Message customer">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </Link>
                      {expandedCustomers.has(customer.userId) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Customer Bids */}
                  {expandedCustomers.has(customer.userId) && (
                    <div className="border-t overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 text-xs">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Vehicle</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Auction</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Max Bid</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Auction Date</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customer.requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                {req.vehicleYear ? (
                                  <div>
                                    <p className="text-sm font-medium">
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
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="uppercase text-xs">
                                    {req.auctionSource}
                                  </Badge>
                                  <a
                                    href={req.auctionLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                  >
                                    View <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                                {req.lotNumber && (
                                  <p className="text-xs text-gray-500 mt-1">Lot: {req.lotNumber}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-green-600">{formatCurrency(req.maxBidAmount)}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {updatingId === req.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <select
                                      value={req.status}
                                      onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                      className={`text-xs border rounded px-2 py-1 font-medium capitalize ${
                                        req.status === 'pending' ? 'bg-yellow-50 border-yellow-300' :
                                        req.status === 'won' ? 'bg-green-50 border-green-300' :
                                        req.status === 'lost' ? 'bg-orange-50 border-orange-300' :
                                        req.status === 'outbidded' ? 'bg-purple-50 border-purple-300' :
                                        req.status === 'rejected' ? 'bg-red-50 border-red-300' :
                                        'bg-gray-50 border-gray-300'
                                      }`}
                                    >
                                      {REQUEST_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                          {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {formatDate(req.auctionDate)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {formatDate(req.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {customerGroups.length} customers with {requests.length} total requests
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
