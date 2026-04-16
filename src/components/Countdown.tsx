'use client';

import { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  targetDate: Date;
  title?: string;
  subtitle?: string;
}

export function Countdown({ targetDate, title = "Launching Soon", subtitle }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

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
  }, [targetDate]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-brand-gold to-yellow-500 text-brand-dark py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">{title}</span>
            {subtitle && <span className="hidden md:inline text-sm">— {subtitle}</span>}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-center">
              <div className="bg-brand-dark text-white rounded-lg px-3 py-2 min-w-[60px]">
                <span className="text-2xl md:text-3xl font-bold font-mono">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs font-medium mt-1 block">DAYS</span>
            </div>

            <span className="text-2xl font-bold">:</span>

            <div className="text-center">
              <div className="bg-brand-dark text-white rounded-lg px-3 py-2 min-w-[60px]">
                <span className="text-2xl md:text-3xl font-bold font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs font-medium mt-1 block">HOURS</span>
            </div>

            <span className="text-2xl font-bold">:</span>

            <div className="text-center">
              <div className="bg-brand-dark text-white rounded-lg px-3 py-2 min-w-[60px]">
                <span className="text-2xl md:text-3xl font-bold font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs font-medium mt-1 block">MINS</span>
            </div>

            <span className="text-2xl font-bold">:</span>

            <div className="text-center">
              <div className="bg-brand-dark text-white rounded-lg px-3 py-2 min-w-[60px]">
                <span className="text-2xl md:text-3xl font-bold font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs font-medium mt-1 block">SECS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
