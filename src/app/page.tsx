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

// Launch date: April 30th, 2026 (13 days remaining)
const LAUNCH_DATE = new Date('2026-04-30T00:00:00');

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // Check if site is unlocked
    const isUnlocked = localStorage.getItem('siteUnlocked') === 'true';
    if (isUnlocked) {
      setUnlocked(true);
      return;
    }

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
    localStorage.setItem('siteUnlocked', 'true');
    setUnlocked(true);
    router.push('/home');
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

  // If unlocked, redirect to home
  if (unlocked) {
    router.push('/home');
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'Days', isSecret: false },
    { value: timeLeft.hours, label: 'Hours', isSecret: false },
    { value: timeLeft.minutes, label: 'Mins', isSecret: false },
    { value: timeLeft.seconds, label: 'Secs', isSecret: true },
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
                onClick={unit.isSecret ? handleSecretClick : undefined}
                className={`text-[10px] sm:text-sm md:text-lg lg:text-xl font-semibold mt-1.5 md:mt-4 block text-white uppercase tracking-wide md:tracking-widest ${unit.isSecret ? 'cursor-pointer select-none' : ''}`}
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
      <div className="mt-8 md:mt-12 text-center w-full max-w-[360px] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-6 border border-white/20 rounded-xl">
        <h2 className="text-white text-base md:text-2xl font-semibold mb-3 md:mb-4">
          Be the first to know
        </h2>
        {submitted ? (
          <p className="text-brand-gold text-sm md:text-base">
            Thanks! We&apos;ll notify you when we launch.
          </p>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2 sm:gap-3 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm sm:text-base placeholder-white/50 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm sm:text-base placeholder-white/50 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <button
              type="submit"
              className="w-full px-5 py-2.5 sm:px-6 sm:py-3 bg-brand-gold text-brand-dark text-sm sm:text-base font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Notify Me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
