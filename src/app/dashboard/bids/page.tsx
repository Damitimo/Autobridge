'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Car,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Bid {
  bid: {
    id: string;
    maxBidAmount: string;
    currentBidAmount: string | null;
    status: 'pending' | 'won' | 'lost' | 'outbid';
    finalBidAmount: string | null;
    createdAt: string;
    updatedAt: string;
  };
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    lotNumber: string;
    currentBid: string | null;
    buyNowPrice: string | null;
    estimatedRetailValue: string | null;
    auctionDate: string | null;
    location: string;
    imageUrl: string | null;
    primaryDamage: string | null;
  };
}

const CountdownTimer = ({ auctionDate, onComplete }: { auctionDate: string | null; onComplete: () => void }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!auctionDate) {
      setTimeLeft('TBA');
      return;
    }

    const calculateTimeLeft = () => {
      // Results typically announced 2 minutes after auction (for testing)
      const resultDate = new Date(auctionDate);
      resultDate.setMinutes(resultDate.getMinutes() + 2);
      
      const now = new Date().getTime();
      const distance = resultDate.getTime() - now;

      if (distance < 0) {
        if (!isComplete) {
          setIsComplete(true);
          onComplete();
        }
        return 'Bidding Won!';
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [auctionDate]);

  return (
    <p className="font-semibold">{timeLeft}</p>
  );
};

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundCurrency, setFundCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setBids(data.data);
      } else {
        setError(data.error || 'Failed to fetch bids');
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      setError('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock, label: 'In Progress' },
      won: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: 'Won' },
      lost: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Lost' },
      outbid: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: TrendingUp, label: 'Outbid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bids</h1>
            <p className="text-gray-600 mt-1">Track your active and past bids</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bids</h1>
          <p className="text-gray-600 mt-1">Track your active and past bids</p>
        </div>
        <Link href="/vehicles">
          <Button>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Browse Vehicles
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bids</p>
                <p className="text-2xl font-bold">{bids.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {bids.filter(b => b.bid.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won</p>
                <p className="text-2xl font-bold">
                  {bids.filter(b => b.bid.status === 'won').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ${bids.reduce((sum, b) => sum + parseFloat(b.bid.maxBidAmount), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bids List */}
      {bids.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bids Yet</h3>
            <p className="text-gray-600 mb-6">
              Start browsing vehicles to place your first bid
            </p>
            <Link href="/vehicles">
              <Button>Browse Vehicles</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bids.map((item) => (
            <Card key={item.bid.id} className="hover:shadow-lg transition-shadow relative">
              <div className="absolute top-4 right-4 z-10">
                {getStatusBadge(item.bid.status)}
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Vehicle Image */}
                  <div className="w-full md:w-48 min-h-[200px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 self-stretch">
                    {item.vehicle.imageUrl ? (
                      <img
                        src={item.vehicle.imageUrl}
                        alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                        className="w-full h-full min-h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        VIN: {item.vehicle.vin} • Lot: {item.vehicle.lotNumber}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Your Max Bid</p>
                        <p className="font-semibold text-lg text-blue-600">
                          ${parseFloat(item.bid.maxBidAmount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Bid</p>
                        <p className="font-semibold">
                          ${item.vehicle.currentBid ? parseFloat(item.vehicle.currentBid).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Auction Date</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.vehicle.auctionDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Location</p>
                        <p className="font-semibold">{item.vehicle.location}</p>
                      </div>
                      {item.bid.status === 'pending' && (
                        <div>
                          <p className="text-gray-600">Results In</p>
                          <CountdownTimer 
                            auctionDate={item.vehicle.auctionDate}
                            onComplete={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                const response = await fetch('/api/bids/update-status', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ 
                                    bidId: item.bid.id,
                                    status: 'won'
                                  }),
                                });

                                if (response.ok) {
                                  setBids(prevBids => 
                                    prevBids.map(b => 
                                      b.bid.id === item.bid.id 
                                        ? { ...b, bid: { ...b.bid, status: 'won' } }
                                        : b
                                    )
                                  );
                                }
                              } catch (error) {
                                console.error('Failed to update bid status:', error);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {item.vehicle.primaryDamage && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Damage:</strong> {item.vehicle.primaryDamage}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Link href={`/vehicles/${item.vehicle.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {item.bid.status === 'won' && !item.bid.finalBidAmount && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          disabled={processing}
                          onClick={async () => {
                            const vehiclePrice = parseFloat(item.bid.maxBidAmount);
                            const confirmPayment = confirm(
                              `Complete payment for ${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}?\n\n` +
                              `Amount: $${vehiclePrice.toLocaleString()}\n\n` +
                              `This will be deducted from your wallet balance.`
                            );
                            
                            if (confirmPayment) {
                              try {
                                setProcessing(true);
                                const token = localStorage.getItem('token');
                                const response = await fetch('/api/payment/process-vehicle', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ bidId: item.bid.id }),
                                });

                                const data = await response.json();

                                if (data.success) {
                                  // Update local state to mark as paid
                                  setBids(prevBids => 
                                    prevBids.map(b => 
                                      b.bid.id === item.bid.id 
                                        ? { ...b, bid: { ...b.bid, finalBidAmount: b.bid.maxBidAmount } }
                                        : b
                                    )
                                  );
                                  alert('Payment successful! Your vehicle is being prepared for shipment.');
                                } else {
                                  alert(data.error || 'Payment failed');
                                }
                              } catch (error) {
                                console.error('Payment error:', error);
                                alert('Payment failed. Please try again.');
                              } finally {
                                setProcessing(false);
                              }
                            }
                          }}
                        >
                          {processing ? 'Processing...' : 'Make Payment'}
                        </Button>
                      )}
                      {item.bid.status === 'won' && item.bid.finalBidAmount && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSelectedShipment(item);
                            setShowShipmentModal(true);
                          }}
                        >
                          Track Shipment
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fund Wallet Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Your Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Currency</label>
              <Select value={fundCurrency} onValueChange={(value: 'NGN' | 'USD') => setFundCurrency(value)}>
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
              <label className="block text-sm font-medium mb-2">
                Amount ({fundCurrency === 'NGN' ? '₦' : '$'})
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={fundAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFundAmount(e.target.value)}
              />
              {fundCurrency === 'NGN' && fundAmount && (
                <p className="text-sm text-gray-600 mt-1">
                  ≈ ${(parseFloat(fundAmount) / 1550).toFixed(2)} USD
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={async () => {
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
                      window.location.href = data.authorizationUrl;
                    } else {
                      alert('Wire transfer instructions sent! Check your email.');
                      setShowFundModal(false);
                    }
                  } else {
                    alert(data.error || 'Failed to initiate payment');
                  }
                } catch (error) {
                  console.error('Fund wallet error:', error);
                  alert('Failed to process payment');
                } finally {
                  setFunding(false);
                }
              }}
              disabled={funding || !fundAmount || parseFloat(fundAmount) <= 0}
            >
              {funding ? 'Processing...' : `Fund Wallet (${fundCurrency})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Tracking Modal */}
      <Dialog open={showShipmentModal} onOpenChange={setShowShipmentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Track Shipment</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">
                  {selectedShipment.vehicle.year} {selectedShipment.vehicle.make} {selectedShipment.vehicle.model}
                </h3>
                <p className="text-sm text-gray-600">
                  VIN: {selectedShipment.vehicle.vin}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-700">Payment Received</h4>
                    <p className="text-sm text-gray-600">Your payment has been processed successfully</p>
                    <p className="text-xs text-gray-500 mt-1">Current Status</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-600">Preparing for Pickup</h4>
                    <p className="text-sm text-gray-600">Vehicle is being prepared for pickup from auction</p>
                    <p className="text-xs text-gray-500 mt-1">Upcoming</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-600">In Transit to Port</h4>
                    <p className="text-sm text-gray-600">Vehicle will be transported to US port</p>
                    <p className="text-xs text-gray-500 mt-1">Upcoming</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-600">Shipped to Nigeria</h4>
                    <p className="text-sm text-gray-600">Vehicle on vessel to Lagos port</p>
                    <p className="text-xs text-gray-500 mt-1">Upcoming</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-600">Customs Clearance</h4>
                    <p className="text-sm text-gray-600">Processing customs documentation</p>
                    <p className="text-xs text-gray-500 mt-1">Upcoming</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-600">Ready for Pickup</h4>
                    <p className="text-sm text-gray-600">Vehicle cleared and ready for collection</p>
                    <p className="text-xs text-gray-500 mt-1">Upcoming</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Estimated Delivery:</strong> 45-60 days from payment
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  We'll notify you at each step of the shipping process
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
