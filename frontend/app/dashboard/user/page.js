'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, Clock, CheckCircle, XCircle, Upload, Download,
  MessageCircle, RefreshCw, Loader2, ChevronRight
} from 'lucide-react';
import { appAPI, pdfURL } from '../../../lib/api';
import { getUser } from '../../../lib/auth';
import { waTrack } from '../../../lib/whatsapp';
import StatusBadge from '../../../components/ui/StatusBadge';
import Loading, { SkeletonCard } from '../../../components/ui/Loading';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending','documents_received','in_review','processing','approved','delivered'];

export default function UserDashboard() {
  const router = useRouter();
  const user   = getUser();

  const [apps,       setApps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading,  setUploading]  = useState(null);
  const [expanded,   setExpanded]   = useState(null);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'user') { router.push(`/dashboard/${user.role}`); return; }
    load();
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const r = await appAPI.getMy();
      setApps(r.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load applications. Please refresh.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const handleUpload = useCallback(async (appId, files) => {
    if (!files?.length) return;
    const oversized = Array.from(files).find(f => f.size > 5 * 1024 * 1024);
    if (oversized) { toast.error(`"${oversized.name}" exceeds 5 MB limit.`); return; }

    setUploading(appId);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('documents', f));
      fd.append('docTypes', JSON.stringify(Array.from(files).map(() => 'passport')));
      await appAPI.uploadDocs(appId, fd);
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully!`);
      load(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Try again.');
    } finally { setUploading(null); }
  }, []);

  const stats = {
    total:    apps.length,
    pending:  apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  const stepIdx = (s) => STATUS_STEPS.indexOf(s);

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">My Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => load(true)} disabled={refreshing}
              className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-xl bg-white transition-colors tap-target">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/visa" className="btn-primary text-sm">+ Apply New Visa</Link>
          </div>
        </div>

        {error && <div className="mb-5"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            [FileText,    'Total',    stats.total,    'bg-blue-50 text-blue-600'],
            [Clock,       'Pending',  stats.pending,  'bg-amber-50 text-amber-600'],
            [CheckCircle, 'Approved', stats.approved, 'bg-emerald-50 text-emerald-600'],
            [XCircle,     'Rejected', stats.rejected, 'bg-red-50 text-red-500'],
          ].map(([Icon, label, val, cls]) => (
            <div key={label} className={`rounded-2xl p-4 ${cls.split(' ')[0]}`}>
              <Icon className={`w-5 h-5 mb-1.5 ${cls.split(' ')[1]}`} />
              <p className={`text-2xl font-extrabold ${cls.split(' ')[1]}`}>{val}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-primary">My Applications</h2>
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : apps.length === 0 ? (
            <EmptyState icon="✈️" title="No visa applications yet"
              subtitle="Browse visas and apply in minutes"
              actionHref="/visa" actionLabel="Browse Visas" />
          ) : (
            <div className="divide-y divide-gray-50">
              {apps.map(app => {
                const isExpanded = expanded === app._id;
                const canUpload  = ['pending','documents_received'].includes(app.status);
                const currentStep = stepIdx(app.status);

                return (
                  <div key={app._id} className="animate-fade-in-up">
                    {/* Main row */}
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : app._id)}>

                      <div className="flex items-center gap-4">
                        <span className="text-3xl leading-none flex-shrink-0">{app.visaId?.flag || '🌍'}</span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{app.visaId?.country || 'Unknown'} Visa</h3>
                            <StatusBadge status={app.status} />
                            {app.paymentStatus === 'paid' && <StatusBadge status="paid" />}
                          </div>
                          <p className="text-xs text-gray-400">
                            #{app.applicationId} · {app.planLabel} · ₹{app.pricePaid?.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Applied {new Date(app.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Upload docs */}
                        {canUpload && (
                          <label className="tap-target cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-all"
                            onClick={e => e.stopPropagation()}>
                            {uploading === app._id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Upload className="w-4 h-4" />}
                            {uploading === app._id ? 'Uploading…' : 'Upload Docs'}
                            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                              onChange={e => handleUpload(app._id, e.target.files)}
                              disabled={uploading === app._id} />
                          </label>
                        )}

                        {/* Pay now (if pending payment, not wallet) */}
                        {app.paymentStatus === 'pending' && app.pricePaid > 0 && app.paymentMethod !== 'wallet' && (
                          <Link href={`/apply?appId=${app._id}&amount=${app.pricePaid}&country=${encodeURIComponent(app.visaId?.country || '')}&plan=${encodeURIComponent(app.planLabel || '')}`}
                            onClick={e => e.stopPropagation()}
                            className="tap-target flex items-center gap-1.5 px-3 py-2 bg-cta text-white rounded-xl text-xs font-semibold hover:bg-orange-600 transition-all">
                            💳 Pay Now
                          </Link>
                        )}

                        {/* Invoice */}
                        <a href={pdfURL(app._id)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          title="Download Invoice"
                          className="tap-target flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all">
                          <Download className="w-4 h-4" /> Invoice
                        </a>

                        {/* Track via WA */}
                        <a href={waTrack(app.applicationId, app.applicantName)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          title="Track via WhatsApp"
                          className="tap-target flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition-all">
                          <MessageCircle className="w-4 h-4" /> Track
                        </a>

                        <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 bg-gray-50/50 border-t border-gray-100 animate-fade-in-up">

                        {/* Progress bar */}
                        {app.status !== 'rejected' && (
                          <div className="mt-4 mb-5">
                            <div className="flex justify-between mb-2 overflow-x-auto scrollbar-hide gap-1">
                              {STATUS_STEPS.slice(0, -1).map((s, i) => (
                                <div key={s} className="flex flex-col items-center flex-shrink-0 text-center min-w-[60px]">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all
                                    ${i <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    {i < currentStep ? '✓' : i + 1}
                                  </div>
                                  <p className={`text-xs leading-tight ${i <= currentStep ? 'text-primary font-semibold' : 'text-gray-400'}`}>
                                    {s.replace(/_/g,' ')}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (currentStep / (STATUS_STEPS.length - 2)) * 100)}%` }} />
                            </div>
                          </div>
                        )}

                        {app.status === 'rejected' && app.rejectionReason && (
                          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-600">{app.rejectionReason}</p>
                          </div>
                        )}

                        {/* Applicant details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                          {[
                            ['Applicant',    app.applicantName],
                            ['Email',        app.applicantEmail],
                            ['Phone',        app.applicantPhone],
                            ['Passport',     app.passportNumber || 'Not provided'],
                            ['Nationality',  app.nationality    || 'Not provided'],
                            ['Travel Date',  app.travelDate ? new Date(app.travelDate).toLocaleDateString('en-IN') : 'Not set'],
                          ].map(([k, v]) => (
                            <div key={k} className="bg-white rounded-xl p-3 border border-gray-100">
                              <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                              <p className="text-sm font-semibold text-gray-800 truncate">{v}</p>
                            </div>
                          ))}
                        </div>

                        {/* Status history */}
                        {app.statusHistory?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Status History</p>
                            <div className="space-y-2">
                              {app.statusHistory.slice().reverse().map((h, i) => (
                                <div key={i} className="flex items-start gap-3 text-xs">
                                  <div className="w-2 h-2 bg-secondary rounded-full mt-1 flex-shrink-0" />
                                  <div>
                                    <span className="font-semibold capitalize text-gray-700">{h.status.replace(/_/g,' ')}</span>
                                    {h.note && <span className="text-gray-400 ml-2">— {h.note}</span>}
                                    <p className="text-gray-300 mt-0.5">{new Date(h.updatedAt).toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Uploaded docs */}
                        {app.documents?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Uploaded Documents ({app.documents.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {app.documents.map((d, i) => (
                                <span key={i} className="badge bg-blue-50 text-blue-700">
                                  📎 {d.originalName || d.storedName || `Doc ${i+1}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
