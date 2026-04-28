'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Launch date: May 10th, 2026
const LAUNCH_DATE = new Date('2026-05-10T00:00:00');

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const difference = LAUNCH_DATE.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSecretClick = () => {
    router.push('/auth/register');
  };

  const handleAdminClick = () => {
    router.push('/admin');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone }),
        });

        const data = await response.json();
        if (data.success) {
          if (data.message === 'already_exists') {
            setAlreadyExists(true);
          }
          setWaitlistCount(data.count || 0);
          setSubmitted(true);
        }
      } catch (error) {
        console.error('Waitlist error:', error);
        // Still show success to not block user
        setSubmitted(true);
      }
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }


  const timeUnits = [
    { value: timeLeft.days, label: 'Days', isSecret: false, isAdmin: false },
    { value: timeLeft.hours, label: 'Hours', isSecret: false, isAdmin: false },
    { value: timeLeft.minutes, label: 'Mins', isSecret: false, isAdmin: true },
    { value: timeLeft.seconds, label: 'Secs', isSecret: true, isAdmin: false },
  ];

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-start pt-[15vh] sm:pt-[18vh] md:justify-center md:pt-0 px-3 py-8 md:p-4">
      {/* Logo */}
      <div className="mb-6 md:mb-16">
        <Image
          src="/logo-wide.svg"
          alt="AutoBridge"
          width={400}
          height={120}
          className="h-14 sm:h-16 md:h-28 w-auto"
          priority
        />
      </div>

      {/* Countdown Timer - Grid on mobile, flex on desktop */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:flex md:items-center md:gap-6 lg:gap-8 w-full max-w-[360px] sm:max-w-none sm:w-auto">
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="contents md:contents">
            {/* Timer Box */}
            <div className="text-center">
              <div className="bg-brand-gold text-brand-dark rounded-xl md:rounded-2xl px-2 sm:px-4 md:px-10 lg:px-12 py-4 sm:py-4 md:py-8 lg:py-10 min-w-0 sm:min-w-[80px] md:min-w-[140px] lg:min-w-[160px]">
                <span className="text-3xl sm:text-3xl md:text-6xl lg:text-8xl font-bold font-mono">
                  {String(unit.value).padStart(2, '0')}
                </span>
              </div>
              <span
                onClick={unit.isSecret ? handleSecretClick : unit.isAdmin ? handleAdminClick : undefined}
                className={`text-[10px] sm:text-sm md:text-lg lg:text-xl font-semibold mt-1.5 md:mt-4 block text-white uppercase tracking-wide md:tracking-widest ${unit.isSecret || unit.isAdmin ? 'cursor-pointer select-none' : ''}`}
              >
                {unit.label}
              </span>
            </div>

            {/* Colon separator - hidden on mobile, visible on md+ */}
            {index < 3 && (
              <span className="hidden md:block text-5xl lg:text-7xl font-bold text-brand-gold">:</span>
            )}
          </div>
        ))}
      </div>

      {/* Be the first to know */}
      <div className="mt-8 md:mt-12 text-center w-full px-4 md:px-0" style={{ maxWidth: 'fit-content' }}>
        <div className="px-4 py-4 md:px-8 md:py-6 border border-white/20 rounded-xl">
          <h2 className="text-white text-base md:text-xl font-semibold mb-3 md:mb-4">
            Be the first to know
          </h2>
          {submitted ? (
            <p className="text-brand-gold text-sm md:text-base">
              {alreadyExists
                ? "You're already on our list. We'll notify you when we launch!"
                : <>You&apos;ve just joined <span className="font-bold">{waitlistCount + 80}</span> others for a smarter way to import cars. We&apos;ll notify you when we launch!</>}
            </p>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col md:flex-row gap-2 md:gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2.5 md:px-4 md:py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm md:text-base placeholder-white/50 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold min-w-0 md:min-w-[180px]"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-3 py-2.5 md:px-4 md:py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm md:text-base placeholder-white/50 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold min-w-0 md:min-w-[160px]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 md:px-6 md:py-3 bg-brand-gold text-brand-dark text-sm md:text-base font-semibold rounded-lg hover:bg-yellow-400 transition-colors whitespace-nowrap"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Follow on Instagram */}
      <a
        href="https://www.instagram.com/autobridge_world/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        Follow @autobridge_world
      </a>
    </div>
  );
}
