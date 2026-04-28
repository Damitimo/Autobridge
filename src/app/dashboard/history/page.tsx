'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  History,
  Car,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface VehicleLookup {
  id: string;
  lotNumber: string;
  source: 'copart' | 'iaai';
  auctionUrl: string;
  title: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  imageUrl: string | null;
  currentBid: string | null;
  location: string | null;
  damageType: string | null;
  odometer: string | null;
  auctionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const [lookups, setLookups] = useState<VehicleLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vehicle-lookups', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setLookups(data.lookups);
      } else {
        setError(data.error || 'Failed to load history');
      }
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const refreshLookup = async (id: string) => {
    try {
      setRefreshingId(id);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vehicle-lookups/${id}/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        // Update the lookup in the list
        setLookups(prev =>
          prev.map(l => (l.id === id ? data.lookup : l))
        );
      } else {
        alert(data.error || 'Failed to refresh');
      }
    } catch (err) {
      alert('Failed to refresh vehicle data');
    } finally {
      setRefreshingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0';
    const num = parseFloat(amount);
    return `$${num.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-6 w-6" />
            Vehicle Lookup History
          </h1>
          <p className="text-gray-600">Vehicles you've previously checked</p>
        </div>
        <Button onClick={fetchHistory} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {lookups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles checked yet</h3>
            <p className="text-gray-500 mb-4">
              When you look up vehicles from Copart or IAAI, they'll appear here.
            </p>
            <Link href="/dashboard/bids/new">
              <Button>Look Up a Vehicle</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lookups.map((lookup) => (
            <Card key={lookup.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Clickable Card Content */}
              <Link href={`/dashboard/bids/new?lookupId=${lookup.id}`} className="block">
                {/* Vehicle Image */}
                <div className="relative h-40 bg-gray-100">
                  {lookup.imageUrl ? (
                    <Image
                      src={lookup.imageUrl}
                      alt={lookup.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  {/* Source Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white ${
                    lookup.source === 'copart' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {lookup.source.toUpperCase()}
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-brand-dark transition-colors">
                    {lookup.title}
                  </h3>

                  {/* Details */}
                  <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700">
                        Current Bid: {formatCurrency(lookup.currentBid)}
                      </span>
                    </div>
                    {lookup.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{lookup.location}</span>
                      </div>
                    )}
                    {lookup.auctionDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="line-clamp-1">{lookup.auctionDate}</span>
                      </div>
                    )}
                    {lookup.damageType && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="line-clamp-1">{lookup.damageType}</span>
                      </div>
                    )}
                  </div>

                  {/* Lot Number */}
                  <p className="text-xs text-gray-500">
                    Lot #{lookup.lotNumber} &bull; Last updated {formatDate(lookup.updatedAt)}
                  </p>
                </CardContent>
              </Link>

              {/* Actions - Outside of clickable area */}
              <div className="px-4 pb-4 flex gap-2">
                <Link
                  href={`/dashboard/bids/new?lookupId=${lookup.id}`}
                  className="flex-1"
                >
                  <Button size="sm" className="w-full">
                    Place Bid
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    refreshLookup(lookup.id);
                  }}
                  disabled={refreshingId === lookup.id}
                  title="Refresh bid amount"
                >
                  {refreshingId === lookup.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <a
                  href={lookup.auctionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button size="sm" variant="outline" title="View on auction site">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
