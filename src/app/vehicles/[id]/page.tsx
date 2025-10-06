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
      
      // Demo cars data (for now, before API integration)
      const demoCars: { [key: string]: Vehicle } = {
        '1': {
          id: '1',
          year: 2020,
          make: 'Toyota',
          model: 'Camry',
          trim: 'SE',
          vin: '4T1B11HK5LU123456',
          currentBid: '8500',
          condition: 'running',
          titleStatus: 'clean',
          odometer: 45000,
          primaryDamage: 'Front End',
          secondaryDamage: 'Minor Scratches',
          auctionDate: new Date('2024-12-15'),
          auctionLocation: 'Los Angeles - CA',
          auctionLocationState: 'CA',
          thumbnailUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&h=600&fit=crop',
          ],
          bodyStyle: 'Sedan',
          color: 'Silver',
          engineType: '2.5L I4',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          hasKeys: true,
        },
        '2': {
          id: '2',
          year: 2019,
          make: 'Honda',
          model: 'Accord',
          trim: 'Sport',
          vin: '1HGCV1F39KA123789',
          currentBid: '12300',
          condition: 'running',
          titleStatus: 'clean',
          odometer: 32000,
          primaryDamage: 'Rear Damage',
          secondaryDamage: null,
          auctionDate: new Date('2024-12-18'),
          auctionLocation: 'Houston - TX',
          auctionLocationState: 'TX',
          thumbnailUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop',
          ],
          bodyStyle: 'Sedan',
          color: 'Black',
          engineType: '1.5L Turbo I4',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          hasKeys: true,
        },
        '3': {
          id: '3',
          year: 2021,
          make: 'BMW',
          model: '3 Series',
          trim: '330i',
          vin: 'WBA5R1C05MWZ12345',
          currentBid: '18750',
          condition: 'running',
          titleStatus: 'salvage',
          odometer: 28000,
          primaryDamage: 'Side Damage',
          secondaryDamage: 'Airbags Deployed',
          auctionDate: new Date('2024-12-12'),
          auctionLocation: 'New York - NY',
          auctionLocationState: 'NY',
          thumbnailUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
          ],
          bodyStyle: 'Sedan',
          color: 'Blue',
          engineType: '2.0L Turbo I4',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          hasKeys: false,
        },
        '4': {
          id: '4',
          year: 2020,
          make: 'Ford',
          model: 'F-150',
          trim: 'XLT',
          vin: '1FTEW1EP5LFB12345',
          currentBid: '22400',
          condition: 'running',
          titleStatus: 'clean',
          odometer: 55000,
          primaryDamage: 'Hail Damage',
          secondaryDamage: null,
          auctionDate: new Date('2024-12-20'),
          auctionLocation: 'Dallas - TX',
          auctionLocationState: 'TX',
          thumbnailUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
          ],
          bodyStyle: 'Pickup',
          color: 'Red',
          engineType: '3.5L V6',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          hasKeys: true,
        },
        '5': {
          id: '5',
          year: 2019,
          make: 'Mercedes-Benz',
          model: 'C-Class',
          trim: 'C300',
          vin: 'WDDWF4HB8KR123456',
          currentBid: '24900',
          condition: 'running',
          titleStatus: 'clean',
          odometer: 35000,
          primaryDamage: 'Front End',
          secondaryDamage: 'Undercarriage',
          auctionDate: new Date('2024-12-16'),
          auctionLocation: 'Miami - FL',
          auctionLocationState: 'FL',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop',
          ],
          bodyStyle: 'Sedan',
          color: 'White',
          engineType: '2.0L Turbo I4',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          hasKeys: true,
        },
        '6': {
          id: '6',
          year: 2020,
          make: 'Lexus',
          model: 'ES 350',
          trim: 'Luxury',
          vin: '58ABK1GG0LU123456',
          currentBid: '16200',
          condition: 'running',
          titleStatus: 'clean',
          odometer: 40000,
          primaryDamage: 'Rear End',
          secondaryDamage: null,
          auctionDate: new Date('2024-12-22'),
          auctionLocation: 'Atlanta - GA',
          auctionLocationState: 'GA',
          thumbnailUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
          ],
          bodyStyle: 'Sedan',
          color: 'Gray',
          engineType: '3.5L V6',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          hasKeys: true,
        },
      };

      // Try to fetch from API first, fallback to demo data
      const demoVehicle = demoCars[params.id as string];
      
      if (demoVehicle) {
        setVehicle(demoVehicle);
        setBidAmount(demoVehicle.currentBid || '');
      } else {
        // Try API call
        const response = await fetch(`/api/vehicles/${params.id}`);
        const data = await response.json();
        
        if (data.success) {
          setVehicle(data.data);
          setBidAmount(data.data.currentBid || '');
        }
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
        {/* Vehicle Title Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>VIN: {vehicle.vin}</span>
            <span>•</span>
            <span>{vehicle.auctionLocation}</span>
            <span>•</span>
            <span className="capitalize">{vehicle.condition?.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-[500px] bg-gray-200">
                  <img
                    src={images[selectedImage]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop';
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md shadow-md">
                    <span className="text-sm font-semibold">Photo {selectedImage + 1} of {images.length}</span>
                  </div>
                </div>
                
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 p-4 bg-gray-100">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative h-20 border-2 rounded overflow-hidden transition-all ${
                          selectedImage === index ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover"
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

          {/* Right Column - Cost Calculator (Sticky) */}
          <div className="space-y-6">
            {/* Cost Calculator */}
            <Card className="sticky top-24 border-2 border-blue-500">
              <CardHeader className="bg-blue-50">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Current Bid</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(parseFloat(vehicle.currentBid || '0'), 'USD')}
                  </p>
                </div>
                <CardTitle>Total Cost Calculator</CardTitle>
                <CardDescription>Calculate landed cost in Nigeria</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
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
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg mb-4 border-2 border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Total Landed Cost in Nigeria</p>
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

                    <div className="border-t pt-4 space-y-3 mb-6 bg-green-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Market Intelligence</p>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Local Resale Value</span>
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
                        <span className="text-sm text-gray-600">Lead Time (US to Nigeria)</span>
                        <span className="font-semibold">
                          {costEstimate.estimatedDaysToDelivery} days ({Math.ceil(costEstimate.estimatedDaysToDelivery / 7)} weeks)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
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
                        Place Bid on This Vehicle
                      </Button>
                      
                      <p className="text-xs text-gray-600 text-center">
                        We'll bid on your behalf up to your maximum amount
                      </p>
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

