'use client';
import { Check } from 'lucide-react';

/**
 * ApplyStepper
 *
 * Progress indicator for the apply form. Purely visual — it
 * reflects how far the applicant has gotten (details filled, documents
 * uploaded, ready to pay) rather than gating navigation, since the underlying
 * form is a single scrollable page.
 * @param {{ label: string, complete: boolean }[]} steps
 * @param {number} activeIndex - index of the step currently in focus
 */
export default function ApplyStepper({ steps, activeIndex }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = step.complete;
        return (
          <div key={step.label} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-[#FF7A00] text-white ring-4 ring-orange-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${isActive ? 'text-[#FF7A00]' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
