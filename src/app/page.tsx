'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Launch date: 2 weeks from now
const LAUNCH_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-16">
        <Image
          src="/logo-wide.svg"
          alt="AutoBridge"
          width={400}
          height={120}
          className="h-20 md:h-28 w-auto"
          priority
        />
      </div>

      {/* Countdown Timer */}
      <div className="flex items-center gap-3 md:gap-8">
        {/* Days */}
        <div className="text-center">
          <div className="bg-brand-gold text-brand-dark rounded-2xl px-6 md:px-12 py-6 md:py-10 min-w-[100px] md:min-w-[160px]">
            <span className="text-5xl md:text-8xl font-bold font-mono">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
          </div>
          <span className="text-base md:text-xl font-semibold mt-4 block text-white uppercase tracking-widest">Days</span>
        </div>

        <span className="text-4xl md:text-7xl font-bold text-brand-gold self-start mt-6 md:mt-10">:</span>

        {/* Hours */}
        <div className="text-center">
          <div className="bg-brand-gold text-brand-dark rounded-2xl px-6 md:px-12 py-6 md:py-10 min-w-[100px] md:min-w-[160px]">
            <span className="text-5xl md:text-8xl font-bold font-mono">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
          </div>
          <span className="text-base md:text-xl font-semibold mt-4 block text-white uppercase tracking-widest">Hours</span>
        </div>

        <span className="text-4xl md:text-7xl font-bold text-brand-gold self-start mt-6 md:mt-10">:</span>

        {/* Minutes */}
        <div className="text-center">
          <div className="bg-brand-gold text-brand-dark rounded-2xl px-6 md:px-12 py-6 md:py-10 min-w-[100px] md:min-w-[160px]">
            <span className="text-5xl md:text-8xl font-bold font-mono">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
          </div>
          <span className="text-base md:text-xl font-semibold mt-4 block text-white uppercase tracking-widest">Mins</span>
        </div>

        <span className="text-4xl md:text-7xl font-bold text-brand-gold self-start mt-6 md:mt-10">:</span>

        {/* Seconds */}
        <div className="text-center">
          <div className="bg-brand-gold text-brand-dark rounded-2xl px-6 md:px-12 py-6 md:py-10 min-w-[100px] md:min-w-[160px]">
            <span className="text-5xl md:text-8xl font-bold font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          <span className="text-base md:text-xl font-semibold mt-4 block text-white uppercase tracking-widest">Secs</span>
        </div>
      </div>
    </div>
  );
}
