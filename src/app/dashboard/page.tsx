'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, TrendingUp, Ship, Gift, Plus } from 'lucide-react';

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
    // TODO: Fetch real data from API
    // Mock data for now
    setStats({
      totalBids: 5,
      wonBids: 3,
      activeShipments: 2,
      deliveredVehicles: 1,
    });
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">Manage your imports and track shipments</p>
        </div>

        {/* KYC Warning */}
        {user.kycStatus !== 'verified' && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      KYC Pending
                    </Badge>
                    <p className="font-semibold text-yellow-800">Complete KYC Verification</p>
                  </div>
                  <p className="text-sm text-yellow-700">
                    You need to verify your identity before you can place bids.
                  </p>
                </div>
                <Link href="/dashboard/kyc">
                  <Button size="sm">
                    Verify Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalBids}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Auctions Won</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.wonBids}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Active Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand-dark">{stats.activeShipments}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.deliveredVehicles}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboard/bids/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-brand-dark text-white">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Plus className="h-12 w-12 text-brand-gold" />
                </div>
                <h3 className="font-bold mb-2">Request New Bid</h3>
                <p className="text-sm text-white/70">Submit an auction link</p>
              </CardContent>
            </Card>
          </Link>

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
                <Link href="/vehicles">
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
                          {shipment.vehicle.year} {shipment.vehicle.make} {shipment.vehicle.model}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          Status: {shipment.status.replace(/_/g, ' ')}
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

