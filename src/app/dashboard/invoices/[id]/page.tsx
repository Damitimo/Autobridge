'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ArrowLeft,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface LineItem {
  description: string;
  amount: number;
  currency: string;
}

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
  lineItems: LineItem[] | null;
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    lotNumber: string;
    imageUrl: string;
  } | null;
  bid: {
    id: string;
    maxBidAmount: string;
    finalBidAmount: string;
    status: string;
  } | null;
  shipment: {
    id: string;
    status: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  paid: 'bg-green-100 text-green-800 border-green-300',
  overdue: 'bg-red-100 text-red-800 border-red-300',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  paid: CheckCircle,
  overdue: AlertTriangle,
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/invoices/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          setInvoice(data.data);
        } else {
          router.push('/dashboard/invoices');
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id, router]);

  const formatCurrency = (amount: number | string, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (currency === 'NGN') {
      return `₦${num.toLocaleString()}`;
    }
    return `$${num.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePayment = async () => {
    if (!invoice) return;
    setPaying(true);
    // Redirect to payment page (implement Paystack payment)
    // For now, just show loading
    setTimeout(() => {
      setPaying(false);
      alert('Payment integration coming soon');
    }, 1000);
  };

  const StatusIcon = invoice ? STATUS_ICONS[invoice.status] || Clock : Clock;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && invoice.status === 'pending';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard/invoices" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Invoices
      </Link>

      {/* Invoice Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Invoice #{invoice.id.slice(0, 8).toUpperCase()}</p>
              <h1 className="text-2xl font-bold">
                {invoice.vehicle
                  ? `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}`
                  : 'Invoice'}
              </h1>
            </div>
            <Badge className={`${STATUS_COLORS[invoice.status]} border text-sm px-3 py-1`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {invoice.status.toUpperCase()}
            </Badge>
          </div>

          {/* Vehicle Image */}
          {invoice.vehicle?.imageUrl && (
            <div className="relative h-48 rounded-lg overflow-hidden mb-6 bg-gray-100">
              <Image
                src={invoice.vehicle.imageUrl}
                alt={`${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}`}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium">{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            )}
            {invoice.paidAt && (
              <div>
                <p className="text-gray-500">Paid On</p>
                <p className="font-medium text-green-600">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoice.lineItems && invoice.lineItems.length > 0 ? (
              invoice.lineItems.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b last:border-0">
                  <span className="text-gray-700">{item.description}</span>
                  <span className="font-medium">{formatCurrency(item.amount, item.currency)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between py-2">
                <span className="text-gray-700">
                  {invoice.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Invoice'}
                </span>
                <span className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between pt-4 border-t-2 mt-4">
              <span className="text-lg font-bold">Total</span>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(invoice.amount, invoice.currency)}</p>
                {invoice.ngnEquivalent && invoice.currency === 'USD' && (
                  <p className="text-sm text-gray-500">
                    ≈ ₦{parseFloat(invoice.ngnEquivalent).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      {invoice.status === 'pending' && (
        <Card className={isOverdue ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="p-6">
            {isOverdue && (
              <div className="flex items-center gap-2 text-red-700 mb-4">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">This invoice is overdue. Please pay immediately to avoid penalties.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 bg-brand-dark hover:bg-primary-700"
                onClick={handlePayment}
                disabled={paying}
              >
                {paying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                Pay {formatCurrency(invoice.amount, invoice.currency)}
              </Button>

              <Button variant="outline" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {invoice.status === 'paid' && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Complete</h3>
            <p className="text-green-700">
              Thank you for your payment. Your shipment is being processed.
            </p>
            {invoice.shipment && (
              <Link href={`/dashboard/shipments/${invoice.shipment.id}`}>
                <Button className="mt-4">Track Shipment</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
