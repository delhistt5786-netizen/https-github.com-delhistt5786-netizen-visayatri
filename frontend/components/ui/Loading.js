import { Loader2 } from 'lucide-react';

/* Full-page loading */
export default function Loading({ text = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

/* Inline skeleton bar */
export function SkeletonBar({ w = 'w-full', h = 'h-4' }) {
  return <div className={`${w} ${h} bg-gray-100 rounded-lg animate-pulse`} />;
}

/* Card skeleton */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-2 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-gray-100 rounded" />
        <div className="h-2 bg-gray-100 rounded w-4/5" />
      </div>
      <div className="h-9 bg-gray-100 rounded-xl" />
    </div>
  );
}

/* Inline button spinner */
export function BtnSpinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />;
}
