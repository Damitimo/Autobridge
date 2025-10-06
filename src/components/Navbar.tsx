'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Browse Vehicles', href: '/vehicles' },
    { name: 'My Bids', href: '/dashboard/bids' },
    { name: 'Shipments', href: '/dashboard/shipments' },
    { name: 'How It Works', href: '/how-it-works' },
  ];
  
  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">AutoBridge</div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600',
                  pathname === item.href ? 'text-blue-600' : 'text-gray-700'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

