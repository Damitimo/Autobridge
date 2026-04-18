'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, AlertCircle, Link2, Car, DollarSign, ExternalLink, Info } from 'lucide-react';

interface VehicleDetails {
  title: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  lotNumber: string;
  currentBid: number;
  buyNowPrice?: number;
  imageUrl?: string;
  images?: string[];
  location: string;
  damageType: string;
  odometer: string;
  auctionDate: string;
  auctionStatus?: string;
  auctionEnded?: boolean;
  dataLimited?: boolean;
  message?: string;
}

export default function NewBidRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState<'link' | 'details' | 'success'>('link');
  const [auctionLink, setAuctionLink] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(null);
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidUrl = (url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('copart.com') || lower.includes('iaai.com');
  };

  const fetchVehicleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vehicles/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ auctionLink }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVehicleDetails(data.vehicle);
        setStep('details');
      } else {
        setError(data.error || 'Failed to fetch vehicle details');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bids/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          auctionLink,
          maxBidAmount: parseFloat(maxBidAmount),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('success');
        setTimeout(() => {
          router.push('/dashboard/bids');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit bid request');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Bid Request Submitted!</h2>
            <p className="text-green-700 mb-4">
              We&apos;ll place your bid and notify you of the outcome.
            </p>
            <p className="text-sm text-green-600">Redirecting to your bids...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'details' && vehicleDetails) {
    return (
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => setStep('link')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Vehicle Details */}
          <div className="lg:col-span-2">
            {/* Data Limited Warning */}
            {vehicleDetails.dataLimited && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Limited data available</p>
                  <p className="text-xs mt-1">
                    Some vehicle details may be unavailable. Please verify on Copart before bidding.
                  </p>
                </div>
              </div>
            )}

            {/* Auction Ended Warning */}
            {vehicleDetails.auctionEnded && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Auction has ended</p>
                  <p className="text-xs mt-1">
                    This vehicle is no longer available for bidding.
                  </p>
                </div>
              </div>
            )}

            <Card>
              <CardContent className="pt-6">
                {/* Vehicle Image */}
                <div className="mb-6">
                  {vehicleDetails.imageUrl ? (
                    <Image
                      src={vehicleDetails.imageUrl}
                      alt={vehicleDetails.title}
                      width={600}
                      height={400}
                      className="rounded-lg object-cover w-full h-[300px]"
                    />
                  ) : (
                    <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                      <Car className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Vehicle Title */}
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold">
                    {vehicleDetails.year} {vehicleDetails.make} {vehicleDetails.model}
                  </h2>
                  <a
                    href={auctionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-dark hover:text-brand-gold flex items-center gap-1 text-sm"
                  >
                    View on Copart <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Vehicle Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block">Lot Number</span>
                    <span className="font-semibold">{vehicleDetails.lotNumber}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block">VIN</span>
                    <span className="font-semibold">{vehicleDetails.vin || 'See listing'}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block">Damage Type</span>
                    <span className="font-semibold">{vehicleDetails.damageType}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block">Odometer</span>
                    <span className="font-semibold">{vehicleDetails.odometer}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block">Location</span>
                    <span className="font-semibold">{vehicleDetails.location}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block">Auction Date</span>
                    <span className="font-semibold">{vehicleDetails.auctionDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Bid Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Place Your Bid</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Auction Status */}
                {vehicleDetails.auctionStatus && vehicleDetails.auctionStatus !== 'Unknown' && (
                  <div className={`mb-4 px-3 py-2 rounded-lg text-sm font-medium text-center ${
                    vehicleDetails.auctionEnded
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {vehicleDetails.auctionEnded ? 'Auction Ended' : `Status: ${vehicleDetails.auctionStatus}`}
                  </div>
                )}

                {/* Current Bid */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500">Current Bid</p>
                  <p className="text-3xl font-bold text-brand-dark">
                    ${vehicleDetails.currentBid.toLocaleString()}
                  </p>
                  {vehicleDetails.buyNowPrice && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-500">Buy Now Price</p>
                      <p className="text-xl font-semibold text-green-600">
                        ${vehicleDetails.buyNowPrice.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bid Form */}
                <form onSubmit={handleSubmitBid} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Maximum Bid (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="number"
                        placeholder={`Min: $${(vehicleDetails.currentBid + 100).toLocaleString()}`}
                        value={maxBidAmount}
                        onChange={(e) => setMaxBidAmount(e.target.value)}
                        required
                        min={vehicleDetails.currentBid + 100}
                        step="100"
                        className="pl-10 text-lg"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      We&apos;ll bid up to this amount on your behalf
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !maxBidAmount || parseFloat(maxBidAmount) <= vehicleDetails.currentBid || vehicleDetails.auctionEnded}
                    className="w-full bg-brand-dark hover:bg-brand-dark/90"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : vehicleDetails.auctionEnded ? (
                      'Auction Ended'
                    ) : (
                      'Submit Bid Request'
                    )}
                  </Button>
                </form>

                <p className="text-xs text-gray-400 mt-4 text-center">
                  By submitting, you agree to our bidding terms
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/dashboard/bids" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Bids
      </Link>

      <Card>
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-6 h-6 text-brand-gold" />
          </div>
          <CardTitle>Request a New Bid</CardTitle>
          <CardDescription>
            Paste a Copart or IAAI auction link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={fetchVehicleDetails} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <Input
                type="url"
                placeholder="https://www.copart.com/lot/12345678"
                value={auctionLink}
                onChange={(e) => setAuctionLink(e.target.value)}
                required
                className="w-full"
              />
              {auctionLink && !isValidUrl(auctionLink) && (
                <p className="text-sm text-red-500 mt-2 text-center">
                  Please enter a valid Copart or IAAI URL
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !auctionLink || !isValidUrl(auctionLink)}
              className="w-full bg-brand-dark hover:bg-brand-dark/90"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Details...
                </>
              ) : (
                'Look Up Vehicle'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
