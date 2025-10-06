import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ship, Package, FileCheck, MapPin } from 'lucide-react';

export default function ShippingPage() {
  const shippingOptions = [
    {
      icon: Ship,
      title: 'Roll-on/Roll-off (RoRo)',
      price: '$1,200 - $1,800',
      duration: '4-6 weeks',
      description: 'Most economical option. Vehicle is driven onto the ship and secured. Best for running vehicles.',
      features: [
        'Lower cost',
        'Faster processing',
        'Direct to Lagos/Port Harcourt',
        'Recommended for most vehicles',
      ],
    },
    {
      icon: Package,
      title: 'Container Shipping',
      price: '$2,500 - $4,000',
      duration: '4-6 weeks',
      description: 'Vehicle is loaded into a 40ft container. Better protection and can ship personal items.',
      features: [
        'Maximum protection',
        'Can ship personal belongings',
        'Better for luxury/exotic cars',
        'Weather protected',
      ],
    },
  ];

  const process = [
    {
      icon: FileCheck,
      title: 'Documentation',
      description: 'We handle all shipping paperwork, Bill of Lading, and customs forms.',
    },
    {
      icon: Ship,
      title: 'Ocean Freight',
      description: 'Your vehicle ships from U.S. ports (NJ, TX, CA) to Lagos or Port Harcourt.',
    },
    {
      icon: MapPin,
      title: 'Customs Clearance',
      description: 'We clear Nigerian customs, pay all duties, and handle PAAR/SONCAP certification.',
    },
    {
      icon: MapPin,
      title: 'Final Delivery',
      description: 'Vehicle delivered to your location anywhere in Nigeria.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Shipping Options</h1>
          <p className="text-xl text-gray-600 mb-12">
            Safe, reliable shipping from U.S. to Nigeria with full tracking
          </p>

          <h2 className="text-2xl font-bold mb-6">Choose Your Shipping Method</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {shippingOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">{option.title}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-blue-600 mt-2">
                      {option.price}
                    </CardDescription>
                    <CardDescription className="text-sm">
                      Transit time: {option.duration}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{option.description}</p>
                    <ul className="space-y-2">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <h2 className="text-2xl font-bold mb-6">Shipping Process</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index}>
                  <CardHeader className="text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Real-Time Tracking</h3>
            <p className="text-gray-600">
              Track your vehicle every step of the way with GPS tracking, SMS updates, and real-time status in your dashboard.
              You'll receive notifications when your vehicle departs the U.S., arrives in Nigeria, clears customs, and is out for delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

