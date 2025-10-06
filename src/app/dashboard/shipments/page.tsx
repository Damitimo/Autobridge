'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

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
    const token = localStorage.getItem('authToken');
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
          <div className="space-y-4">
            {shipments.map((item) => (
              <Link key={item.shipment.id} href={`/dashboard/shipments/${item.shipment.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">
                          {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          VIN: {item.vehicle.vin}
                        </p>
                        <div className="flex items-center gap-4">
                          <Badge variant={getStatusVariant(item.shipment.status)}>
                            {item.shipment.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Created: {formatDate(item.shipment.createdAt, 'short')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {item.bid.finalBidAmount && (
                          <p className="text-xl font-bold text-blue-600 mb-2">
                            ${parseFloat(item.bid.finalBidAmount).toLocaleString()}
                          </p>
                        )}
                        {item.shipment.estimatedArrivalAt && (
                          <p className="text-sm text-gray-600">
                            ETA: {formatDate(item.shipment.estimatedArrivalAt, 'short')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

