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

// Launch date: 2 weeks from now
const LAUNCH_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
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
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 md:mb-16">
        <Image
          src="/logo-wide.svg"
          alt="AutoBridge"
          width={400}
          height={120}
          className="h-12 sm:h-16 md:h-28 w-auto"
          priority
        />
      </div>

      {/* Countdown Timer - Grid on mobile, flex on desktop */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:flex md:items-center md:gap-6 lg:gap-8">
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="contents md:contents">
            {/* Timer Box */}
            <div className="text-center">
              <div className="bg-brand-gold text-brand-dark rounded-lg sm:rounded-xl md:rounded-2xl px-3 sm:px-4 md:px-10 lg:px-12 py-3 sm:py-4 md:py-8 lg:py-10 min-w-[70px] sm:min-w-[80px] md:min-w-[140px] lg:min-w-[160px]">
                <span className="text-2xl sm:text-3xl md:text-6xl lg:text-8xl font-bold font-mono">
                  {String(unit.value).padStart(2, '0')}
                </span>
              </div>
              <span
                onClick={unit.isSecret ? handleSecretClick : undefined}
                className={`text-xs sm:text-sm md:text-lg lg:text-xl font-semibold mt-2 md:mt-4 block text-white uppercase tracking-wider md:tracking-widest ${unit.isSecret ? 'cursor-pointer select-none' : ''}`}
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
    </div>
  );
}
