import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-300/20 dark:bg-slate-700/20 rounded ${className}`} />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <div className="h-32 w-full rounded-2xl bg-slate-300/10 dark:bg-slate-800/10 animate-pulse border border-white/10 flex flex-col justify-end p-6 space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-300/10 dark:bg-slate-800/10 animate-pulse border border-white/10 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-2/3" />
          </div>
        ))}
      </div>

      {/* Row of Charts Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 lg:col-span-2 rounded-2xl bg-slate-300/10 dark:bg-slate-800/10 animate-pulse border border-white/10 p-6 space-y-4">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-300/10 dark:bg-slate-800/10 animate-pulse border border-white/10 p-6 space-y-4 flex flex-col items-center justify-center">
          <Skeleton className="h-36 w-36 rounded-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/3" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
};
