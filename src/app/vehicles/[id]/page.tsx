'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormInput } from '@/components/ui/form-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
  const [walletBalance, setWalletBalance] = useState<{available: number, total: number, locked: number} | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundCurrency, setFundCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [hasExistingBid, setHasExistingBid] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchVehicle();
      checkExistingBid();
    }
    // Fetch wallet balance on mount
    fetchWalletBalance();
  }, [params.id]);

  useEffect(() => {
    if (vehicle) {
      calculateCost();
    }
  }, [vehicle, bidAmount]);

  const checkExistingBid = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const existingBid = data.data.find((item: any) => item.vehicle.id === params.id);
        setHasExistingBid(!!existingBid);
      }
    } catch (error) {
      console.error('Error checking existing bid:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.data);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      
      // Fetch from API
      const response = await fetch(`/api/vehicles/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setVehicle(data.data);
        setBidAmount(data.data.currentBid || '');
        setLoading(false);
        return;
      }
      
      // Fallback: Demo cars data (only if API fails)
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
      
      // Calculate on client side for all vehicles (MVP approach)
      if (vehicle.id) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Use buyer's bid amount if provided, otherwise use current bid
        const vehiclePrice = bidAmount && parseFloat(bidAmount) > 0 ? parseFloat(bidAmount) : parseFloat(vehicle.currentBid || '0');
        const exchangeRate = 1550;
        
        // Calculate costs
        const auctionFees = vehiclePrice <= 1000 ? 100 : vehiclePrice <= 4000 ? 200 : vehiclePrice <= 8000 ? 300 : 400;
        const towing = vehicle.condition === 'non_running' ? 250 : 200;
        // Fixed shipping cost (RoRo default)
        const shipping = 1200;
        const insurance = vehiclePrice * 0.02;
        
        // Customs duty based on age
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - vehicle.year;
        let customsDuty = vehiclePrice * (vehicleAge <= 5 ? 0.70 : vehicleAge <= 10 ? 0.55 : 0.45);
        
        const customsClearance = customsDuty + 150 + 200; // duty + port + agent
        const localTransport = 50; // Default: Lagos
        const repairCosts = vehicle.condition === 'non_running' ? vehiclePrice * 0.20 : vehiclePrice * 0.08;
        const platformFee = Math.min(Math.max(vehiclePrice * 0.05, 50), 200);
        
        const totalUSD = vehiclePrice + auctionFees + towing + shipping + insurance + customsClearance + localTransport + repairCosts + platformFee;
        const totalNGN = totalUSD * exchangeRate;
        
        // Estimate resale value
        const popularBrands = ['Toyota', 'Honda', 'Lexus', 'Mercedes-Benz', 'BMW'];
        const brandMultiplier = popularBrands.includes(vehicle.make) ? 1.4 : 1.2;
        const estimatedResale = totalNGN * brandMultiplier;
        const estimatedProfit = estimatedResale - totalNGN;
        
        const breakdown = [
          { category: 'Auction Price', amount: vehiclePrice, currency: 'USD' },
          { category: 'Auction Fees', amount: auctionFees, currency: 'USD' },
          { category: 'Towing (Yard to Port)', amount: towing, currency: 'USD' },
          { category: 'Shipping (RoRo to Nigeria)', amount: shipping, currency: 'USD' },
          { category: 'Insurance', amount: insurance, currency: 'USD' },
          { category: 'Customs Clearance Fees', amount: customsClearance, currency: 'USD' },
          { category: 'Local Transport in Nigeria', amount: localTransport, currency: 'USD' },
          { category: 'Estimated Repair Costs (Nigeria)', amount: repairCosts, currency: 'USD' },
          { category: 'Platform Service Fee', amount: platformFee, currency: 'USD' },
        ];
        
        setCostEstimate({
          totalUSD,
          totalNGN,
          exchangeRate,
          estimatedNigerianResaleValue: estimatedResale,
          estimatedProfitMargin: estimatedProfit,
          estimatedDaysToDelivery: 40,
          breakdown,
        } as CostEstimate);
        
        setEstimating(false);
        return;
      }
      
      // For real vehicles, use API
      const response = await fetch(`/api/vehicles/${vehicle.id}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationPort: 'Lagos',
          destinationCity: 'Lagos',
          shippingMethod: 'roro', // Fixed: RoRo shipping by default
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
    try {
      // Check if logged in
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to place a bid');
        window.location.href = '/auth/login?redirect=' + window.location.pathname;
        return;
      }

      // Validate bid amount
      if (!bidAmount || parseFloat(bidAmount) <= 0) {
        alert('Please enter a valid bid amount');
        return;
      }

      const bidValue = parseFloat(bidAmount);

      // Place bid
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: vehicle?.id,
          maxBidAmount: bidValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Bid placed successfully! Deposit of $${(bidValue * 0.10).toFixed(2)} locked in your wallet.`);
        // Redirect to bids page
        window.location.href = '/dashboard/bids';
      } else {
        // Handle specific errors
        if (response.status === 403) {
          if (data.error?.includes('signup fee')) {
            alert(data.message || data.error);
            window.location.href = '/signup-fee';
          } else if (data.error?.includes('wallet') || data.error?.includes('balance')) {
            // Show fund wallet modal instead of redirecting
            setShowFundModal(true);
          } else {
            alert(data.message || data.error);
          }
        } else {
          alert(data.error || 'Failed to place bid. Please try again.');
        }
      }
    } catch (error) {
      console.error('Bid placement error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setFunding(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(fundAmount),
          currency: fundCurrency,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (fundCurrency === 'NGN' && data.authorizationUrl) {
          // Redirect to Paystack
          window.location.href = data.authorizationUrl;
        } else if (fundCurrency === 'USD') {
          // Show wire transfer instructions
          alert('Wire transfer instructions:\n\n' + JSON.stringify(data.instructions, null, 2));
          setShowFundModal(false);
        }
      } else {
        alert(data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Funding error:', error);
      alert('Failed to fund wallet');
    } finally {
      setFunding(false);
    }
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

  const images = vehicle.images || [vehicle.thumbnailUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
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
            {/* Cost Calculator - Only show if user hasn't bid yet */}
            {!hasExistingBid && (
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
                    <label className="block text-sm font-medium mb-2">Your Maximum Bid ($)</label>
                    <Input
                      type="number"
                      placeholder="Enter your maximum bid amount"
                      value={bidAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setBidAmount(e.target.value);
                        // Recalculate when bid amount changes
                        if (e.target.value) {
                          calculateCost();
                        }
                      }}
                      className="text-lg font-semibold"
                    />
                    {bidAmount && (
                      <p className="text-xs text-gray-500 mt-1">
                        10% Deposit Required: ${(parseFloat(bidAmount) * 0.10).toFixed(2)}
                      </p>
                    )}
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
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handlePlaceBid}
                        disabled={!bidAmount || parseFloat(bidAmount) <= 0}
                      >
                        Place Bid on This Vehicle
                      </Button>
                      
                      {/* Wallet Balance Display */}
                      {walletBalance && bidAmount && (
                        <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Available Balance:</span>
                            <span className="font-semibold text-gray-900">${walletBalance.available.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Required Deposit (10%):</span>
                            <span className="font-semibold text-gray-900">
                              ${(parseFloat(bidAmount) * 0.10).toFixed(2)}
                            </span>
                          </div>
                          
                          {walletBalance.available < (parseFloat(bidAmount) * 0.10) ? (
                            <>
                              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded mt-2">
                                <span className="text-xs font-semibold text-red-700 uppercase">⚠️ Insufficient Funds</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => setShowFundModal(true)}
                              >
                                Fund Wallet
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded mt-2">
                              <span className="text-xs font-semibold text-green-700">✓ Sufficient Balance</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-600 text-center">
                        We'll bid on your behalf up to your maximum amount
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
            <DialogDescription>
              Add money to your wallet to place this bid
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <Select 
                value={fundCurrency} 
                onValueChange={(value: 'NGN' | 'USD') => setFundCurrency(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input
                type="number"
                placeholder={fundCurrency === 'NGN' ? '₦50,000' : '$100'}
                value={fundAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFundAmount(e.target.value)}
              />
              {fundCurrency === 'NGN' && fundAmount && (
                <p className="text-sm text-gray-600 mt-1">
                  ≈ ${(parseFloat(fundAmount) / 1550).toFixed(2)} USD
                </p>
              )}
            </div>

            {walletBalance && bidAmount && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Required deposit:</strong> ${(parseFloat(bidAmount) * 0.10).toFixed(2)}
                  <br />
                  <strong>Current balance:</strong> ${walletBalance.available.toFixed(2)}
                  <br />
                  <strong>Shortfall:</strong> ${Math.max(0, (parseFloat(bidAmount) * 0.10) - walletBalance.available).toFixed(2)}
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-blue-900 font-medium">
                {fundCurrency === 'NGN' ? (
                  <>💳 You will be redirected to Paystack to complete payment securely</>
                ) : (
                  <>🏦 Wire transfer instructions will be provided after submission</>
                )}
              </p>
              {fundCurrency === 'NGN' && (
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Test Card (Demo):</p>
                  <p className="text-xs text-blue-800 font-mono">
                    Card: 4084 0840 8408 4081<br />
                    Expiry: 12/30 | CVV: 408<br />
                    PIN: 0000 | OTP: 123456
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleFundWallet}
              disabled={funding}
              className="w-full"
              size="lg"
            >
              {funding ? 'Processing...' : `Fund Wallet (${fundCurrency})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

