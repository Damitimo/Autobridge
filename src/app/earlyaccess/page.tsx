import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Car,
  DollarSign,
  MapPin,
  Shield,
  Ship,
  Calculator,
  FileText,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function EarlyAccessPage() {
  const valueProps = [
    {
      icon: Car,
      title: 'Access U.S. Auctions',
      description: 'Bid on vehicles from Copart and IAAI through our broker account. No dealer license needed.',
    },
    {
      icon: Calculator,
      title: 'Know Your Costs Upfront',
      description: 'Our cost calculator shows your exact landed cost in Nigeria before you commit.',
    },
    {
      icon: MapPin,
      title: 'Real-Time Tracking',
      description: 'Track your vehicle at every stage: auction yard → US port → vessel → Lagos → customs → delivery.',
    },
    {
      icon: DollarSign,
      title: 'Pay in Naira',
      description: 'Secure payments via bank transfer or card. No need to source dollars yourself.',
    },
    {
      icon: Ship,
      title: 'End-to-End Logistics',
      description: 'We handle towing, shipping, customs clearance, and final delivery to your location.',
    },
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description: 'Photos at every stage, all documents accessible, clear invoices with itemized costs.',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Tell Us What You Want',
      description: 'Share the auction listing or describe the vehicle you\'re looking for'
    },
    {
      step: '2',
      title: 'Get Your Cost Breakdown',
      description: 'We calculate auction fees, shipping, customs duty, and all other costs'
    },
    {
      step: '3',
      title: 'Pay 10% Deposit',
      description: 'Lock in your bid with a refundable deposit if you don\'t win'
    },
    {
      step: '4',
      title: 'We Bid For You',
      description: 'Our team places bids on your behalf using our broker account'
    },
    {
      step: '5',
      title: 'Pay Balance When You Win',
      description: 'Complete payment within auction deadline (typically 48 hours)'
    },
    {
      step: '6',
      title: 'Track Your Shipment',
      description: 'Follow your vehicle from auction to your doorstep with photos at each stage'
    },
  ];

  const costExample = {
    auctionPrice: 8000,
    auctionFees: 330,
    towingFee: 150,
    shippingRoRo: 1200,
    customsDuty: 4400,
    serviceFee: 200,
    otherFees: 720,
  };

  const totalUSD = Object.values(costExample).reduce((a, b) => a + b, 0);
  const exchangeRate = 1550;
  const totalNGN = totalUSD * exchangeRate;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-dark via-gray-900 to-black text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Import Cars from U.S. Auctions
              <span className="text-brand-gold block mt-2">Without the Headache</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
              We bid on your behalf, handle shipping, clear customs, and deliver to your doorstep. You just pick the car.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/register">
                <Button size="lg" className="bg-brand-gold text-brand-dark hover:bg-yellow-500 text-lg px-8 py-6">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-to-buy">
                <Button size="lg" variant="outline" className="border-white text-brand-dark bg-white hover:bg-gray-100 text-lg px-8 py-6">
                  How It Works
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-gold" />
                <span>No dealer license needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-gold" />
                <span>Pay in Naira</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-gold" />
                <span>$200 flat service fee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Tired of the Traditional Import Process?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Problems */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-red-500">
                <h3 className="font-bold text-lg mb-4 text-red-600">The Old Way</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    Need a U.S. dealer license to bid
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    Hidden fees revealed after purchase
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    No visibility during shipping
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    Coordinate multiple vendors yourself
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    Source dollars at bad rates
                  </li>
                </ul>
              </div>

              {/* Solution */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-green-500">
                <h3 className="font-bold text-lg mb-4 text-green-600">With AutoBridge</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    We bid using our broker account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Full cost breakdown before you commit
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Track every stage with photos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    One platform handles everything
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Pay in Naira at competitive rates
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need in One Platform</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {valueProps.map((prop, index) => {
              const Icon = prop.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-brand-gold/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-brand-gold" />
                    </div>
                    <CardTitle className="text-lg">{prop.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{prop.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cost Calculator Preview */}
      <section className="py-16 bg-brand-dark text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Know Your Exact Cost Before You Bid</h2>
              <p className="text-gray-300">
                Example: 2020 Toyota Camry with $8,000 auction price
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 md:p-8 text-gray-900">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium">Auction Price</span>
                  <span className="text-xl font-bold">${costExample.auctionPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auction Buyer Fees</span>
                  <span>${costExample.auctionFees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Towing to Port</span>
                  <span>${costExample.towingFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping (RoRo to Lagos)</span>
                  <span>${costExample.shippingRoRo.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nigerian Customs Duty</span>
                  <span>${costExample.customsDuty.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AutoBridge Service Fee</span>
                  <span>${costExample.serviceFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Fees (clearing, delivery)</span>
                  <span>${costExample.otherFees}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-brand-dark">
                  <span className="font-bold text-lg">Total Landed Cost</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-dark">${totalUSD.toLocaleString()}</p>
                    <p className="text-lg text-gray-600">≈ ₦{totalNGN.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 text-center">
                  * Actual costs vary based on vehicle type, auction location, and current exchange rates
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600">Simple 6-step process from finding your car to delivery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-gold text-brand-dark rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Dealers Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Built for Nigerian Car Dealers</h2>
            <p className="text-xl text-gray-600 mb-8">
              Whether you import 5 or 50 cars a year, AutoBridge helps you scale your business with confidence.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <Card>
                <CardContent className="pt-6">
                  <FileText className="h-8 w-8 text-brand-gold mb-4" />
                  <h3 className="font-bold mb-2">All Documents in One Place</h3>
                  <p className="text-sm text-gray-600">
                    Bill of lading, customs declarations, duty receipts - all accessible from your dashboard.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Calculator className="h-8 w-8 text-brand-gold mb-4" />
                  <h3 className="font-bold mb-2">Know Your Margins</h3>
                  <p className="text-sm text-gray-600">
                    Calculate landed cost instantly to ensure profitable purchases every time.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Ship className="h-8 w-8 text-brand-gold mb-4" />
                  <h3 className="font-bold mb-2">Track Multiple Shipments</h3>
                  <p className="text-sm text-gray-600">
                    Manage all your vehicles in one dashboard with real-time status updates.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-dark">
            Ready to Import Your Next Vehicle?
          </h2>
          <p className="text-xl mb-8 text-brand-dark/80 max-w-2xl mx-auto">
            Create your free account and let us handle the rest. First-time importers welcome.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-brand-dark text-white hover:bg-gray-800 text-lg px-10 py-6">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-brand-dark/60">
            No credit card required · ₦100,000 signup fee only when you place your first bid
          </p>
        </div>
      </section>
    </div>
  );
}
