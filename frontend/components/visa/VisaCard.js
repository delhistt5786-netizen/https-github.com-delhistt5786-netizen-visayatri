'use client';
import Link from 'next/link';
import { Clock, CheckCircle2, MessageCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { waApply } from '../../lib/whatsapp';
import { getUser } from '../../lib/auth';

export default function VisaCard({ visa }) {
  const user = getUser();
  const isAgent = user?.role === 'agent';
  const plans = visa.plans || [];
  const cheapest = plans
    .filter((p) => !p.isContactUs && (p.price || p.publicPrice) > 0)
    .sort((a, b) => (a.price || a.publicPrice) - (b.price || b.publicPrice))[0];

  const displayPrice = cheapest ? (isAgent ? cheapest.price : cheapest.price || cheapest.publicPrice) : null;
  const showProfit = isAgent && cheapest?.profit > 0;

  return (
    <div className="soft-card group flex flex-col overflow-hidden">
      {/* Header with flag and badge */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-orange-100 p-2 text-3xl">{visa.flag}</div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{visa.country}</h3>
            <p className="text-xs font-medium text-slate-500">{visa.visaType || 'E-Visa'}</p>
          </div>
        </div>
        {visa.isRiskFree && (
          <div className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Risk Free
          </div>
        )}
      </div>

      {/* Processing time */}
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
        <Clock className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-900">{visa.processingTime}</span>
      </div>

      {/* Price display */}
      {displayPrice ? (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">From</p>
          <p className="mt-1 text-3xl font-black text-slate-900">₹{displayPrice.toLocaleString('en-IN')}</p>
        </div>
      ) : null}

      {/* Plan options */}
      {plans.length > 0 && (
        <div className="mb-5 flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Available Plans</p>
          <div className="space-y-2">
            {plans.slice(0, 2).map((p, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">{p.label}</span>
                  {p.isContactUs ? (
                    <span className="text-xs font-semibold text-slate-500">Contact</span>
                  ) : (
                    <span className="text-sm font-bold text-orange-600">
                      ₹{(p.price || p.publicPrice || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {plans.length > 2 && (
              <Link href={`/visa/${visa.slug}`}
                className="block w-full rounded-lg border border-dashed border-slate-300 bg-white py-2 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-orange-300 hover:text-orange-600">
                +{plans.length - 2} more options
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Agent profit banner */}
      {showProfit && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <TrendingUp className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold text-emerald-700">
            Earn ₹{cheapest.profit?.toLocaleString('en-IN')}/application
          </p>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/visa/${visa.slug}`}
          className="flex-1 rounded-xl bg-gradient-to-br from-[#061f3b] to-[#0d3b66] px-4 py-2.5 text-center text-sm font-bold text-white transition-all hover:shadow-lg group-hover:-translate-y-0.5"
        >
          Apply now
        </Link>
        <a
          href={waApply({
            visaCountry: visa.country,
            planLabel: cheapest?.label,
            userName: user?.name,
            email: user?.email,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border-2 border-green-500 bg-white px-3 py-2.5 text-green-500 transition-all hover:bg-green-50"
          title="Apply via WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
