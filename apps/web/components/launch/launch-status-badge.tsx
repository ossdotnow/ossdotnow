'use client';

import { useCountdown } from '@/hooks/use-countdown';
import { Clock, CheckCircle } from 'lucide-react';

interface LaunchStatusBadgeProps {
  status: 'scheduled' | 'live';
  launchDate: string | Date | null;
  className?: string;
  showCountdown?: boolean;
}

export function LaunchStatusBadge({
  status,
  launchDate,
  className = '',
  showCountdown = false,
}: LaunchStatusBadgeProps) {
  const { timeRemaining, isExpired } = useCountdown(status === 'scheduled' ? launchDate : null);

  const isScheduled = status === 'scheduled' && !isExpired;
  const isLive = status === 'live' || isExpired;

  if (isScheduled) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 rounded-none border border-orange-500/30 bg-orange-500/20 px-2 py-1">
          <Clock className="h-3 w-3 text-orange-400" />
          <span className="text-xs font-medium text-orange-400">Scheduled</span>
        </div>
        {showCountdown && (
          <span className="text-xs text-orange-400">Launches in: {timeRemaining}</span>
        )}
      </div>
    );
  }

  if (isLive) {
    return (
      <div
        className={`flex items-center gap-1 rounded-none border border-green-500/30 bg-green-500/20 px-2 py-1 ${className}`}
      >
        <CheckCircle className="h-3 w-3 text-green-400" />
        <span className="text-xs font-medium text-green-400">Live</span>
      </div>
    );
  }

  return null;
}
