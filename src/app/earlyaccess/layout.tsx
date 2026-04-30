import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function EarlyAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <Footer />
    </>
  );
}
