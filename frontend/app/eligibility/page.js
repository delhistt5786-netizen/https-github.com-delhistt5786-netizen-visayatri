'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Compass, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { visaAPI } from '../../lib/api';

const parseMaxDays = (processingTime) => {
  const nums = (processingTime || '').match(/\d+/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number));
};

export default function EligibilityCheckerPage() {
  const [visas, setVisas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [travelDate, setTravelDate] = useState('');

  useEffect(() => {
    visaAPI.getAll().then(r => { setVisas(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const selected = useMemo(() => visas.find(v => v.slug === slug), [visas, slug]);

  const daysUntilTravel = travelDate
    ? Math.ceil((new Date(travelDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const maxProcessingDays = selected ? parseMaxDays(selected.processingTime) : null;
  const isTight = daysUntilTravel != null && maxProcessingDays != null && daysUntilTravel < maxProcessingDays;
  const isUnknownTiming = selected && maxProcessingDays == null; // e.g. "Contact us for timeline"

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#061f3b] to-[#0d3b66] text-white py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <Compass className="w-10 h-10 mx-auto mb-4 text-orange-300" />
          <h1 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">Visa Eligibility Checker</h1>
          <p className="mt-4 text-sky-100">Pick where you're going and when — we'll tell you the price, what you'll need, and whether there's enough time before you fly.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Destination</label>
            {loading ? (
              <div className="input-field flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading destinations…</div>
            ) : (
              <select value={slug} onChange={e => setSlug(e.target.value)} className="input-field">
                <option value="">Select a country</option>
                {[...visas].sort((a, b) => a.country.localeCompare(b.country)).map(v => (
                  <option key={v.slug} value={v.slug}>{v.flag} {v.country}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Planned travel date (optional)</label>
            <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} className="input-field" />
          </div>
        </div>

        {selected && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selected.flag}</span>
              <div>
                <h2 className="text-lg font-bold text-primary">{selected.country}</h2>
                <p className="text-sm text-gray-500">{selected.visaType} &middot; {selected.processingTime}</p>
              </div>
            </div>

            {travelDate && (
              isTight ? (
                <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Cutting it close</p>
                    <p className="text-sm text-amber-700 mt-1">
                      You have {daysUntilTravel} day{daysUntilTravel === 1 ? '' : 's'} left, but {selected.country} visas can take up to {maxProcessingDays} business days. Apply today to be safe.
                    </p>
                  </div>
                </div>
              ) : !isUnknownTiming && (
                <div className="flex gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-800">You're in good time</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      {daysUntilTravel} day{daysUntilTravel === 1 ? '' : 's'} until travel is comfortably more than the usual {selected.processingTime.toLowerCase()}.
                    </p>
                  </div>
                </div>
              )
            )}

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Plans</p>
              <div className="space-y-2">
                {(selected.plans || []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                    <span className="text-sm text-gray-700">{p.label || 'Standard'}</span>
                    <span className="text-sm font-bold text-primary">
                      {p.isContactUs ? 'Contact us' : `₹${(p.publicPrice || p.price || 0).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selected.requirements?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">What you'll need</p>
                <ul className="space-y-1.5">
                  {selected.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link href={`/visa/${selected.slug}`}
              className="btn-primary w-full justify-center">
              Apply for {selected.country} Visa <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
