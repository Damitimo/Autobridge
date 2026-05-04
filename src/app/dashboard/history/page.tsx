'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  History,
  Car,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  auctionDateTime: string | null;
  createdAt: string;
  updatedAt: string;
  status?: 'won' | 'lost' | 'pending' | 'placed' | 'outbid' | 'not_bid' | null;
}

type SortKey =
  | 'title'
  | 'lotNumber'
  | 'source'
  | 'currentBid'
  | 'location'
  | 'auctionDate'
  | 'status'
  | 'updatedAt';

type SortDir = 'asc' | 'desc';

type DateFilter = 'all' | 'today' | '7d' | '30d';
type StatusFilter = 'all' | 'won' | 'lost' | 'pending' | 'not_bid' | 'sale_ended';

const PAGE_SIZE = 8;

const STATUS_LABEL: Record<string, string> = {
  won: 'Won',
  lost: 'Lost',
  pending: 'Pending',
  placed: 'Placed',
  outbid: 'Outbid',
  not_bid: 'Not Bid',
  sale_ended: 'Sale Ended',
};

const STATUS_STYLES: Record<string, string> = {
  won: 'bg-green-100 text-green-700 border border-green-200',
  lost: 'bg-red-100 text-red-700 border border-red-200',
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  placed: 'bg-blue-100 text-blue-700 border border-blue-200',
  outbid: 'bg-orange-100 text-orange-700 border border-orange-200',
  not_bid: 'bg-gray-100 text-gray-600 border border-gray-200',
  sale_ended: 'bg-amber-100 text-amber-700 border border-amber-200',
};

