'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart,
  AlertCircle,
  DollarSign,
  Calendar,
  Car,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Link as LinkIcon,
  Send,
  MessageSquare,
  Ship,
  Trash2,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QuickMessageModal from '@/components/quick-message-modal';

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

interface BidRequest {
  id: string;
  auctionLink: string;
  auctionSource: string;
  maxBidAmount: string;
  notes: string | null;
  status: string;
  createdAt: string;
  // Vehicle info from scraper
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleVin: string | null;
  lotNumber: string | null;
  vehicleImageUrl: string | null;
  vehicleLocation: string | null;
  vehicleDamageType: string | null;
  currentBid: string | null;
}

const CountdownTimer = ({ bidCreatedAt, onComplete }: { bidCreatedAt: string | null; onComplete: () => void }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!bidCreatedAt) {
      setTimeLeft('TBA');
      return;
    }

    const calculateTimeLeft = () => {
      // Results announced 2 minutes after bid placed (for testing)
      const resultDate = new Date(bidCreatedAt);
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

      // Always show seconds for better visibility
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
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
  }, [bidCreatedAt]);

  return (
    <p className="font-semibold">{timeLeft}</p>
  );
};

export default function BidsPage() {
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidRequests, setBidRequests] = useState<BidRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'won' | 'lost' | 'all'>('pending');
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundCurrency, setFundCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // Quick message modal state
  const [showQuickMessageModal, setShowQuickMessageModal] = useState(false);
  const [selectedBidRequest, setSelectedBidRequest] = useState<BidRequest | null>(null);

  // Edit bid modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBid, setEditingBid] = useState<BidRequest | null>(null);
  const [newMaxBid, setNewMaxBid] = useState('');
  const [editingLoading, setEditingLoading] = useState(false);

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
        setBids(data.data || []);
        setBidRequests(data.bidRequests || []);
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

  // Handle edit bid request
  const handleOpenEditModal = (request: BidRequest) => {
    setEditingBid(request);
    setNewMaxBid(request.maxBidAmount);
    setShowEditModal(true);
  };

  const handleUpdateBid = async () => {
    if (!editingBid || !newMaxBid) return;

    const newAmount = parseFloat(newMaxBid);
    const currentAmount = parseFloat(editingBid.maxBidAmount);

    if (newAmount === currentAmount) {
      alert('Please enter a different amount');
      return;
    }

    if (newAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setEditingLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bids/request/${editingBid.id}/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxBidAmount: newAmount }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowEditModal(false);
        setEditingBid(null);
        setNewMaxBid('');
        fetchBids(); // Refresh the list
      } else {
        alert(data.error || 'Failed to update bid');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update bid');
    } finally {
      setEditingLoading(false);
    }
  };

  // Handle cancel bid request
  const handleCancelBid = async (request: BidRequest) => {
    if (!confirm('Are you sure you want to cancel this bid request? Your locked deposit will be refunded.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bids/request/${request.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchBids(); // Refresh the list
      } else {
        alert(data.error || 'Failed to cancel bid request');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Failed to cancel bid request');
    }
  };

  // Handle message button click - check if conversation exists
  const handleMessageClick = async (request: BidRequest) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/conversations/check?bidRequestId=${request.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.exists && data.conversationId) {
        // Navigate to existing conversation
        router.push(`/dashboard/messages?conversation=${data.conversationId}`);
      } else {
        // Show quick message modal for new conversation
        setSelectedBidRequest(request);
        setShowQuickMessageModal(true);
      }
    } catch (err) {
      // If check fails, just show the modal
      setSelectedBidRequest(request);
      setShowQuickMessageModal(true);
    }
  };

  // Filter bids based on active tab
  const filteredBids = bids.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return item.bid.status === 'pending';
    if (activeTab === 'won') return item.bid.status === 'won';
    if (activeTab === 'lost') return item.bid.status === 'lost' || item.bid.status === 'outbid';
    return true;
  });

  // Count for tabs - include bid requests
  const pendingCount = bids.filter(b => b.bid.status === 'pending').length + bidRequests.filter(br => br.status === 'pending' || br.status === 'bid_placed').length;
  const wonCount = bids.filter(b => b.bid.status === 'won').length + bidRequests.filter(br => br.status === 'won').length;
  const lostCount = bids.filter(b => b.bid.status === 'lost' || b.bid.status === 'outbid').length + bidRequests.filter(br => br.status === 'lost' || br.status === 'rejected').length;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, label: 'Awaiting Decision' },
      bid_placed: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock, label: 'Bid Placed' },
      won: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: 'Won' },
      lost: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Lost' },
      outbid: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: TrendingUp, label: 'Outbid' },
      rejected: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle, label: 'Rejected' },
      withdrawn: { color: 'bg-gray-100 text-gray-600 border-gray-300', icon: XCircle, label: 'Withdrawn' },
    };

    const config = statusConfig[status] || statusConfig.pending;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
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
        <Link href="/dashboard/bids/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Request New Bid
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

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'pending'
              ? 'text-brand-dark'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Awaiting Decision {pendingCount > 0 && `(${pendingCount})`}
          {activeTab === 'pending' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-dark" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('won')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'won'
              ? 'text-brand-dark'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Won {wonCount > 0 && `(${wonCount})`}
          {activeTab === 'won' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-dark" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('lost')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'lost'
              ? 'text-brand-dark'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Lost {lostCount > 0 && `(${lostCount})`}
          {activeTab === 'lost' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-dark" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'all'
              ? 'text-brand-dark'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({bids.length + bidRequests.length})
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-dark" />
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bids</p>
                <p className="text-2xl font-bold">{bids.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-brand-dark" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Awaiting Decision</p>
                <p className="text-2xl font-bold">
                  {pendingCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-brand-dark" />
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
              <DollarSign className="h-8 w-8 text-brand-dark" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bid Requests - Show based on status and active tab */}
      {(() => {
        // Filter bid requests based on active tab
        const filteredBidRequests = bidRequests.filter(br => {
          if (activeTab === 'all') return true;
          if (activeTab === 'pending') return br.status === 'pending' || br.status === 'bid_placed';
          if (activeTab === 'won') return br.status === 'won';
          if (activeTab === 'lost') return br.status === 'lost' || br.status === 'rejected';
          return false;
        });

        if (filteredBidRequests.length === 0) return null;

        const sectionTitle = activeTab === 'won' ? 'Won Auctions' :
                            activeTab === 'lost' ? 'Lost/Rejected' :
                            activeTab === 'pending' ? 'Pending Requests' : 'All Bid Requests';

        return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">{sectionTitle}</h3>
          {filteredBidRequests.map((request) => (
            <Card key={request.id} className={`hover:shadow-lg transition-shadow relative ${
              request.status === 'won' ? 'border-green-200' :
              request.status === 'lost' || request.status === 'rejected' ? 'border-red-200' :
              'border-yellow-200'
            }`}>
              <div className="absolute top-4 right-4 z-10">
                {getStatusBadge(request.status)}
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Vehicle Image */}
                  <div className="w-full md:w-48 h-[150px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {request.vehicleImageUrl ? (
                      <img
                        src={request.vehicleImageUrl}
                        alt={`${request.vehicleYear} ${request.vehicleMake} ${request.vehicleModel}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* Request Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {request.vehicleYear && request.vehicleMake && request.vehicleModel
                          ? `${request.vehicleYear} ${request.vehicleMake} ${request.vehicleModel}`
                          : `Bid Request - ${request.auctionSource.toUpperCase()}`
                        }
                      </h3>
                      {request.lotNumber && (
                        <p className="text-sm text-gray-500">Lot #{request.lotNumber}</p>
                      )}
                      <p className="text-sm text-gray-600 truncate max-w-md">
                        {request.auctionLink}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Your Max Bid</p>
                        <p className="font-semibold text-lg text-brand-dark">
                          ${parseFloat(request.maxBidAmount).toLocaleString()}
                        </p>
                      </div>
                      {request.currentBid && (
                        <div>
                          <p className="text-gray-600">Current Bid</p>
                          <p className="font-semibold">
                            ${parseFloat(request.currentBid).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {request.vehicleLocation && (
                        <div>
                          <p className="text-gray-600">Location</p>
                          <p className="font-semibold">{request.vehicleLocation}</p>
                        </div>
                      )}
                      {request.vehicleDamageType && (
                        <div>
                          <p className="text-gray-600">Damage</p>
                          <p className="font-semibold">{request.vehicleDamageType}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600">Submitted</p>
                        <p className="font-semibold">
                          {new Date(request.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {request.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {request.status === 'won' && (
                        <Link href="/dashboard/shipments">
                          <Button size="sm" className="flex items-center gap-2 bg-brand-dark hover:bg-brand-dark/90">
                            <Ship className="h-4 w-4" />
                            Track Shipment
                          </Button>
                        </Link>
                      )}
                      {(request.status === 'pending' || request.status === 'bid_placed') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleOpenEditModal(request)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Bid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleCancelBid(request)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Cancel Bid
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => handleMessageClick(request)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                      <a href={request.auctionLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          View Listing
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        );
      })()}

      {/* Bids List */}
      {filteredBids.length === 0 && bidRequests.filter(br => {
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return br.status === 'pending' || br.status === 'bid_placed';
        if (activeTab === 'won') return br.status === 'won';
        if (activeTab === 'lost') return br.status === 'lost' || br.status === 'rejected';
        return false;
      }).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bids Yet</h3>
            <p className="text-gray-600 mb-6">
              Paste an auction link from Copart or IAAI to request your first bid
            </p>
            <Link href="/dashboard/bids/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Your First Bid
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredBids.length > 0 ? (
        <div className="space-y-4">
          {activeTab === 'pending' || activeTab === 'all' ? <h3 className="text-lg font-semibold text-gray-700">Active Bids</h3> : null}
          {filteredBids.map((item) => (
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
                        <p className="font-semibold text-lg text-brand-dark">
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
                            bidCreatedAt={item.bid.createdAt}
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
                          className="bg-brand-dark hover:bg-primary-700"
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
      ) : null}

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
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
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


      {/* Quick Message Modal */}
      <QuickMessageModal
        isOpen={showQuickMessageModal}
        onClose={() => {
          setShowQuickMessageModal(false);
          setSelectedBidRequest(null);
        }}
        bidRequestId={selectedBidRequest?.id || ''}
        vehicleTitle={
          selectedBidRequest?.vehicleYear && selectedBidRequest?.vehicleMake && selectedBidRequest?.vehicleModel
            ? `${selectedBidRequest.vehicleYear} ${selectedBidRequest.vehicleMake} ${selectedBidRequest.vehicleModel}`
            : undefined
        }
        onSuccess={(conversationId) => {
          // Navigate to the conversation after sending
          router.push(`/dashboard/messages?conversation=${conversationId}`);
        }}
      />

      {/* Edit Bid Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Max Bid Amount</DialogTitle>
            <DialogDescription>
              {editingBid && (
                <span>
                  {editingBid.vehicleYear} {editingBid.vehicleMake} {editingBid.vehicleModel}
                  {editingBid.lotNumber && ` (Lot #${editingBid.lotNumber})`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Max Bid</label>
              <p className="text-lg font-semibold text-gray-600">
                ${editingBid ? parseFloat(editingBid.maxBidAmount).toLocaleString() : '0'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Max Bid ($)</label>
              <Input
                type="number"
                placeholder="Enter new max bid amount"
                value={newMaxBid}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMaxBid(e.target.value)}
                min="1"
              />
              {editingBid && newMaxBid && parseFloat(newMaxBid) !== parseFloat(editingBid.maxBidAmount) && (
                <p className="text-sm text-gray-600 mt-2">
                  {parseFloat(newMaxBid) > parseFloat(editingBid.maxBidAmount) ? (
                    <span className="text-orange-600">
                      Additional ${((parseFloat(newMaxBid) - parseFloat(editingBid.maxBidAmount)) * 0.1).toFixed(2)} will be locked (10% deposit)
                    </span>
                  ) : (
                    <span className="text-green-600">
                      ${((parseFloat(editingBid.maxBidAmount) - parseFloat(newMaxBid)) * 0.1).toFixed(2)} will be unlocked
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBid(null);
                  setNewMaxBid('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateBid}
                disabled={editingLoading || !newMaxBid || !!(editingBid && parseFloat(newMaxBid) === parseFloat(editingBid.maxBidAmount))}
              >
                {editingLoading ? 'Updating...' : 'Update Bid'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
