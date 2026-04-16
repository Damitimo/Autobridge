'use client';

import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Hide footer on auth pages
  const isAuthPage = pathname?.startsWith('/auth');
  if (isAuthPage) return null;

  return (
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
              <li><a href="/how-to-buy" className="hover:text-white">How to Buy</a></li>
              <li><a href="/shipping" className="hover:text-white">Shipping</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/help" className="hover:text-white">Help Center</a></li>
              <li><a href="/about" className="hover:text-white">About Us</a></li>
              <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: support@autobridgeworld.com</li>
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
  );
}
