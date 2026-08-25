'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Compass, CheckCircle2, AlertTriangle, ArrowRight, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { visaAPI, visaRuleAPI } from '../../lib/api';

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

  const [officialRules, setOfficialRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  useEffect(() => {
    if (!slug) { setOfficialRules([]); return; }
    setRulesLoading(true);
    visaRuleAPI.getByCountry(slug)
      .then(r => setOfficialRules(r.data.data || []))
      .catch(() => setOfficialRules([]))
      .finally(() => setRulesLoading(false));
  }, [slug]);

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

            {rulesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Checking official rules…</div>
            ) : officialRules.length > 0 && (
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Official Government Rules (Verified)
                </p>
                {officialRules.map(r => (
                  <div key={r._id} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-800">{r.officialVisaName}</p>
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {r.travelDocumentType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      <p><span className="text-gray-400">Entry:</span> {r.entryType}</p>
                      <p><span className="text-gray-400">Validity:</span> {r.validityPeriod?.value} {r.validityPeriod?.unit}</p>
                      <p><span className="text-gray-400">Max stay:</span> {r.maximumStay?.value} {r.maximumStay?.unit}</p>
                      <p><span className="text-gray-400">Govt. fee:</span> {r.governmentFee?.amount != null ? `${r.governmentFee.currency} ${r.governmentFee.amount}` : 'Verification required'}</p>
                    </div>
                    {r.eligibility && <p className="text-xs text-gray-500 italic">{r.eligibility}</p>}

                    {r.requiredDocuments?.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Document Checklist</p>
                        <ul className="space-y-1">
                          {r.requiredDocuments.map((d, i) => (
                            <li key={i} className="text-xs text-gray-700">
                              <span className="inline-flex items-center gap-1.5">
                                {d.critical ? <span className="text-amber-500" title="Critical">⭐</span> : <span className="w-3.5" />}
                                <span className={d.conditional ? 'text-gray-500' : 'font-medium'}>
                                  {d.documentName}
                                </span>
                                {d.conditional && <span className="text-[10px] text-gray-400">(conditional)</span>}
                                {!d.required && !d.conditional && <span className="text-[10px] text-gray-400">(optional)</span>}
                              </span>
                              {d.condition && <p className="ml-5 text-[11px] text-gray-400 italic">{d.condition}</p>}
                              {d.officialReason && <p className="ml-5 text-[11px] text-gray-400">{d.officialReason}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <a href={r.source?.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline">
                      Source: {r.source?.sourceTitle} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {officialRules[0]?.disclaimer}
                </p>
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
