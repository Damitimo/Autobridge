'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const CountdownTimer = ({ auctionDate }: { auctionDate: string | null }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!auctionDate) {
      setTimeLeft('TBA');
      return;
    }

    const calculateTimeLeft = () => {
      // Results typically announced 24 hours after auction
      const resultDate = new Date(auctionDate);
      resultDate.setHours(resultDate.getHours() + 24);
      
      const now = new Date().getTime();
      const distance = resultDate.getTime() - now;

      if (distance < 0) {
        return 'Results Available';
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-xs text-blue-600 font-medium">Results In:</p>
          <p className="text-sm font-bold text-blue-800">{timeLeft}</p>
        </div>
      </div>
    </div>
  );
};

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, label: 'Pending' },
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
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {bids.filter(b => b.bid.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
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
            <Card key={item.bid.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Vehicle Image */}
                  <div className="w-full md:w-48 h-36 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.vehicle.imageUrl ? (
                      <img
                        src={item.vehicle.imageUrl}
                        alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                        </h3>
                        <p className="text-sm text-gray-600">
                          VIN: {item.vehicle.vin} • Lot: {item.vehicle.lotNumber}
                        </p>
                      </div>
                      {getStatusBadge(item.bid.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    </div>

                    {item.vehicle.primaryDamage && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Damage:</strong> {item.vehicle.primaryDamage}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      {item.bid.status === 'pending' && (
                        <CountdownTimer auctionDate={item.vehicle.auctionDate} />
                      )}
                      {item.bid.status === 'won' && (
                        <Link href="/dashboard/shipments">
                          <Button size="sm">
                            Track Shipment
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
