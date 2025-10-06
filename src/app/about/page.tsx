import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Shield, Award } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Transparency',
      description: 'No hidden fees. You see the total cost before you bid, including all Nigerian charges.',
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'We provide dedicated support throughout your import journey, from bid to delivery.',
    },
    {
      icon: Target,
      title: 'Efficiency',
      description: 'Streamlined process with real-time tracking and automated updates at every step.',
    },
    {
      icon: Award,
      title: 'Reliability',
      description: 'Licensed and bonded U.S. broker. Trusted shipping partners. Proven track record.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">About AutoBridge</h1>
          <p className="text-xl text-gray-600 mb-12">
            Connecting Nigerian importers to U.S. auto auctions with complete transparency
          </p>

          <div className="prose max-w-none mb-12">
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-gray-600 mb-4">
                  AutoBridge was founded to solve a critical problem: Nigerian vehicle importers were paying 
                  too much for cars due to lack of transparency, unreliable middlemen, and hidden costs. 
                  We built a platform that gives importers direct access to U.S. auto auctions with 
                  complete visibility into all costs.
                </p>
                <p className="text-gray-600">
                  Our AI-powered cost calculator shows you the exact landed cost in Nigeria before you bid, 
                  including auction fees, shipping, Nigerian customs, PAAR certification, and delivery. 
                  No surprises, no hidden charges.
                </p>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-6">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Why Choose Us?</h2>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3 mt-0.5">✓</span>
                    <span><strong>Licensed U.S. Broker:</strong> We're a fully licensed auto auction broker with accounts at Copart and IAAI</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3 mt-0.5">✓</span>
                    <span><strong>No Hidden Fees:</strong> Our AI calculator shows every single cost before you bid</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3 mt-0.5">✓</span>
                    <span><strong>Real-Time Tracking:</strong> GPS tracking and live updates from auction to your doorstep</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3 mt-0.5">✓</span>
                    <span><strong>Local Support:</strong> Nigerian team handles customs clearance and final delivery</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3 mt-0.5">✓</span>
                    <span><strong>Pay in Naira:</strong> No need for dollars. Pay with local bank transfer or card</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

