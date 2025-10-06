'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  vin: string;
  currentBid?: string | null;
  condition?: string | null;
  titleStatus?: string | null;
  odometer?: number | null;
  primaryDamage?: string | null;
  secondaryDamage?: string | null;
  auctionDate?: Date | string | null;
  auctionLocation?: string | null;
  auctionLocationState?: string | null;
  thumbnailUrl?: string | null;
  images?: string[] | null;
  bodyStyle?: string | null;
  color?: string | null;
  engineType?: string | null;
  transmission?: string | null;
  fuelType?: string | null;
  hasKeys?: boolean | null;
}

interface CostEstimate {
  totalUSD: number;
  totalNGN: number;
  exchangeRate: number;
  estimatedNigerianResaleValue: number;
  estimatedProfitMargin: number;
  estimatedDaysToDelivery: number;
  breakdown: {
    category: string;
    amount: number;
    currency: string;
  }[];
}

export default function VehicleDetailPage() {
  const params = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'roro' | 'container_shared' | 'container_exclusive'>('roro');
  const [destinationPort, setDestinationPort] = useState<'Lagos' | 'Port Harcourt'>('Lagos');

  useEffect(() => {
    if (params.id) {
      fetchVehicle();
    }
  }, [params.id]);

  useEffect(() => {
    if (vehicle) {
      calculateCost();
    }
  }, [vehicle, shippingMethod, destinationPort]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vehicles/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setVehicle(data.data);
        setBidAmount(data.data.currentBid || '');
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = async () => {
    if (!vehicle) return;
    
    try {
      setEstimating(true);
      const response = await fetch(`/api/vehicles/${vehicle.id}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationPort,
          destinationCity: destinationPort,
          shippingMethod,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCostEstimate(data.data);
      }
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setEstimating(false);
    }
  };

  const handlePlaceBid = async () => {
    // TODO: Implement bid placement with authentication
    alert('Bid placement requires login. Redirecting to login page...');
    window.location.href = '/auth/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <p className="text-xl text-gray-600">Vehicle not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = vehicle.images || [vehicle.thumbnailUrl || '/placeholder-car.jpg'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 bg-gray-200">
                  <img
                    src={images[selectedImage]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-car.jpg';
                    }}
                  />
                </div>
                
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 p-4">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative h-20 border-2 rounded ${
                          selectedImage === index ? 'border-blue-600' : 'border-gray-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover rounded"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">VIN</p>
                    <p className="font-mono font-semibold">{vehicle.vin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Body Style</p>
                    <p className="font-semibold">{vehicle.bodyStyle || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-semibold">{vehicle.color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Odometer</p>
                    <p className="font-semibold">{vehicle.odometer?.toLocaleString() || 'N/A'} miles</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Engine</p>
                    <p className="font-semibold">{vehicle.engineType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transmission</p>
                    <p className="font-semibold">{vehicle.transmission || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-semibold">{vehicle.fuelType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Keys</p>
                    <p className="font-semibold">{vehicle.hasKeys ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Primary Damage</p>
                    <p className="font-semibold text-red-600">{vehicle.primaryDamage || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Secondary Damage</p>
                    <p className="font-semibold text-red-600">{vehicle.secondaryDamage || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Title Status</p>
                    <p className="font-semibold uppercase">{vehicle.titleStatus || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Condition</p>
                    <p className="font-semibold capitalize">{vehicle.condition?.replace('_', ' ') || 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auction Information */}
            <Card>
              <CardHeader>
                <CardTitle>Auction Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Auction Date</p>
                    <p className="font-semibold">
                      {vehicle.auctionDate ? formatDate(vehicle.auctionDate, 'long') : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{vehicle.auctionLocation || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing and Cost Calculator */}
          <div className="space-y-6">
            {/* Current Bid */}
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </CardTitle>
                {vehicle.trim && (
                  <CardDescription className="text-lg">{vehicle.trim}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-sm text-gray-600">Current Bid</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {formatCurrency(parseFloat(vehicle.currentBid || '0'), 'USD')}
                  </p>
                </div>

                <div className="space-y-4">
                  <FormInput
                    type="number"
                    label="Your Maximum Bid ($)"
                    placeholder="Enter maximum bid amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePlaceBid}
                  >
                    Place Bid
                  </Button>
                  
                  <p className="text-xs text-gray-600 text-center">
                    We'll bid on your behalf up to your maximum amount
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cost Calculator */}
            <Card>
              <CardHeader>
                <CardTitle>Total Cost Calculator</CardTitle>
                <CardDescription>Calculate landed cost in Nigeria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Destination Port</label>
                    <Select value={destinationPort} onValueChange={(value) => setDestinationPort(value as 'Lagos' | 'Port Harcourt')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select port" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lagos">Lagos</SelectItem>
                        <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Shipping Method</label>
                    <Select value={shippingMethod} onValueChange={(value) => setShippingMethod(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipping method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roro">RoRo (Roll-on/Roll-off)</SelectItem>
                        <SelectItem value="container_shared">Shared Container</SelectItem>
                        <SelectItem value="container_exclusive">Exclusive Container</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {estimating ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Calculating...</p>
                  </div>
                ) : costEstimate ? (
                  <div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-1">Total Landed Cost</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(costEstimate.totalNGN, 'NGN')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        ≈ {formatCurrency(costEstimate.totalUSD, 'USD')} (Rate: ₦{costEstimate.exchangeRate.toLocaleString()})
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      {costEstimate.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.category}</span>
                          <span className="font-medium">
                            {item.currency === 'USD' ? '$' : '₦'}{item.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estimated Resale Value</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(costEstimate.estimatedNigerianResaleValue, 'NGN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estimated Profit</span>
                        <span className={`font-semibold ${
                          costEstimate.estimatedProfitMargin > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(costEstimate.estimatedProfitMargin, 'NGN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivery Timeline</span>
                        <span className="font-semibold">
                          {costEstimate.estimatedDaysToDelivery} days
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