export default function HistoryPage() {
  const [lookups, setLookups] = useState<VehicleLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  // Reset to first page whenever filters/sort change
  useEffect(() => {
    setPage(0);
  }, [dateFilter, statusFilter, sortKey, sortDir]);

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
        setLookups(prev => prev.map(l => (l.id === id ? { ...l, ...data.lookup } : l)));
      } else {
        if (!isRefreshingAll) alert(data.error || 'Failed to refresh');
      }
    } catch (err) {
      if (!isRefreshingAll) alert('Failed to refresh vehicle data');
    } finally {
      setRefreshingId(null);
    }
  };

  const refreshAllVisible = async (rows: VehicleLookup[]) => {
    if (isRefreshingAll || rows.length === 0) return;
    setIsRefreshingAll(true);
    try {
      // Sequential, one-at-a-time — avoids hammering Copart/IAAI
      for (const row of rows) {
        await refreshLookup(row.id);
      }
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0';
    const num = parseFloat(amount);
    return `$${num.toLocaleString()}`;
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const filteredSorted = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const dateOk = (l: VehicleLookup) => {
      if (dateFilter === 'all') return true;
      const ts = new Date(l.updatedAt).getTime();
      if (dateFilter === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return ts >= start.getTime();
      }
      if (dateFilter === '7d') return now - ts <= 7 * dayMs;
      if (dateFilter === '30d') return now - ts <= 30 * dayMs;
      return true;
    };

    const statusOf = (l: VehicleLookup) => {
      if (l.status) return l.status;
      if (l.auctionDateTime && new Date(l.auctionDateTime).getTime() < Date.now()) {
        return 'sale_ended';
      }
      return 'not_bid';
    };

    const statusOk = (l: VehicleLookup) => {
      if (statusFilter === 'all') return true;
      return statusOf(l) === statusFilter;
    };

    const filtered = lookups.filter(l => dateOk(l) && statusOk(l));

    const compare = (a: VehicleLookup, b: VehicleLookup) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const av = (() => {
        switch (sortKey) {
          case 'currentBid': return parseFloat(a.currentBid || '0');
          case 'updatedAt': return new Date(a.updatedAt).getTime();
          case 'status': return statusOf(a);
          default: return (a[sortKey as keyof VehicleLookup] ?? '') as string | number;
        }
      })();
      const bv = (() => {
        switch (sortKey) {
          case 'currentBid': return parseFloat(b.currentBid || '0');
          case 'updatedAt': return new Date(b.updatedAt).getTime();
          case 'status': return statusOf(b);
          default: return (b[sortKey as keyof VehicleLookup] ?? '') as string | number;
        }
      })();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    };

    return [...filtered].sort(compare);
  }, [lookups, dateFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filteredSorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-6 w-6" />
            Vehicle Lookup History
          </h1>
          <p className="text-gray-600">Vehicles you've previously checked</p>
        </div>
        <Button
          onClick={() => refreshAllVisible(pagedRows)}
          variant="outline"
          size="sm"
          disabled={isRefreshingAll || pagedRows.length === 0}
        >
          {isRefreshingAll ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRefreshingAll ? 'Refreshing…' : 'Refresh All'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-dark"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-dark"
            >
              <option value="all">All statuses</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="pending">Pending</option>
              <option value="sale_ended">Sale Ended</option>
              <option value="not_bid">Not Bid</option>
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{pagedRows.length}</span> of {filteredSorted.length}
            {filteredSorted.length !== lookups.length && (
              <> (filtered from {lookups.length})</>
            )}
          </div>
        </CardContent>
      </Card>

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
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 w-16">Image</th>
                  <th className="px-4 py-3">
                    <button onClick={() => toggleSort('title')} className="inline-flex items-center gap-1 hover:text-gray-900">
                      Vehicle <SortIcon column="title" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => toggleSort('source')} className="inline-flex items-center gap-1 hover:text-gray-900">
                      Source <SortIcon column="source" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => toggleSort('currentBid')} className="inline-flex items-center gap-1 hover:text-gray-900">
                      Current Bid <SortIcon column="currentBid" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => toggleSort('location')} className="inline-flex items-center gap-1 hover:text-gray-900">
                      Location <SortIcon column="location" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => toggleSort('auctionDate')} className="inline-flex items-center gap-1 hover:text-gray-900">
                      Auction Date <SortIcon column="auctionDate" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 hover:text-gray-900">
                      Status <SortIcon column="status" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => toggleSort('updatedAt')} className="inline-flex items-center gap-1 hover:text-gray-900">
                      Last Checked <SortIcon column="updatedAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      No vehicles match the selected filters.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((lookup) => {
                    const saleEnded = !!lookup.auctionDateTime
                      && new Date(lookup.auctionDateTime).getTime() < Date.now();
                    const status = lookup.status ?? (saleEnded ? 'sale_ended' : 'not_bid');
                    return (
                      <tr key={lookup.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="relative h-10 w-14 bg-gray-100 rounded overflow-hidden">
                            {lookup.imageUrl ? (
                              <Image src={lookup.imageUrl} alt={lookup.title} fill className="object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Car className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/bids/new?lookupId=${lookup.id}`}
                              className="font-medium text-gray-900 hover:text-brand-dark"
                            >
                              {lookup.title}
                            </Link>
                            <a
                              href={lookup.auctionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on auction site"
                              className="text-gray-400 hover:text-brand-dark flex-shrink-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                          {lookup.damageType && (
                            <div className="text-xs text-gray-500">{lookup.damageType}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${
                            lookup.source === 'copart' ? 'bg-blue-600' : 'bg-purple-600'
                          }`}>
                            {lookup.source.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-700">
                          {refreshingId === lookup.id ? (
                            <span className="inline-flex items-center gap-1.5 text-gray-400">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span className="text-xs">Refreshing…</span>
                            </span>
                          ) : (
                            formatCurrency(lookup.currentBid)
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{lookup.location || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{lookup.auctionDate || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(lookup.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {status === 'won' ? (
                              <Link href="/dashboard/shipments">
                                <Button size="sm" className="min-w-[88px]">View</Button>
                              </Link>
                            ) : status === 'lost' || status === 'sale_ended' ? null : (
                              <Link href={`/dashboard/bids/new?lookupId=${lookup.id}`}>
                                <Button size="sm" className="min-w-[88px]">Place Bid</Button>
                              </Link>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => refreshLookup(lookup.id)}
                              disabled={refreshingId === lookup.id}
                              title="Refresh bid amount"
                            >
                              {refreshingId === lookup.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredSorted.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold text-gray-900">{safePage + 1}</span> of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={safePage === 0 || isRefreshingAll}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1 || isRefreshingAll}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
