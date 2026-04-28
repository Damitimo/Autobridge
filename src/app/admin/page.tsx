'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Ship,
  Gavel,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface Stats {
  users: {
    total: number;
    pendingKyc: number;
    verifiedKyc: number;
    newThisWeek: number;
  };
  bids: {
    total: number;
    active: number;
    won: number;
    newThisWeek: number;
  };
  shipments: {
    total: number;
    active: number;
    delivered: number;
    newThisMonth: number;
    byStatus: { status: string; count: number }[];
  };
}

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kycStatus: string;
  createdAt: string;
}

interface RecentBid {
  id: string;
  status: string;
  maxBidAmount: string;
  createdAt: string;
  userId: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentBids, setRecentBids] = useState<RecentBid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRecentUsers(data.recentActivity.users);
        setRecentBids(data.recentActivity.bids);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getBidBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge className="bg-green-100 text-green-800">Won</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Lost</Badge>;
      case 'outbid':
        return <Badge className="bg-orange-100 text-orange-800">Outbid</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold">{stats?.users.total || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats?.users.newThisWeek || 0} this week
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending KYC</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.users.pendingKyc || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.users.verifiedKyc || 0} verified
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Bids</p>
                <p className="text-3xl font-bold">{stats?.bids.active || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats?.bids.won || 0} won total
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Gavel className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Shipments</p>
                <p className="text-3xl font-bold">{stats?.shipments.active || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats?.shipments.delivered || 0} delivered
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Ship className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(stats?.users.pendingKyc || 0) > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {stats?.users.pendingKyc} KYC verification{(stats?.users.pendingKyc || 0) > 1 ? 's' : ''} pending
                  </p>
                  <p className="text-sm text-yellow-700">Review and approve user documents</p>
                </div>
              </div>
              <Link href="/admin/users?filter=pending_kyc">
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  Review Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users yet</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getKycBadge(user.kycStatus)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Bids */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Bids</CardTitle>
            <Link href="/admin/bids">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBids.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No bids yet</p>
              ) : (
                recentBids.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">
                        ${parseFloat(bid.maxBidAmount).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(bid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getBidBadge(bid.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shipments by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {stats?.shipments.byStatus.map((item) => (
              <div key={item.status} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-brand-dark">{item.count}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {item.status?.replace(/_/g, ' ') || 'Unknown'}
                </p>
              </div>
            )) || (
              <p className="text-gray-500 col-span-full text-center py-4">No shipments yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
