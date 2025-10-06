import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function HowToBuyPage() {
  const steps = [
    {
      step: '1',
      title: 'Create Your Free Account',
      description: 'Sign up in minutes. No fees to browse or search vehicles.',
    },
    {
      step: '2',
      title: 'Browse & Select Vehicle',
      description: 'Search 100,000+ vehicles from Copart and IAAI. Use our AI cost calculator to see total landed cost in Nigeria.',
    },
    {
      step: '3',
      title: 'Place Your Bid',
      description: 'We bid on your behalf using our licensed broker account. Set your maximum bid and we handle the rest.',
    },
    {
      step: '4',
      title: 'Make Payment',
      description: 'When you win, pay securely in Naira. We accept bank transfers and cards. Funds held in escrow.',
    },
    {
      step: '5',
      title: 'Vehicle Processing',
      description: 'We handle towing, title transfer, and shipping documentation. Track everything in real-time.',
    },
    {
      step: '6',
      title: 'Shipping & Customs',
      description: 'Your vehicle is shipped via RoRo or container. We clear customs and handle all Nigerian documentation.',
    },
    {
      step: '7',
      title: 'Delivery',
      description: 'Final delivery to your location in Nigeria. Full support throughout the process.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">How to Buy</h1>
          <p className="text-xl text-gray-600 mb-12">
            Import your dream car from U.S. auctions in 7 simple steps
          </p>

          <div className="space-y-6 mb-12">
            {steps.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">{item.title}</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-gray-600">{item.description}</p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="mb-6">Create your free account and start browsing vehicles today</p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

