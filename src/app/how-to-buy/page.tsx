import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Calculator,
  CreditCard,
  Gavel,
  DollarSign,
  Ship,
  MapPin,
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function HowToBuyPage() {
  const steps = [
    {
      step: '1',
      icon: MessageSquare,
      title: 'Tell Us What You Want',
      description: 'Share a link to the auction listing (Copart or IAAI) or describe the vehicle you\'re looking for. Our team will help you find the right car.',
    },
    {
      step: '2',
      icon: Calculator,
      title: 'Get Your Full Cost Breakdown',
      description: 'We calculate everything: auction price, buyer fees, towing, shipping, customs duty, and all other costs. No surprises.',
    },
    {
      step: '3',
      icon: CreditCard,
      title: 'Pay 10% Deposit',
      description: 'Lock in your bid with a 10% deposit. This is fully refundable if you don\'t win the auction.',
    },
    {
      step: '4',
      icon: Gavel,
      title: 'We Bid On Your Behalf',
      description: 'Our team places bids using our licensed broker account. You\'ll be notified immediately when the auction ends.',
    },
    {
      step: '5',
      icon: DollarSign,
      title: 'Pay Balance When You Win',
      description: 'Complete your payment within the auction deadline (typically 48 hours). Pay in Naira via bank transfer or card.',
    },
    {
      step: '6',
      icon: Truck,
      title: 'Vehicle Processing',
      description: 'We handle towing from the auction yard to the port, title transfer, and all export documentation.',
    },
    {
      step: '7',
      icon: Ship,
      title: 'Shipping to Nigeria',
      description: 'Your vehicle ships via RoRo or container to Lagos. Track the vessel in real-time from your dashboard.',
    },
    {
      step: '8',
      icon: MapPin,
      title: 'Customs & Delivery',
      description: 'We clear customs at Apapa port and deliver to your location. Receive photos at every stage.',
    },
  ];

  const faqs = [
    {
      question: 'How long does the entire process take?',
      answer: '8-12 weeks from winning the auction to delivery in Nigeria. Shipping takes 5-7 weeks, customs clearance 1-2 weeks.',
    },
    {
      question: 'What if I don\'t win the auction?',
      answer: 'Your 10% deposit is fully refundable. We\'ll help you bid on another vehicle.',
    },
    {
      question: 'Can I inspect the car before bidding?',
      answer: 'Auction vehicles are sold as-is. We provide all available photos and condition reports. For high-value vehicles, we can arrange third-party inspection.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'Bank transfer and card payments in Naira. We handle the currency conversion.',
    },
    {
      question: 'What\'s included in your service fee?',
      answer: '$200 flat fee covers bidding, coordination, documentation, and tracking. Shipping and customs are separate.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-brand-dark text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How to Buy</h1>
            <p className="text-xl text-gray-300">
              Import your car from U.S. auctions in 8 simple steps. We handle everything.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Steps */}
          <div className="space-y-6 mb-16">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-brand-gold text-brand-dark rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-brand-gold">Step {item.step}</span>
                        </div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-[82px]">
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-16">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Important to Know</h3>
                <ul className="space-y-2 text-amber-700 text-sm">
                  <li>• Auction vehicles are sold as-is. Review all photos and condition reports carefully.</li>
                  <li>• Payment deadline is strict. Late payment forfeits your deposit.</li>
                  <li>• Shipping times can vary based on vessel schedules and port congestion.</li>
                  <li>• Customs duty is calculated based on vehicle age and engine size.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-brand-dark text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Import Your First Car?</h2>
            <p className="mb-6 text-gray-300">Create your account and tell us what you&apos;re looking for</p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-brand-gold text-brand-dark hover:bg-yellow-500">
                Get Started
              </Button>
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              ₦100,000 signup fee only when you place your first bid
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
