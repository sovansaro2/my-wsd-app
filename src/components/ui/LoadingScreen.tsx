import React from 'react';
import { Dots } from './Dots';
import { cn } from '../../lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = 'កំពុងដំណើរការ...', className }: LoadingScreenProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center bg-[#FAFAFA] dark:bg-slate-900 text-zinc-900 dark:text-white space-y-4", className || "h-screen")}>
      <div className="text-3xl">
        <Dots className="w-12 h-4 text-amber-600" />
      </div>
      <p className="text-sm font-medium font-battambang st text-zinc-400 uppercase animate-pulse">
        {message}
      </p>
    </div>
  );
}
