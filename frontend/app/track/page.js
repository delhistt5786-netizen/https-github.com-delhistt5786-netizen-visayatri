'use client';
import { useState } from 'react';
import { Search, Loader2, CheckCircle2, Circle, XCircle, FileWarning } from 'lucide-react';
import { appAPI } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';

const STEPS = ['pending', 'documents_received', 'in_review', 'processing', 'sent_to_immigration', 'approved', 'delivered'];

export default function TrackApplicationPage() {
  const [applicationId, setApplicationId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!applicationId.trim() || !email.trim()) { setError('Enter both your Application ID and email.'); return; }
    setLoading(true);
    try {
      const r = await appAPI.track(applicationId.trim(), email.trim());
      setResult(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not find that application. Check the ID and email and try again.');
    } finally { setLoading(false); }
  };

  const isRejected = result?.status === 'rejected';
  const currentIdx = STEPS.indexOf(result?.status);

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#061f3b] to-[#0d3b66] text-white py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">Track Your Application</h1>
          <p className="mt-4 text-sky-100">Enter your Application ID and the email you applied with to see live status — no login needed.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Application ID</label>
            <input value={applicationId} onChange={e => setApplicationId(e.target.value)}
              placeholder="VYT12345678" className="input-field uppercase" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Email used to apply</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Track Application'}
          </button>
        </form>

        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Application</p>
                <p className="text-lg font-bold text-primary">{result.applicationId}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {result.visa?.flag} {result.visa?.country} &middot; {result.applicantName}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            {isRejected ? (
              <div className="flex gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Application Rejected</p>
                  {result.rejectionReason && <p className="text-sm text-red-600 mt-1">{result.rejectionReason}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {STEPS.map((s, i) => {
                  const done = i <= currentIdx;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      {done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                      <span className={`text-sm ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {result.docsRequested?.length > 0 && (
              <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
                <FileWarning className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Documents Needed</p>
                  <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                    {result.docsRequested.map((d, i) => (
                      <li key={i}>{d.items?.join(', ')}{d.note ? ` — ${d.note}` : ''}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-600 mt-2">Log in to your account to upload these.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
