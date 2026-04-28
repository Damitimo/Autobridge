'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Loader2,
  User,
  Car,
  Calendar,
} from 'lucide-react';

interface Invoice {
  invoice: {
    id: string;
    userId: string;
    bidId?: string;
    shipmentId?: string;
    type: string;
    amount: string;
    currency: string;
    ngnEquivalent?: string;
    status: string;
    dueDate?: string;
    paidAt?: string;
    lineItems?: { description: string; amount: number; currency: string }[];
    description?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  vehicle?: {
    year: number;
    make: string;
    model: string;
    vin: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalAmount: number;
  paidAmount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  signup_fee: 'Signup Fee',
  car_purchase: 'Car Purchase',
  towing: 'Towing',
  shipping: 'Shipping',
  relisting_fee: 'Relisting Fee',
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, statusFilter, typeFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/invoices?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setInvoices(data.invoices);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchInvoices();
  };

  const openInvoiceModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setAdminNotes(invoice.invoice.notes || '');
    setShowModal(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedInvoice) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/invoices/${selectedInvoice.invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Invoice update error:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      signup_fee: 'bg-purple-100 text-purple-800',
      car_purchase: 'bg-blue-100 text-blue-800',
      towing: 'bg-orange-100 text-orange-800',
      shipping: 'bg-indigo-100 text-indigo-800',
      relisting_fee: 'bg-pink-100 text-pink-800',
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {TYPE_LABELS[type] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-brand-dark">
                    ${stats.paidAmount.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-brand-gold" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user or invoice ID..."
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
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="signup_fee">Signup Fee</option>
                <option value="car_purchase">Car Purchase</option>
                <option value="towing">Towing</option>
                <option value="shipping">Shipping</option>
                <option value="relisting_fee">Relisting Fee</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No invoices found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((item) => (
                      <tr key={item.invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-mono text-sm">#{item.invoice.id.slice(-8)}</p>
                            {item.vehicle && (
                              <p className="text-xs text-gray-500">
                                {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-sm">
                            {item.user.firstName} {item.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{item.user.email}</p>
                        </td>
                        <td className="px-4 py-4">{getTypeBadge(item.invoice.type)}</td>
                        <td className="px-4 py-4">
                          <p className="font-bold">
                            ${parseFloat(item.invoice.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{item.invoice.currency}</p>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(item.invoice.status)}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {new Date(item.invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInvoiceModal(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
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
                  {pagination.total} invoices
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
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
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

      {/* Invoice Detail Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Invoice Details</h2>
                <p className="text-sm text-gray-500 font-mono">#{selectedInvoice.invoice.id.slice(-8)}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status & Type */}
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedInvoice.invoice.status)}
                {getTypeBadge(selectedInvoice.invoice.type)}
              </div>

              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-3xl font-bold text-brand-dark">
                  ${parseFloat(selectedInvoice.invoice.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{selectedInvoice.invoice.currency}</p>
              </div>

              {/* User Info */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Customer</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{selectedInvoice.user.firstName} {selectedInvoice.user.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedInvoice.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              {selectedInvoice.vehicle && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Vehicle</h3>
                  </div>
                  <p className="font-medium">
                    {selectedInvoice.vehicle.year} {selectedInvoice.vehicle.make} {selectedInvoice.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">VIN: {selectedInvoice.vehicle.vin}</p>
                </div>
              )}

              {/* Line Items */}
              {selectedInvoice.invoice.lineItems && selectedInvoice.invoice.lineItems.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Line Items</h3>
                  <div className="space-y-2">
                    {selectedInvoice.invoice.lineItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span className="font-medium">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{new Date(selectedInvoice.invoice.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedInvoice.invoice.dueDate && (
                  <div>
                    <p className="text-gray-500">Due Date</p>
                    <p className="font-medium">{new Date(selectedInvoice.invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedInvoice.invoice.paidAt && (
                  <div>
                    <p className="text-gray-500">Paid At</p>
                    <p className="font-medium text-green-600">{new Date(selectedInvoice.invoice.paidAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedInvoice.invoice.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm">{selectedInvoice.invoice.description}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Admin Notes</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm"
                  rows={3}
                  placeholder="Add notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {/* Status Actions */}
              {selectedInvoice.invoice.status !== 'paid' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedInvoice.invoice.status !== 'pending' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('pending')}
                        disabled={actionLoading}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Mark Pending
                      </Button>
                    )}
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus('paid')}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Paid
                    </Button>
                    {selectedInvoice.invoice.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
