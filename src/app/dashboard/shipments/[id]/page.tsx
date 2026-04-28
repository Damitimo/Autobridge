'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { MessageCircle, Mail, FileText, Image, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ShipmentPhoto {
  id: string;
  stage: string;
  fileUrl: string;
  caption: string | null;
  createdAt: string;
}

interface ShipmentDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

interface Shipment {
  shipment: {
    id: string;
    status: string;
    pickupScheduledAt?: Date | string;
    arrivedAtWarehouseAt?: Date | string;
    departedAt?: Date | string;
    arrivedAt?: Date | string;
    deliveredAt?: Date | string;
    trackingHistory?: Array<{
      status: string;
      location: string;
      timestamp: string;
      notes?: string;
    }>;
    vesselName?: string;
    estimatedArrivalAt?: Date | string;
  };
  vehicle: {
    year: number;
    make: string;
    model: string;
    vin: string;
    images?: string[];
  };
  bid: {
    finalBidAmount?: string;
  };
}

const PHOTO_STAGES: Record<string, string> = {
  auction: 'Auction Photos',
  pickup: 'Pickup',
  us_port: 'US Port',
  loading: 'Loading',
  vessel: 'On Vessel',
  nigeria_port: 'Nigeria Port',
  delivery: 'Delivery',
};

const DOC_TYPES: Record<string, string> = {
  bill_of_lading: 'Bill of Lading',
  title: 'Title',
  customs_declaration: 'Customs Declaration',
  shipping_invoice: 'Shipping Invoice',
  inspection_report: 'Inspection Report',
  other: 'Other Document',
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [photos, setPhotos] = useState<ShipmentPhoto[]>([]);
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'progress' | 'photos' | 'documents'>('progress');

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchShipment(token);
    fetchMedia(token);
  }, [params.id]);

  const fetchShipment = async (token: string) => {
    try {
      const response = await fetch(`/api/shipments/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setShipment(data.data);
      }
    } catch (error) {
      console.error('Error fetching shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async (token: string) => {
    try {
      const response = await fetch(`/api/shipments/${params.id}/media`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPhotos(data.data.photos || []);
        setDocuments(data.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mb-4"></div>
          <p className="text-gray-600">Loading shipment details...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-xl text-gray-600">Shipment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusSteps = [
    { key: 'auction_won', label: 'Auction Won', icon: '🎉' },
    { key: 'payment_received', label: 'Payment Received', icon: '💳' },
    { key: 'pickup_scheduled', label: 'Pickup Scheduled', icon: '📅' },
    { key: 'in_transit_to_port', label: 'In Transit to Port', icon: '🚛' },
    { key: 'at_us_port', label: 'At U.S. Port', icon: '🏢' },
    { key: 'vessel_departed', label: 'Vessel Departed', icon: '🚢' },
    { key: 'vessel_in_transit', label: 'Ocean Transit', icon: '🌊' },
    { key: 'vessel_arrived_nigeria', label: 'Arrived Nigeria', icon: '🇳🇬' },
    { key: 'customs_clearance', label: 'Customs Clearance', icon: '📋' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: '✅' },
    { key: 'delivered', label: 'Delivered', icon: '🎊' },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === shipment.shipment.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {shipment.vehicle.images && shipment.vehicle.images[0] && (
                <img
                  src={shipment.vehicle.images[0]}
                  alt="Vehicle"
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {shipment.vehicle.year} {shipment.vehicle.make} {shipment.vehicle.model}
                </h1>
                <p className="text-sm text-gray-600">VIN: {shipment.vehicle.vin}</p>
                {shipment.bid.finalBidAmount && (
                  <p className="text-lg font-semibold text-brand-dark mt-2">
                    Purchase Price: ${parseFloat(shipment.bid.finalBidAmount).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        isCompleted
                          ? isCurrent
                            ? 'bg-brand-dark text-white'
                            : 'bg-green-100'
                          : 'bg-gray-200'
                      }`}
                    >
                      {isCompleted && !isCurrent ? '✓' : step.icon}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          isCompleted ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-brand-dark">Current Status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tracking History */}
        {shipment.shipment.trackingHistory && shipment.shipment.trackingHistory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tracking History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipment.shipment.trackingHistory.map((event, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="text-sm text-gray-600 w-32">
                      {formatDate(event.timestamp, 'long')}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold capitalize">
                        {event.status?.replace(/_/g, ' ') || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                      {event.notes && (
                        <p className="text-sm text-gray-500 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {shipment.shipment.vesselName && (
                <div>
                  <p className="text-sm text-gray-600">Vessel Name</p>
                  <p className="font-semibold">{shipment.shipment.vesselName}</p>
                </div>
              )}
              {shipment.shipment.estimatedArrivalAt && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Arrival</p>
                  <p className="font-semibold">
                    {formatDate(shipment.shipment.estimatedArrivalAt, 'short')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        {photos.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Shipment Photos ({photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={photo.fileUrl}
                      alt={photo.caption || 'Shipment photo'}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">View</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs">{PHOTO_STAGES[photo.stage] || photo.stage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Section */}
        {documents.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">{DOC_TYPES[doc.documentType] || doc.documentType}</p>
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-brand-dark hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Support */}
        <Card className="mt-6 bg-primary-50 border-primary-200">
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-primary-900 mb-2">Need Help?</p>
            <p className="text-sm text-primary-800 mb-4">
              Our support team is available 24/7 to assist you
            </p>
            <div className="flex gap-4 justify-center">
              <Button>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp Support
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Email Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="absolute top-4 left-4 text-white text-lg">
            {lightboxIndex + 1} / {photos.length}
          </div>

          <div
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].fileUrl}
              alt={photos[lightboxIndex].caption || 'Shipment photo'}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {photos[lightboxIndex].caption && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
              {photos[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

