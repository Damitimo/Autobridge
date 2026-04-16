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
  Ship,
  MapPin,
  Calendar,
} from 'lucide-react';

interface Shipment {
  id: string;
  status: string;
  shippingMethod: string | null;
  vesselName: string | null;
  bookingNumber: string | null;
  estimatedArrivalAt: string | null;
  createdAt: string;
  statusUpdatedAt: string | null;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin: string;
  bidAmount: string | null;
}

const SHIPMENT_STATUSES = [
  'auction_won',
  'payment_received',
  'pickup_scheduled',
  'in_transit_to_port',
  'at_us_port',
  'loaded_on_vessel',
  'vessel_departed',
  'vessel_in_transit',
  'vessel_arrived_nigeria',
  'customs_clearance',
  'customs_cleared',
  'ready_for_pickup',
  'delivered',
];

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, [pagination.page, statusFilter]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/shipments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setShipments(data.shipments);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchShipments();
  };

  const handleStatusUpdate = async () => {
    if (!selectedShipment || !newStatus) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/shipments/${selectedShipment.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          statusNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setSelectedShipment(null);
        setNewStatus('');
        setStatusNotes('');
        fetchShipments();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      auction_won: 'bg-blue-100 text-blue-800',
      payment_received: 'bg-green-100 text-green-800',
      pickup_scheduled: 'bg-purple-100 text-purple-800',
      in_transit_to_port: 'bg-yellow-100 text-yellow-800',
      at_us_port: 'bg-orange-100 text-orange-800',
      loaded_on_vessel: 'bg-cyan-100 text-cyan-800',
      vessel_departed: 'bg-indigo-100 text-indigo-800',
      vessel_in_transit: 'bg-blue-100 text-blue-800',
      vessel_arrived_nigeria: 'bg-teal-100 text-teal-800',
      customs_clearance: 'bg-amber-100 text-amber-800',
      customs_cleared: 'bg-lime-100 text-lime-800',
      ready_for_pickup: 'bg-emerald-100 text-emerald-800',
      delivered: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
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
                  placeholder="Search by VIN, email, or booking number..."
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
                {SHIPMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No shipments found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ETA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">
                              {shipment.vehicleYear} {shipment.vehicleMake} {shipment.vehicleModel}
                            </p>
                            <p className="text-sm text-gray-500 font-mono">{shipment.vehicleVin}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm">{shipment.userFirstName} {shipment.userLastName}</p>
                          <p className="text-sm text-gray-500">{shipment.userEmail}</p>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(shipment.status)}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm">{shipment.vesselName || '-'}</p>
                          <p className="text-sm text-gray-500">{shipment.bookingNumber || '-'}</p>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {formatDate(shipment.estimatedArrivalAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setNewStatus(shipment.status);
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
                  {pagination.total} shipments
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

      {/* Update Status Modal */}
      {showModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Update Shipment</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedShipment(null);
                    setNewStatus('');
                    setStatusNotes('');
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
                    <Ship className="h-5 w-5 text-brand-dark" />
                    <span className="font-semibold">
                      {selectedShipment.vehicleYear} {selectedShipment.vehicleMake} {selectedShipment.vehicleModel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{selectedShipment.vehicleVin}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Customer: {selectedShipment.userFirstName} {selectedShipment.userLastName}
                  </p>
                </div>

                {/* Current Status */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Status</p>
                  {getStatusBadge(selectedShipment.status)}
                </div>

                {/* New Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Update Status To</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {SHIPMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows={3}
                    placeholder="Add notes about this status update..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === selectedShipment.status}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
