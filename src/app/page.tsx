import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const features = [
    {
      icon: '🚗',
      title: 'Access 100,000+ Vehicles',
      description: 'Browse auction inventory from Copart and IAAI with real-time updates every 15 minutes.',
    },
    {
      icon: '💰',
      title: 'Transparent Pricing',
      description: 'AI-powered cost calculator shows exact landed cost in Nigeria before you bid.',
    },
    {
      icon: '📍',
      title: 'Real-Time Tracking',
      description: 'Track your vehicle from U.S. auction to your doorstep with GPS and live updates.',
    },
    {
      icon: '🔒',
      title: 'Secure Payments',
      description: 'Pay in Naira via bank transfer or card. Funds held in escrow until shipment.',
    },
    {
      icon: '🚢',
      title: 'End-to-End Logistics',
      description: 'We handle everything: towing, shipping, customs clearance, and final delivery.',
    },
    {
      icon: '📊',
      title: 'Market Intelligence',
      description: 'Access Nigerian resale values and profit margin estimates for smarter buying.',
    },
  ];

  const howItWorks = [
    { step: '1', title: 'Browse & Search', description: 'Find your perfect vehicle from 100,000+ listings' },
    { step: '2', title: 'Calculate Cost', description: 'See total landed cost in Nigeria instantly' },
    { step: '3', title: 'Place Bid', description: 'We bid on your behalf using our broker account' },
    { step: '4', title: 'Make Payment', description: 'Pay securely in Naira when you win' },
    { step: '5', title: 'Track Shipment', description: 'Monitor your vehicle in real-time' },
    { step: '6', title: 'Receive Delivery', description: 'Get your vehicle delivered to your location' },
  ];

  const testimonials = [
    {
      name: 'Emeka O.',
      location: 'Lagos',
      image: '/avatar-1.jpg',
      text: 'AutoBridge saved me ₦500,000 on my first import. The transparency and tracking gave me peace of mind.',
    },
    {
      name: 'Amaka N.',
      location: 'Abuja',
      image: '/avatar-2.jpg',
      text: 'I import 10-15 cars monthly. AutoBridge makes managing shipments so easy. Best platform for importers!',
    },
    {
      name: 'Chidi A.',
      location: 'Port Harcourt',
      image: '/avatar-3.jpg',
      text: 'Started my import business with AutoBridge. The cost calculator helped me avoid unprofitable purchases.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Import Cars from U.S. Auctions to Nigeria with Complete Transparency
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Access Copart & IAAI auctions, get AI-powered cost estimates, and track your vehicle from bid to delivery.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/vehicles">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Browse Vehicles
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700 hover:text-white">
                  Get Started Free
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-200">
              Save 15-25% on importation costs · No auction business account needed
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose AutoBridge?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We've built the complete platform for vehicle importation, making it as easy as shopping online.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-500 transition-colors">
                <CardHeader>
                  <div className="text-4xl mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600">Simple, transparent, and stress-free</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Calculator Preview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Calculate Your Total Cost</h2>
              <p className="text-gray-600">
                See exactly how much it will cost to import your vehicle to Nigeria
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Auction Price</p>
                  <p className="text-2xl font-bold">$8,000</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Landed Cost</p>
                  <p className="text-2xl font-bold text-blue-600">₦15,500,000</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Auction Fees</span>
                  <span>$330</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping (RoRo)</span>
                  <span>$1,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nigerian Customs</span>
                  <span>$4,400</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">All Other Fees</span>
                  <span>$1,070</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/vehicles">
                <Button size="lg">
                  Start Browsing Vehicles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Importers Say</h2>
            <p className="text-gray-600">Join thousands of successful importers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full mr-3 flex items-center justify-center text-white font-bold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Importing?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Create your free account and browse thousands of vehicles today
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

