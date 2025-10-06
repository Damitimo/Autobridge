import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { 
  Car, 
  DollarSign, 
  MapPin, 
  Lock, 
  Ship, 
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function HomePage() {
  // Demo cars for carousel (using free Unsplash images)
  const liveBids = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      currentBid: '$8,500',
      timeLeft: '2h 15m',
      location: 'Los Angeles, CA',
    },
    {
      id: '2',
      make: 'Honda',
      model: 'Accord',
      year: 2019,
      image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop',
      currentBid: '$12,300',
      timeLeft: '5h 42m',
      location: 'Houston, TX',
    },
    {
      id: '3',
      make: 'BMW',
      model: '3 Series',
      year: 2021,
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
      currentBid: '$18,750',
      timeLeft: '1h 08m',
      location: 'New York, NY',
    },
    {
      id: '4',
      make: 'Ford',
      model: 'F-150',
      year: 2020,
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
      currentBid: '$22,400',
      timeLeft: '3h 30m',
      location: 'Dallas, TX',
    },
    {
      id: '5',
      make: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2019,
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      currentBid: '$24,900',
      timeLeft: '4h 55m',
      location: 'Miami, FL',
    },
    {
      id: '6',
      make: 'Lexus',
      model: 'ES 350',
      year: 2020,
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
      currentBid: '$16,200',
      timeLeft: '6h 20m',
      location: 'Atlanta, GA',
    },
  ];

  const features = [
    {
      icon: Car,
      title: 'Access 100,000+ Vehicles',
      description: 'Browse auction inventory from Copart and IAAI with real-time updates every 15 minutes.',
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'AI-powered cost calculator shows exact landed cost in Nigeria before you bid.',
    },
    {
      icon: MapPin,
      title: 'Real-Time Tracking',
      description: 'Track your vehicle from U.S. auction to your doorstep with GPS and live updates.',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'Pay in Naira via bank transfer or card. Funds held in escrow until shipment.',
    },
    {
      icon: Ship,
      title: 'End-to-End Logistics',
      description: 'We handle everything: towing, shipping, customs clearance, and final delivery.',
    },
    {
      icon: TrendingUp,
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
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/vehicles">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-base px-8">
                  Browse Vehicles
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="text-base px-8">
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

      {/* Live Auctions Carousel */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Currently Being Bid On</h2>
            <p className="text-gray-600">Live auctions ending soon - place your bid now!</p>
          </div>

          <Carousel className="w-full max-w-6xl mx-auto">
            <CarouselContent className="-ml-2 md:-ml-4">
              {liveBids.map((car) => (
                <CarouselItem key={car.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Link href={`/vehicles/${car.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={car.image}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {car.timeLeft}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-1">
                          {car.year} {car.make} {car.model}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">{car.location}</p>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-500">Current Bid</p>
                            <p className="text-xl font-bold text-blue-600">{car.currentBid}</p>
                          </div>
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </Carousel>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-blue-500 transition-colors">
                  <CardHeader className="text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
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
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-gray-600">Auction Price</span>
                  <span className="text-2xl font-bold">$8,000</span>
                </div>
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
                <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                  <span className="text-gray-700">Total Landed Cost</span>
                  <span className="text-blue-600">₦15,500,000</span>
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

      {/* Popular Brands Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Popular Brands Available</h2>
            <p className="text-gray-600">Import from top U.S. car manufacturers</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-70">
            {/* Toyota */}
            <div className="flex items-center justify-center w-28 h-16">
              <svg viewBox="0 0 120 40" className="w-full h-full">
                <ellipse cx="60" cy="20" rx="18" ry="18" fill="none" stroke="#CC0000" strokeWidth="3"/>
                <ellipse cx="50" cy="20" rx="10" ry="16" fill="none" stroke="#CC0000" strokeWidth="2.5"/>
                <ellipse cx="70" cy="20" rx="10" ry="16" fill="none" stroke="#CC0000" strokeWidth="2.5"/>
              </svg>
            </div>
            
            {/* Honda */}
            <div className="flex items-center justify-center w-24 h-16">
              <svg viewBox="0 0 100 40" className="w-full h-full">
                <text x="50" y="28" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#1a1a1a" textAnchor="middle">H</text>
                <rect x="30" y="8" width="40" height="24" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
              </svg>
            </div>
            
            {/* Ford */}
            <div className="flex items-center justify-center w-28 h-16">
              <svg viewBox="0 0 120 40" className="w-full h-full">
                <ellipse cx="60" cy="20" rx="55" ry="18" fill="none" stroke="#003478" strokeWidth="2"/>
                <text x="60" y="26" fontFamily="Georgia, serif" fontSize="20" fontStyle="italic" fontWeight="bold" fill="#003478" textAnchor="middle">Ford</text>
              </svg>
            </div>
            
            {/* BMW */}
            <div className="flex items-center justify-center w-20 h-16">
              <svg viewBox="0 0 80 40" className="w-full h-full">
                <circle cx="40" cy="20" r="16" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
                <path d="M 40 4 L 40 20 L 56 20 A 16 16 0 0 0 40 4" fill="#0066B1"/>
                <path d="M 40 20 L 40 36 L 24 20 A 16 16 0 0 0 40 20" fill="#0066B1"/>
                <circle cx="40" cy="20" r="18" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
              </svg>
            </div>
            
            {/* Mercedes */}
            <div className="flex items-center justify-center w-20 h-16">
              <svg viewBox="0 0 80 40" className="w-full h-full">
                <circle cx="40" cy="20" r="16" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
                <path d="M 40 8 L 40 20 M 40 20 L 28 30 M 40 20 L 52 30" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            
            {/* Chevrolet */}
            <div className="flex items-center justify-center w-20 h-16">
              <svg viewBox="0 0 80 40" className="w-full h-full">
                <path d="M 20 20 L 40 10 L 60 20 L 40 30 Z" fill="none" stroke="#d4af37" strokeWidth="3"/>
                <path d="M 20 20 L 40 18 L 60 20" stroke="#d4af37" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            
            {/* Nissan */}
            <div className="flex items-center justify-center w-28 h-16">
              <svg viewBox="0 0 120 40" className="w-full h-full">
                <circle cx="60" cy="20" r="16" fill="none" stroke="#C3002F" strokeWidth="2"/>
                <text x="60" y="26" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1a1a1a" textAnchor="middle">NISSAN</text>
              </svg>
            </div>
            
            {/* Lexus */}
            <div className="flex items-center justify-center w-20 h-16">
              <svg viewBox="0 0 80 40" className="w-full h-full">
                <ellipse cx="40" cy="20" rx="18" ry="18" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
                <text x="40" y="27" fontFamily="Georgia, serif" fontSize="22" fontWeight="bold" fill="#1a1a1a" textAnchor="middle">L</text>
              </svg>
            </div>
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
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-base px-8">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

