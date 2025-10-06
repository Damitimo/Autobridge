'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { MessageCircle, Mail } from 'lucide-react';

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

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchShipment(token);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
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
                  <p className="text-lg font-semibold text-blue-600 mt-2">
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
                            ? 'bg-blue-600 text-white'
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
                        <p className="text-sm text-blue-600">Current Status</p>
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
                        {event.status.replace(/_/g, ' ')}
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

        {/* Support */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-blue-900 mb-2">Need Help?</p>
            <p className="text-sm text-blue-800 mb-4">
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
    </div>
  );
}

