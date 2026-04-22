'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface AuctionCountdownProps {
  auctionDateTime?: string;
  auctionDate?: string;
}

export default function AuctionCountdown({ auctionDateTime, auctionDate }: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!auctionDateTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const auctionTime = new Date(auctionDateTime).getTime();
      const difference = auctionTime - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [auctionDateTime]);

  // If no auctionDateTime, show the date string if available
  if (!auctionDateTime) {
    // Don't show if auctionDate looks like a lot number or is "See listing"
    const isInvalidDate = !auctionDate ||
      /lot\s*(?:number|#)?[:\s#]*\d+/i.test(auctionDate) ||
      auctionDate === 'See listing';

    if (!isInvalidDate) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Auction: {auctionDate}</span>
        </div>
      );
    }
    return null;
  }

  if (!timeLeft) return null;

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium text-sm">Auction Ended</span>
      </div>
    );
  }

  // Urgency colors
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 6;
  const isSoon = timeLeft.days === 0;

  return (
    <div className={`rounded-lg px-3 py-2 ${
      isUrgent
        ? 'bg-red-100 border border-red-200'
        : isSoon
          ? 'bg-orange-100 border border-orange-200'
          : 'bg-blue-100 border border-blue-200'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-600' : isSoon ? 'text-orange-600' : 'text-blue-600'}`} />
        <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : isSoon ? 'text-orange-600' : 'text-blue-600'}`}>
          Auction Countdown
        </span>
      </div>
      <div className="flex items-center gap-1 font-mono">
        {timeLeft.days > 0 && (
          <>
            <span className={`text-lg font-bold ${isUrgent ? 'text-red-700' : isSoon ? 'text-orange-700' : 'text-blue-700'}`}>
              {timeLeft.days}
            </span>
            <span className={`text-xs mr-2 ${isUrgent ? 'text-red-600' : isSoon ? 'text-orange-600' : 'text-blue-600'}`}>D</span>
          </>
        )}
        <span className={`text-lg font-bold ${isUrgent ? 'text-red-700' : isSoon ? 'text-orange-700' : 'text-blue-700'}`}>
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className={`text-xs mr-2 ${isUrgent ? 'text-red-600' : isSoon ? 'text-orange-600' : 'text-blue-600'}`}>H</span>
        <span className={`text-lg font-bold ${isUrgent ? 'text-red-700' : isSoon ? 'text-orange-700' : 'text-blue-700'}`}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className={`text-xs mr-2 ${isUrgent ? 'text-red-600' : isSoon ? 'text-orange-600' : 'text-blue-600'}`}>M</span>
        {timeLeft.days === 0 && (
          <>
            <span className={`text-lg font-bold ${isUrgent ? 'text-red-700' : isSoon ? 'text-orange-700' : 'text-blue-700'}`}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className={`text-xs ${isUrgent ? 'text-red-600' : isSoon ? 'text-orange-600' : 'text-blue-600'}`}>S</span>
          </>
        )}
      </div>
    </div>
  );
}
