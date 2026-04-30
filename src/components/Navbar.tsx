'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Wallet, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hide navbar on auth pages
  const isAuthPage = pathname?.startsWith('/auth');
  const isDashboard = pathname?.startsWith('/dashboard');

  // Check login status on client side
  useEffect(() => {
    const token = localStorage.getItem('token');
    const hasSession = status === 'authenticated' && session;
    setIsLoggedIn(!!(token || hasSession));

    // Get user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (session?.user) {
      setUser({
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email,
        image: session.user.image,
      });
    }
  }, [session, status]);

  useEffect(() => {
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

    if (isLoggedIn) {
      fetchWalletBalance();
    }
  }, [isLoggedIn, pathname]);

  // Don't render navbar on auth pages (must be after all hooks)
  if (isAuthPage) return null;

  const publicNavItems = [
    { name: 'How to Buy', href: '/how-to-buy' },
    { name: 'Shipping', href: '/shipping' },
    { name: 'About Us', href: '/about' },
    { name: 'Help', href: '/help' },
  ];

  const loggedInNavItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'How to Buy', href: '/how-to-buy' },
  ];

  const navItems = isLoggedIn ? loggedInNavItems : publicNavItems;
  
  return (
    <nav className={cn(
      "bg-brand-dark sticky top-0 z-50",
      isDashboard && "lg:ml-64"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {!isDashboard ? (
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo-wide.svg"
                alt="AutoBridge"
                width={180}
                height={50}
                className="h-12 w-auto"
              />
            </Link>
          ) : (
            <div className="flex-1 md:flex-none"></div>
          )}

          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-brand-gold',
                  pathname === item.href ? 'text-brand-gold' : 'text-white'
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
                  <Button variant="ghost" size="sm" className="text-white hover:text-brand-gold hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-brand-gold text-brand-dark hover:bg-brand-gold/90 font-semibold">
                    Register
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard/wallet">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-gold/20 border border-brand-gold/30 hover:bg-brand-gold/30 transition-colors">
                    <Wallet className="h-4 w-4 text-brand-gold" />
                    <span className="text-sm font-semibold text-brand-gold">
                      ${walletBalance !== null ? walletBalance.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {user?.image || session?.user?.image ? (
                      <Image
                        src={user?.image || session?.user?.image || ''}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-brand-gold"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-brand-dark font-semibold">
                        {user?.firstName?.[0] || session?.user?.name?.[0] || 'U'}
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-white" />
                  </button>

                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-semibold text-gray-900">
                            {user?.firstName || session?.user?.name?.split(' ')[0] || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email || session?.user?.email}
                          </p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            signOut({ callbackUrl: '/earlyaccess' });
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

