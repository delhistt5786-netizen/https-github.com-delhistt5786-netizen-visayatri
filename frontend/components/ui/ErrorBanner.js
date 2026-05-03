import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
