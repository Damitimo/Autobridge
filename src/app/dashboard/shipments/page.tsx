'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
  Ship,
  Truck,
  Package,
  MapPin,
  Calendar,
  ChevronRight,
  Anchor,
  FileText,
  Loader2,
  Car
} from 'lucide-react';

interface Shipment {
  shipment: {
    id: string;
    status: string;
    estimatedArrivalAt?: Date | string;
    createdAt: Date | string;
    vesselName?: string;
    pickupScheduledAt?: Date | string;
    pickedUpAt?: Date | string;
    arrivedAtWarehouseAt?: Date | string;
    departedAt?: Date | string;
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

// Status configuration with icons and labels
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; step: number }> = {
  auction_won: { label: 'Auction Won', icon: CheckCircle, color: 'text-green-600', step: 1 },
  payment_received: { label: 'Payment Received', icon: CheckCircle, color: 'text-green-600', step: 2 },
  pickup_scheduled: { label: 'Pickup Scheduled', icon: Calendar, color: 'text-blue-600', step: 3 },
  in_transit_to_port: { label: 'In Transit to Port', icon: Truck, color: 'text-blue-600', step: 4 },
  at_us_port: { label: 'At U.S. Port', icon: Anchor, color: 'text-blue-600', step: 5 },
  loaded_on_vessel: { label: 'Loaded on Vessel', icon: Package, color: 'text-blue-600', step: 6 },
  vessel_departed: { label: 'Vessel Departed', icon: Ship, color: 'text-indigo-600', step: 7 },
  vessel_in_transit: { label: 'Ocean Transit', icon: Ship, color: 'text-indigo-600', step: 8 },
  vessel_arrived_nigeria: { label: 'Arrived Nigeria', icon: MapPin, color: 'text-purple-600', step: 9 },
  customs_clearance: { label: 'Customs Clearance', icon: FileText, color: 'text-orange-600', step: 10 },
  customs_cleared: { label: 'Customs Cleared', icon: CheckCircle, color: 'text-orange-600', step: 11 },
  ready_for_pickup: { label: 'Ready for Pickup', icon: Package, color: 'text-green-600', step: 12 },
  in_transit_to_customer: { label: 'Out for Delivery', icon: Truck, color: 'text-green-600', step: 13 },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600', step: 14 },
};

const TOTAL_STEPS = 14;

// Simplified timeline steps for display
const TIMELINE_STEPS = [
  { key: 'payment', label: 'Payment', statuses: ['auction_won', 'payment_received'] },
  { key: 'pickup', label: 'Pickup', statuses: ['pickup_scheduled', 'in_transit_to_port', 'at_us_port'] },
  { key: 'shipping', label: 'Shipping', statuses: ['loaded_on_vessel', 'vessel_departed', 'vessel_in_transit'] },
  { key: 'arrival', label: 'Arrival', statuses: ['vessel_arrived_nigeria', 'customs_clearance', 'customs_cleared'] },
  { key: 'delivery', label: 'Delivery', statuses: ['ready_for_pickup', 'in_transit_to_customer', 'delivered'] },
];

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

  const getStepStatus = (shipmentStatus: string, stepStatuses: string[]) => {
    const currentStep = STATUS_CONFIG[shipmentStatus]?.step || 0;
    const stepMinStatus = stepStatuses[0];
    const stepMaxStatus = stepStatuses[stepStatuses.length - 1];
    const stepMin = STATUS_CONFIG[stepMinStatus]?.step || 0;
    const stepMax = STATUS_CONFIG[stepMaxStatus]?.step || 0;

    if (currentStep > stepMax) return 'completed';
    if (currentStep >= stepMin && currentStep <= stepMax) return 'current';
    return 'pending';
  };

  const getProgressPercentage = (status: string) => {
    const step = STATUS_CONFIG[status]?.step || 0;
    return Math.round((step / TOTAL_STEPS) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
        <p className="text-gray-600">Track your vehicles from auction to delivery</p>
      </div>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ship className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shipments Yet</h3>
            <p className="text-gray-600 mb-4">
              Once you win an auction, your vehicle shipment will appear here for tracking
            </p>
            <Link href="/dashboard/bids">
              <Button className="bg-brand-dark hover:bg-brand-dark/90">
                View My Bids
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map((item) => {
            const statusConfig = STATUS_CONFIG[item.shipment.status] || STATUS_CONFIG.auction_won;
            const StatusIcon = statusConfig.icon;
            const progress = getProgressPercentage(item.shipment.status);

            return (
              <Link key={item.shipment.id} href={`/dashboard/shipments/${item.shipment.id}`} className="block mb-4">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-brand-dark">
                  <CardContent className="p-0">
                    {/* Top Section - Vehicle Info & Status */}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        {/* Vehicle Image */}
                        <div className="hidden sm:block w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.vehicle.images?.[0] ? (
                            <img
                              src={item.vehicle.images[0]}
                              alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Vehicle Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 truncate">
                                {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                              </h3>
                              <p className="text-sm text-gray-500 font-mono">
                                VIN: {item.vehicle.vin?.slice(-8) || 'N/A'}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </div>

                          {/* Current Status Badge */}
                          <div className="mt-3 flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 ${statusConfig.color}`}>
                              <StatusIcon className="h-4 w-4" />
                              <span className="text-sm font-medium">{statusConfig.label}</span>
                            </div>
                            {item.bid.finalBidAmount && (
                              <span className="text-sm text-gray-600">
                                ${parseFloat(item.bid.finalBidAmount).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-dark to-brand-gold rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Timeline Steps */}
                    <div className="border-t bg-gray-50 px-4 sm:px-6 py-3">
                      <div className="flex items-center justify-between">
                        {TIMELINE_STEPS.map((step, index) => {
                          const stepStatus = getStepStatus(item.shipment.status, step.statuses);

                          return (
                            <div key={step.key} className="flex items-center">
                              {/* Step Circle */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                    stepStatus === 'completed'
                                      ? 'bg-green-500 text-white'
                                      : stepStatus === 'current'
                                        ? 'bg-brand-dark text-white ring-4 ring-brand-dark/20'
                                        : 'bg-gray-200 text-gray-500'
                                  }`}
                                >
                                  {stepStatus === 'completed' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <span className={`text-xs mt-1 hidden sm:block ${
                                  stepStatus === 'current' ? 'text-brand-dark font-medium' : 'text-gray-500'
                                }`}>
                                  {step.label}
                                </span>
                              </div>

                              {/* Connector Line */}
                              {index < TIMELINE_STEPS.length - 1 && (
                                <div
                                  className={`h-0.5 w-8 sm:w-12 lg:w-16 mx-1 ${
                                    stepStatus === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer - ETA & Dates */}
                    {(item.shipment.estimatedArrivalAt || item.shipment.vesselName) && (
                      <div className="border-t px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4 text-sm">
                        {item.shipment.estimatedArrivalAt && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              ETA: <span className="font-medium">{formatDate(item.shipment.estimatedArrivalAt, 'short')}</span>
                            </span>
                          </div>
                        )}
                        {item.shipment.vesselName && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Ship className="h-4 w-4" />
                            <span>Vessel: <span className="font-medium">{item.shipment.vesselName}</span></span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
