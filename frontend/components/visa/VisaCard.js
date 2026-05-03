'use client';
import Link from 'next/link';
import { Clock, CheckCircle, MessageCircle, TrendingUp } from 'lucide-react';
import { waApply } from '../../lib/whatsapp';
import { getUser } from '../../lib/auth';

export default function VisaCard({ visa }) {
  const user       = getUser();
  const isAgent    = user?.role === 'agent';

  // plans array is already role-filtered by backend
  const plans      = visa.plans || [];
  const cheapest   = plans.filter(p => !p.isContactUs && (p.price || p.publicPrice) > 0)
                          .sort((a, b) => (a.price || a.publicPrice) - (b.price || b.publicPrice))[0];

  const displayPrice = cheapest
    ? (isAgent ? cheapest.price : cheapest.price || cheapest.publicPrice)
    : null;

  const showProfit = isAgent && cheapest?.profit > 0;

  return (
    <div className="card hover:-translate-y-1 flex flex-col">
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{visa.flag}</span>
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{visa.country}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{visa.visaType || 'E-Visa'}</p>
          </div>
        </div>
        {visa.isRiskFree && (
          <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1 whitespace-nowrap">
            <CheckCircle className="w-3 h-3" /> Risk Free
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
        <Clock className="w-3 h-3" /> {visa.processingTime}
      </div>

      {/* Plans */}
      <div className="flex-1 space-y-1.5 mb-4">
        {plans.slice(0, 3).map((p, i) => (
          <div key={i} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-1.5">
            <span className="text-gray-600 text-xs">{p.label}</span>
            <div className="text-right">
              {p.isContactUs
                ? <span className="text-gray-400 text-xs font-medium">Contact Us</span>
                : (
                  <div>
                    <span className="font-bold text-primary text-sm">
                      ₹{(p.price || p.publicPrice || 0).toLocaleString('en-IN')}
                    </span>
                    {isAgent && p.profit > 0 && (
                      <span className="block text-xs text-emerald-600 font-medium">
                        +₹{p.profit.toLocaleString('en-IN')} profit
                      </span>
                    )}
                  </div>
                )
              }
            </div>
          </div>
        ))}
        {plans.length > 3 && (
          <p className="text-xs text-gray-400 pl-1">+{plans.length - 3} more plans</p>
        )}
      </div>

      {/* Agent profit banner */}
      {showProfit && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-semibold">
            Earn up to ₹{cheapest.profit?.toLocaleString('en-IN')} per application
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/visa/${visa.slug}`}
          className="flex-1 text-center bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-900 transition-colors">
          Apply Now
        </Link>
        <a
          href={waApply({
            visaCountry: visa.country,
            planLabel:   cheapest?.label,
            userName:    user?.name,
            email:       user?.email,
          })}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-green-500 text-white rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-green-600 transition-colors"
          title="Apply via WhatsApp">
          <MessageCircle className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
