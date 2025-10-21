'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  
  // Check if user is logged in (from localStorage)
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('token');

  useEffect(() => {
    if (isLoggedIn) {
      fetchWalletBalance();
    }
  }, [isLoggedIn, pathname]);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.data.available);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };
  
  const publicNavItems = [
    { name: 'Browse Vehicles', href: '/vehicles' },
    { name: 'How to Buy', href: '/how-to-buy' },
    { name: 'Shipping', href: '/shipping' },
    { name: 'About Us', href: '/about' },
    { name: 'Help', href: '/help' },
  ];

  const loggedInNavItems = [
    { name: 'Browse Vehicles', href: '/vehicles' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  const navItems = isLoggedIn ? loggedInNavItems : publicNavItems;
  
  return (
    <nav className={cn(
      "border-b bg-white sticky top-0 z-50",
      isLoggedIn && "lg:ml-64"
    )}>
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
            {!isLoggedIn ? (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard/wallet">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      ${walletBalance !== null ? walletBalance.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </Link>
                <Button variant="outline" size="sm" onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

