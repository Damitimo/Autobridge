'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, ArrowRight, AlertCircle } from 'lucide-react';

interface Invoice {
  id: string;
  type: string;
  amount: string;
  currency: string;
  ngnEquivalent: string | null;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  vehicle: {
    year: number;
    make: string;
    model: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const TYPE_LABELS: Record<string, string> = {
  signup_fee: 'Signup Fee',
  car_purchase: 'Vehicle Purchase',
  towing: 'Towing Fee',
  shipping: 'Shipping Fee',
  relisting_fee: 'Relisting Fee',
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch('/api/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          setInvoices(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [router]);

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    if (currency === 'NGN') {
      return `₦${num.toLocaleString()}`;
    }
    return `$${num.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invoices</h1>
        <p className="text-gray-600">View and pay your invoices</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
            <p className="text-gray-600 mb-4">
              Your invoices will appear here when you win auctions.
            </p>
            <Link href="/dashboard/bids/new">
              <Button>Start Bidding</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={STATUS_COLORS[invoice.status] || 'bg-gray-100'}>
                          {invoice.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {TYPE_LABELS[invoice.type] || invoice.type}
                        </span>
                      </div>

                      {invoice.vehicle && (
                        <p className="font-semibold text-lg mb-1">
                          {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Created: {formatDate(invoice.createdAt)}</span>
                        {invoice.dueDate && invoice.status === 'pending' && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                            Due: {formatDate(invoice.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </p>
                      {invoice.ngnEquivalent && invoice.currency === 'USD' && (
                        <p className="text-sm text-gray-500">
                          ≈ ₦{parseFloat(invoice.ngnEquivalent).toLocaleString()}
                        </p>
                      )}
                      <ArrowRight className="h-5 w-5 text-gray-400 mt-2 ml-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
