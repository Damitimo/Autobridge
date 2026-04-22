'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Loader2, Clock, Ship, AlertTriangle } from 'lucide-react';

interface CostItem {
  category: string;
  amount: number;
  description: string;
}

interface CostEstimate {
  breakdown: CostItem[];
  totalUSD: number;
  totalNGN: number;
  exchangeRate: number;
  estimatedDeliveryDays: number;
  shippingMethod: string;
  disclaimer: string;
}

interface CostBreakdownProps {
  vehiclePrice: number;
  auctionSource?: 'copart' | 'iaai';
  location?: string;
  vehicleYear?: number;
  hasKeys?: boolean;
  isRunning?: boolean;
  shippingMethod?: 'roro' | 'container_shared' | 'container_exclusive';
}

export default function CostBreakdown({
  vehiclePrice,
  auctionSource = 'copart',
  location,
  vehicleYear,
  hasKeys = true,
  isRunning = true,
  shippingMethod = 'roro',
}: CostBreakdownProps) {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState('');

  const fetchEstimate = useCallback(async () => {
    if (!vehiclePrice || vehiclePrice <= 0) {
      setEstimate(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cost-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehiclePrice,
          auctionSource,
          auctionLocationState: location,
          vehicleYear,
          hasKeys,
          isRunning,
          shippingMethod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEstimate(data.estimate);
      } else {
        setError(data.error || 'Failed to calculate estimate');
      }
    } catch (err) {
      setError('Failed to calculate estimate');
    } finally {
      setLoading(false);
    }
  }, [vehiclePrice, auctionSource, location, vehicleYear, hasKeys, isRunning, shippingMethod]);

  // Debounce the fetch to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vehiclePrice > 0) {
        fetchEstimate();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [vehiclePrice, fetchEstimate]);

  if (!vehiclePrice || vehiclePrice <= 0) {
    return null;
  }

  if (loading && !estimate) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Calculating landing cost...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mt-4 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100/50 transition-colors text-left"
      >
        <span className="font-semibold text-blue-900 flex items-center gap-2">
          Estimated Landing Cost
          {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        </span>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <p className="text-lg font-bold text-blue-900">${estimate.totalUSD.toLocaleString()}</p>
            <p className="text-xs text-blue-600">₦{estimate.totalNGN.toLocaleString()}</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-blue-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-blue-200">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-3 mb-4">
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <Clock className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Est. Delivery</p>
              <p className="font-bold text-indigo-900">{estimate.estimatedDeliveryDays} days</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <Ship className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Shipping</p>
              <p className="font-bold text-indigo-900 text-sm">
                {estimate.shippingMethod === 'roro' ? 'RoRo' :
                 estimate.shippingMethod === 'container_shared' ? 'Shared' : 'Exclusive'}
              </p>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-2">
            {estimate.breakdown.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between py-2 ${
                  index < estimate.breakdown.length - 1 ? 'border-b border-blue-100' : ''
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.category}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <p className="font-semibold text-gray-900">${item.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t-2 border-blue-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900">Total Estimated Cost</span>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-900">${estimate.totalUSD.toLocaleString()}</p>
                <p className="text-sm text-blue-600">₦{estimate.totalNGN.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Exchange rate: $1 = ₦{estimate.exchangeRate.toLocaleString()}
          </p>

          {/* Disclaimer */}
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700">{estimate.disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
