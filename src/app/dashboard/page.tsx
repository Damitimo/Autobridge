'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Car, TrendingUp, Ship, Gift, Plus, Link2, ArrowRight, Loader2, History, X, ExternalLink } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kycStatus: string;
  referralCode: string;
}

interface Shipment {
  id: string;
  status: string;
  vehicle: {
    year: number;
    make: string;
    model: string;
  };
  estimatedArrivalAt?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalBids: 0,
    wonBids: 0,
    activeShipments: 0,
    deliveredVehicles: 0,
  });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [auctionUrl, setAuctionUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlHistory, setUrlHistory] = useState<{ url: string; title: string; date: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // Load URL history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('urlHistory');
    if (saved) {
      setUrlHistory(JSON.parse(saved));
    }
  }, []);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveUrlToHistory = (url: string) => {
    const newEntry = {
      url,
      title: extractTitleFromUrl(url),
      date: new Date().toISOString(),
    };
    const updated = [newEntry, ...urlHistory.filter(h => h.url !== url)].slice(0, 10);
    setUrlHistory(updated);
    localStorage.setItem('urlHistory', JSON.stringify(updated));
  };

  const extractTitleFromUrl = (url: string) => {
    // Extract lot number and basic info from URL
    const lotMatch = url.match(/lot\/(\d+)/);
    const lotNumber = lotMatch ? lotMatch[1] : '';
    if (url.includes('copart.com')) {
      return `Copart Lot #${lotNumber}`;
    } else if (url.includes('iaai.com')) {
      return `IAAI Lot #${lotNumber}`;
    }
    return 'Auction Link';
  };

  const clearHistory = () => {
    setUrlHistory([]);
    localStorage.removeItem('urlHistory');
    setShowHistory(false);
  };

  useEffect(() => {
    // First check localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchDashboardData();
      return;
    }

    // Then check NextAuth session
    if (status === 'authenticated' && session?.user) {
      const sessionUser = {
        id: (session.user as any).id || '',
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email || '',
        kycStatus: 'pending',
        referralCode: 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      };
      setUser(sessionUser);
      // Store in localStorage for future use
      localStorage.setItem('user', JSON.stringify(sessionUser));
      fetchDashboardData();
      return;
    }

    // If not authenticated and finished loading, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch real stats from API
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

      // Fetch recent shipments
      const shipmentsResponse = await fetch('/api/shipments?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (shipmentsResponse.ok) {
        const shipmentsData = await shipmentsResponse.json();
        if (shipmentsData.success) {
          setRecentShipments(shipmentsData.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* KYC Warning - Compact at top */}
        {user.kycStatus !== 'verified' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                KYC Pending
              </Badge>
              <span className="text-sm text-yellow-800">
                Verify your identity to place bids
              </span>
            </div>
            <Link href="/dashboard/kyc">
              <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-800 hover:bg-yellow-100">
                Verify Now
              </Button>
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-gray-600">Manage your imports and track shipments</p>
        </div>

        {/* Quick Bid Request */}
        <Card className="mb-8 bg-brand-dark text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Request a Bid</h3>
              </div>
              <div className="relative" ref={historyRef}>
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1 text-sm text-white/80 hover:text-white hover:underline"
                >
                  <History className="h-4 w-4" />
                  View History
                </button>

                {/* History Dropdown */}
                {showHistory && (
                  <div className="absolute right-0 top-8 w-80 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">Recent URLs</span>
                      {urlHistory.length > 0 && (
                        <button
                          onClick={clearHistory}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {urlHistory.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No URLs in history
                        </div>
                      ) : (
                        urlHistory.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setShowHistory(false);
                              router.push(`/dashboard/bids/new?url=${encodeURIComponent(item.url)}`);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate">{item.url}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-brand-dark flex-shrink-0 ml-2" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-white/80 mb-4">
              Paste a Copart or IAAI auction link to get started
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (auctionUrl.trim()) {
                  setUrlLoading(true);
                  saveUrlToHistory(auctionUrl.trim());
                  router.push(`/dashboard/bids/new?url=${encodeURIComponent(auctionUrl)}`);
                }
              }}
              className="flex gap-3"
            >
              <Input
                type="url"
                placeholder="https://www.copart.com/lot/12345678"
                value={auctionUrl}
                onChange={(e) => setAuctionUrl(e.target.value)}
                className="flex-1 bg-white text-gray-900"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-brand-gold text-brand-dark hover:bg-yellow-400"
                disabled={!auctionUrl.trim() || urlLoading}
              >
                {urlLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Go <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboard/bids">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalBids}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/bids?status=won">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Auctions Won</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{stats.wonBids}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/shipments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Active Shipments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand-dark">{stats.activeShipments}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/shipments?status=delivered">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.deliveredVehicles}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/bids">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <TrendingUp className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="font-bold mb-2">My Bids</h3>
                <p className="text-sm text-gray-600">Track your auction bids</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/shipments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Ship className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2">Shipments</h3>
                <p className="text-sm text-gray-600">Track your vehicles</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/messages">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Car className="h-12 w-12 text-brand-dark" />
                </div>
                <h3 className="font-bold mb-2">Messages</h3>
                <p className="text-sm text-gray-600">Chat with support</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            {recentShipments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No shipments yet</p>
                <Link href="/dashboard/bids/new">
                  <Button>Start Browsing Vehicles</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentShipments.map((shipment) => (
                  <Link key={shipment.id} href={`/dashboard/shipments/${shipment.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div>
                        <p className="font-semibold">
                          {shipment.vehicle?.year} {shipment.vehicle?.make} {shipment.vehicle?.model}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          Status: {shipment.status?.replace(/_/g, ' ') || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {shipment.estimatedArrivalAt ? 'ETA' : 'In Progress'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card className="mt-8 bg-gradient-to-r from-brand-dark to-primary-800 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-6 w-6" />
              <h3 className="text-xl font-bold">Refer & Earn</h3>
            </div>
            <p className="mb-4">Share your referral code and earn ₦50,000 for each successful referral</p>
            <div className="bg-white text-gray-900 px-4 py-3 rounded-lg font-mono font-bold text-lg inline-block">
              {user.referralCode}
            </div>
            <Button variant="outline" className="ml-4 border-white text-white bg-transparent hover:bg-white/10">
              Copy Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

