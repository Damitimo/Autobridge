import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AutoBridge - Coming Soon',
  description: 'AutoBridge - U.S. Auto Auction Platform for Nigerian Importers. Launching Soon!',
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
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-7xl md:text-9xl font-bold text-white mb-8 tracking-tight">
              AutoBridge
            </h1>
            <h2 className="text-4xl md:text-6xl font-light text-blue-100">
              Coming Soon
            </h2>
          </div>
        </div>
      </body>
    </html>
  );
}

