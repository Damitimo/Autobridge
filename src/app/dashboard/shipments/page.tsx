'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { CheckCircle, Clock } from 'lucide-react';

interface Shipment {
  shipment: {
    id: string;
    status: string;
    estimatedArrivalAt?: Date | string;
    createdAt: Date | string;
  };
  vehicle: {
    year: number;
    make: string;
    model: string;
    vin: string;
  };
  bid: {
    finalBidAmount?: string;
  };
}

export default function ShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchShipments(token);
  }, []);

  const fetchShipments = async (token: string) => {
    try {
      const response = await fetch('/api/shipments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShipments(data.data);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      auction_won: 'secondary',
      payment_received: 'default',
      vessel_in_transit: 'default',
      customs_clearance: 'secondary',
      delivered: 'outline',
    };
    
    return variants[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Shipments</h1>
          <p className="text-gray-600">Track all your vehicle shipments</p>
        </div>

        {shipments.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-gray-600 mb-4">No shipments yet</p>
            <p className="text-gray-500 mb-6">
              Win an auction to see your shipments here
            </p>
            <Link href="/vehicles">
              <Button>
                Browse Vehicles
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shipments.map((item) => (
              <Card key={item.shipment.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Vehicle Info */}
                  <div>
                      <h3 className="text-xl font-bold mb-1">
                        {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        VIN: {item.vehicle.vin}
                      </p>
                      
                      {item.bid.finalBidAmount && (
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          ${parseFloat(item.bid.finalBidAmount).toLocaleString()}
                        </p>
                      )}
                      
                      {item.shipment.estimatedArrivalAt && (
                        <div className="bg-gray-50 border rounded-lg p-3 mt-4">
                          <p className="text-sm text-gray-600">
                            <strong>ETA:</strong> {formatDate(item.shipment.estimatedArrivalAt, 'short')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            45-60 days from payment
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="border-t my-4"></div>

                  {/* Progress Tracker */}
                  <div className="space-y-3">
                    {/* Payment Received - Always completed */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-green-700">Payment Received</h4>
                      </div>
                    </div>

                    {/* Preparing for Pickup */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-600">Preparing for Pickup</h4>
                      </div>
                    </div>

                    {/* In Transit to Port */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-600">In Transit to Port</h4>
                      </div>
                    </div>

                    {/* Shipped to Nigeria */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-600">Shipped to Nigeria</h4>
                      </div>
                    </div>

                    {/* Customs Clearance */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-600">Customs Clearance</h4>
                      </div>
                    </div>

                    {/* Ready for Pickup */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-600">Ready for Pickup</h4>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

