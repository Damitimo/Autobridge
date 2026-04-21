'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Wallet,
  ShoppingCart,
  Ship,
  LayoutDashboard,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationDropdown from '@/components/notification-dropdown';

const sidebarItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Bids',
    href: '/dashboard/bids',
    icon: ShoppingCart,
  },
  {
    name: 'Shipments',
    href: '/dashboard/shipments',
    icon: Ship,
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
  },
  {
    name: 'My Wallet',
    href: '/dashboard/wallet',
    icon: Wallet,
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceCurrency, setBalanceCurrency] = useState<'USD' | 'NGN'>('USD');
  const NGN_RATE = 1550;

  useEffect(() => {
    checkAuth();
  }, [session, status]);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setWalletBalance(data.data.available);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  const checkAuth = async () => {
    // Wait for session to load
    if (status === 'loading') return;

    try {
      const token = localStorage.getItem('token');

      // Check localStorage token first
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            setLoading(false);
            return;
          }
        }
        // Token invalid, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      // Check NextAuth session
      if (status === 'authenticated' && session?.user) {
        const sessionUser = {
          id: (session.user as any).id || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email || '',
          image: session.user.image,
        };
        setUser(sessionUser);
        setLoading(false);
        return;
      }

      // Not authenticated
      if (status === 'unauthenticated' && !token) {
        router.push('/auth/login?redirect=' + pathname);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (status === 'unauthenticated') {
        router.push('/auth/login?redirect=' + pathname);
      }
    } finally {
      // Only set loading false if we've finished processing
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    signOut({ callbackUrl: '/' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform bg-brand-dark",
          "w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo-wide.svg"
                alt="AutoBridge"
                width={160}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-brand-gold text-brand-dark font-medium"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            {/* Left side - spacer for mobile menu button */}
            <div className="lg:hidden w-12" />

            {/* Page title or breadcrumb could go here */}
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-800">
                {pathname === '/dashboard' && 'Dashboard'}
                {pathname === '/dashboard/wallet' && 'My Wallet'}
                {pathname === '/dashboard/bids' && 'My Bids'}
                {pathname === '/dashboard/messages' && 'Messages'}
                {pathname === '/dashboard/shipments' && 'Shipments'}
                {pathname === '/dashboard/notifications' && 'Notifications'}
                {pathname === '/dashboard/profile' && 'Profile'}
              </h2>
            </div>

            {/* Right side - User info */}
            <div className="flex items-center space-x-4">
              {/* Wallet Balance */}
              <div className="hidden sm:flex items-stretch h-9">
                <Link
                  href="/dashboard/wallet"
                  className="flex items-center space-x-2 px-3 bg-green-50 border border-green-200 rounded-l-lg hover:bg-green-100 transition-colors"
                >
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {walletBalance !== null
                      ? balanceCurrency === 'USD'
                        ? `$${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `₦${(walletBalance * NGN_RATE).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      : '...'
                    }
                  </span>
                </Link>
                <div className="flex border border-green-200 border-l-0 rounded-r-lg overflow-hidden">
                  <button
                    onClick={() => setBalanceCurrency('NGN')}
                    className={`px-2 text-xs font-semibold transition-colors ${
                      balanceCurrency === 'NGN'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    ₦
                  </button>
                  <button
                    onClick={() => setBalanceCurrency('USD')}
                    className={`px-2 text-xs font-semibold transition-colors ${
                      balanceCurrency === 'USD'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    $
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Avatar Dropdown */}
              {user && (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-dark flex items-center justify-center text-white font-semibold text-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user.firstName}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
