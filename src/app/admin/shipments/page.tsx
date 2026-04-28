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
  Upload,
  FileText,
  Image,
  Loader2,
  Trash2,
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
  const [activeTab, setActiveTab] = useState<'status' | 'documents' | 'photos'>('status');
  const [documents, setDocuments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const fetchDocumentsAndPhotos = async (shipmentId: string) => {
    const token = localStorage.getItem('adminToken');

    // Fetch documents
    const docsResponse = await fetch(`/api/admin/shipments/${shipmentId}/documents`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const docsData = await docsResponse.json();
    if (docsData.success) {
      setDocuments(docsData.documents);
    }

    // Fetch photos
    const photosResponse = await fetch(`/api/admin/shipments/${shipmentId}/photos`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const photosData = await photosResponse.json();
    if (photosData.success) {
      setPhotos(photosData.photos);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShipment || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const documentType = (document.getElementById('documentType') as HTMLSelectElement)?.value;

    if (!documentType) {
      alert('Please select a document type');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch(`/api/admin/shipments/${selectedShipment.id}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setDocuments([...documents, data.document]);
        e.target.value = '';
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShipment || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const stage = (document.getElementById('photoStage') as HTMLSelectElement)?.value;
    const caption = (document.getElementById('photoCaption') as HTMLInputElement)?.value;

    if (!stage) {
      alert('Please select a photo stage');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stage', stage);
      if (caption) formData.append('caption', caption);

      const response = await fetch(`/api/admin/shipments/${selectedShipment.id}/photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setPhotos([...photos, data.photo]);
        e.target.value = '';
        const captionInput = document.getElementById('photoCaption') as HTMLInputElement;
        if (captionInput) captionInput.value = '';
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedShipment || !confirm('Delete this document?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/shipments/${selectedShipment.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setDocuments(documents.filter(d => d.id !== docId));
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedShipment || !confirm('Delete this photo?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/shipments/${selectedShipment.id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setPhotos(photos.filter(p => p.id !== photoId));
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  const openShipmentModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status);
    setActiveTab('status');
    setDocuments([]);
    setPhotos([]);
    setShowModal(true);
    fetchDocumentsAndPhotos(shipment.id);
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
        {status?.replace(/_/g, ' ') || 'Unknown'}
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
                              onClick={() => openShipmentModal(shipment)}
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

              {/* Vehicle Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
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

              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'status' ? 'border-b-2 border-brand-dark text-brand-dark' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('status')}
                >
                  Status
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'documents' ? 'border-b-2 border-brand-dark text-brand-dark' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('documents')}
                >
                  Documents ({documents.length})
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'photos' ? 'border-b-2 border-brand-dark text-brand-dark' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('photos')}
                >
                  Photos ({photos.length})
                </button>
              </div>

              {/* Status Tab */}
              {activeTab === 'status' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Status</p>
                    {getStatusBadge(selectedShipment.status)}
                  </div>

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
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  {/* Upload Form */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Upload Document
                    </h4>
                    <div className="space-y-3">
                      <select id="documentType" className="w-full border rounded-md px-3 py-2 text-sm">
                        <option value="">Select document type...</option>
                        <option value="bill_of_lading">Bill of Lading</option>
                        <option value="title">Title</option>
                        <option value="customs_declaration">Customs Declaration</option>
                        <option value="shipping_invoice">Shipping Invoice</option>
                        <option value="inspection_report">Inspection Report</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleDocumentUpload}
                          disabled={uploading}
                          className="text-sm"
                        />
                      </div>
                      {uploading && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No documents uploaded yet</p>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.fileName}</p>
                              <p className="text-xs text-gray-500 capitalize">{doc.documentType?.replace(/_/g, ' ') || 'Document'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  {/* Upload Form */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Image className="h-4 w-4" /> Upload Photo
                    </h4>
                    <div className="space-y-3">
                      <select id="photoStage" className="w-full border rounded-md px-3 py-2 text-sm">
                        <option value="">Select photo stage...</option>
                        <option value="auction">Auction Photos</option>
                        <option value="pickup">Pickup Photos</option>
                        <option value="us_port">US Port Photos</option>
                        <option value="loading">Loading Photos</option>
                        <option value="vessel">On Vessel</option>
                        <option value="nigeria_port">Nigeria Port</option>
                        <option value="delivery">Delivery Photos</option>
                      </select>
                      <Input
                        id="photoCaption"
                        type="text"
                        placeholder="Caption (optional)"
                        className="text-sm"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                        className="text-sm"
                      />
                      {uploading && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photos Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {photos.length === 0 ? (
                      <p className="col-span-2 text-sm text-gray-500 text-center py-4">No photos uploaded yet</p>
                    ) : (
                      photos.map((photo) => (
                        <div key={photo.id} className="relative group border rounded-lg overflow-hidden">
                          <img
                            src={photo.fileUrl}
                            alt={photo.caption || 'Shipment photo'}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={photo.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white text-gray-800 px-2 py-1 rounded text-xs"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-gray-500 capitalize">{photo.stage?.replace(/_/g, ' ') || 'Photo'}</p>
                            {photo.caption && <p className="text-xs truncate">{photo.caption}</p>}
                          </div>
                        </div>
                      ))
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
