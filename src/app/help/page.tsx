import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpPage() {
  const faqs = [
    {
      question: 'How much does it cost to import a car?',
      answer: 'Total cost depends on the vehicle price, shipping method, and customs duties. Our AI calculator gives you the exact landed cost before you bid. Typically, for a $10,000 car, total landed cost in Nigeria is ₦18-22 million.',
    },
    {
      question: 'How long does the process take?',
      answer: 'From winning the bid to delivery in Nigeria takes 6-10 weeks on average. This includes: auction payment (1-2 days), towing and documentation (3-7 days), shipping (4-6 weeks), customs clearance (3-7 days), and final delivery (1-3 days).',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bank transfers and card payments in Nigerian Naira. We work with Paystack and Flutterwave for secure payments. Funds are held in escrow until your vehicle ships from the U.S.',
    },
    {
      question: 'Do I need to pay upfront?',
      answer: 'No. You only pay after winning the auction. We require 50% deposit within 24 hours of winning, and the balance before the vehicle ships from the U.S. port.',
    },
    {
      question: 'What if the car has hidden damage?',
      answer: 'All vehicles come with detailed condition reports and photos from the auction. We also offer optional pre-purchase inspection ($150) where our agent physically inspects the vehicle before you bid.',
    },
    {
      question: 'Can I inspect the car before bidding?',
      answer: 'You can see detailed photos and condition reports from the auction. For high-value vehicles, we offer paid inspection services where our U.S. agent physically checks the vehicle.',
    },
    {
      question: 'How do customs duties work?',
      answer: 'Nigerian customs duties are calculated based on vehicle age, engine size, and type. Our calculator uses the official Nigerian Customs tariff to show exact duty amounts before you bid.',
    },
    {
      question: 'Do you handle PAAR/SONCAP?',
      answer: 'Yes! We handle all Nigerian import requirements including PAAR, SONCAP certification, and vehicle clearance. All costs are included in our calculator.',
    },
    {
      question: 'What if I don\'t win the auction?',
      answer: 'If you don\'t win, there\'s no charge. You can place bids on unlimited vehicles. We only charge when you win and we successfully import your vehicle.',
    },
    {
      question: 'Where do you deliver in Nigeria?',
      answer: 'We deliver nationwide. Lagos and Port Harcourt deliveries are included in the base price. For other states, there\'s a small additional fee shown in the calculator.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 mb-12">
            Find answers to common questions or contact our support team
          </p>

          {/* Contact Options */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Chat with our team in real-time</p>
                <Button size="sm" className="w-full">Start Chat</Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">We respond within 2 hours</p>
                <Button size="sm" variant="outline" className="w-full">
                  support@autobridge.ng
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Phone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Monday - Saturday, 8AM - 8PM</p>
                <Button size="sm" variant="outline" className="w-full">
                  +234 (0) 800 AUTO-BRG
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Can't find what you're looking for?</h3>
            <p className="text-gray-600 mb-4">
              Our support team is here to help you with any questions
            </p>
            <Button>Contact Support</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

