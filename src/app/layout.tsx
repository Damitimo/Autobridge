import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AutoBridge - Launching Soon',
  description: 'Import vehicles from U.S. auctions to Nigeria with complete transparency, real-time tracking, and AI-powered cost estimation.',
  keywords: ['auto import', 'car auction', 'nigeria', 'copart', 'iaai', 'vehicle import'],
  icons: {
    icon: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.paystack.co/v1/inline.js" async></script>
      </head>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <main>
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
