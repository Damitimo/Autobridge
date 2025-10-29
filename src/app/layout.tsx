import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AutoBridge - U.S. Auto Auction Platform for Nigerian Importers',
  description: 'Import vehicles from U.S. auctions to Nigeria with complete transparency, real-time tracking, and AI-powered cost estimation.',
  keywords: ['auto import', 'car auction', 'nigeria', 'copart', 'iaai', 'vehicle import'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <Toaster />
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">AutoBridge</h3>
                <p className="text-gray-400 text-sm">
                  Making vehicle importation from the U.S. to Nigeria as easy as ordering online.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/vehicles" className="hover:text-white">Browse Vehicles</a></li>
                  <li><a href="/how-it-works" className="hover:text-white">How It Works</a></li>
                  <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/faq" className="hover:text-white">FAQ</a></li>
                  <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                  <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                  <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Email: support@autobridge.ng</li>
                  <li>Phone: +234 800 AUTO BRIDGE</li>
                  <li>WhatsApp: +234 800 123 4567</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 AutoBridge. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

