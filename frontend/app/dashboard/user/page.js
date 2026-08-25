'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, Clock, CheckCircle, XCircle, Upload, Download,
  MessageCircle, RefreshCw, Loader2, ChevronRight, AlertTriangle, PlaneTakeoff, Gift,
  FolderOpen, Trash2, FilePlus2
} from 'lucide-react';
import { appAPI, docAPI, downloadInvoice, downloadApplicationPack, openApplicationDocument, uploadsOrigin } from '../../../lib/api';
import { getUser } from '../../../lib/auth';
import { waTrack } from '../../../lib/whatsapp';
import StatusBadge from '../../../components/ui/StatusBadge';
import Loading, { SkeletonCard } from '../../../components/ui/Loading';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending','documents_received','in_review','processing','sent_to_immigration','approved','delivered'];

export default function UserDashboard() {
  const router = useRouter();
  const user   = getUser();

  const [apps,       setApps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading,  setUploading]  = useState(null);
  const [expanded,   setExpanded]   = useState(null);
  const [error,      setError]      = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState(null);
  const [vaultDocs,  setVaultDocs]  = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultUploading, setVaultUploading] = useState(false);
  const [vaultDocType, setVaultDocType] = useState('passport');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'user') { router.push(`/dashboard/${user.role}`); return; }
    load();
    appAPI.getMyAvatar().then(res => {
      if (res.data?.avatarUrl) setAvatarUrl(`${uploadsOrigin}${res.data.avatarUrl}`);
    }).catch(() => {});
    loadVault();
  }, []);

  const loadVault = useCallback(async () => {
    setVaultLoading(true);
    try {
      const r = await docAPI.getMine();
      setVaultDocs(r.data.data || []);
    } catch { /* silent — non-critical */ }
    finally { setVaultLoading(false); }
  }, []);

  const uploadToVault = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File exceeds 5 MB limit.'); return; }
    setVaultUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('documentType', vaultDocType);
      const r = await docAPI.upload(fd);
      setVaultDocs(prev => [r.data.data, ...prev]);
      toast.success('Document saved to your vault');
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setVaultUploading(false); }
  };

  const removeFromVault = async (id) => {
    try {
      await docAPI.remove(id);
      setVaultDocs(prev => prev.filter(d => d._id !== id));
      toast.success('Document removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
  };

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
    <div className="pt-16 min-h-screen bg-gradient-to-b from-[#0a1f35] via-[#0d2d45] to-[#f8f9fa]">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#FF7A00] rounded-full blur-3xl opacity-5"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              {avatarUrl && (
                <img src={avatarUrl} alt={user?.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#FF7A00] flex-shrink-0" />
              )}
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
                  My Visa Applications
                </h1>
                <p className="text-white/80 text-lg">Welcome back, <span className="font-bold text-[#FF7A00]">{user?.name}</span> 👋 — Track your visa applications in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => load(true)} disabled={refreshing}
                className="p-3 text-white/70 hover:text-[#FF7A00] border border-white/20 rounded-xl bg-white/10 backdrop-blur transition-all hover:border-[#FF7A00]/50 tap-target">
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/visa" className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white transition-all shadow-lg">+ Apply Visa</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && <div className="mb-5"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {/* Stats - Glassmorphic Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            [FileText,    'Total Apps',  stats.total,    'text-blue-400', 'from-blue-500/20 to-blue-500/5'],
            [Clock,       'Pending',     stats.pending,  'text-amber-400', 'from-amber-500/20 to-amber-500/5'],
            [CheckCircle, 'Approved',    stats.approved, 'text-emerald-400', 'from-emerald-500/20 to-emerald-500/5'],
            [XCircle,     'Rejected',    stats.rejected, 'text-red-400', 'from-red-500/20 to-red-500/5'],
          ].map(([Icon, label, val, iconColor, bgGradient]) => (
            <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br ${bgGradient} border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all`}>
              <Icon className={`w-6 h-6 mb-2 ${iconColor}`} />
              <p className="text-3xl font-black text-white">{val}</p>
              <p className="text-xs text-white/60 font-semibold mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Referral program */}
        <div className="mb-8 rounded-2xl p-5 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-2">
                <Gift className="w-4 h-4" /> Refer &amp; Earn
              </p>
              <p className="text-white/70 text-sm mt-1">
                {user?.referralCode
                  ? <>Share your link — you get <strong className="text-white">₹200</strong> credited to your wallet when someone you refer gets their first visa approved.</>
                  : 'Log in again to get your personal referral link.'}
              </p>
            </div>
            {user?.referralCode && (
              <button
                onClick={() => {
                  const link = `${window.location.origin}/auth/register?ref=${user.referralCode}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Referral link copied!');
                }}
                className="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all">
                Copy Referral Link
              </button>
            )}
          </div>
        </div>

        {/* Document Vault */}
        <div className="mb-8 rounded-2xl p-5 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm font-bold text-white/90 uppercase tracking-wide flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#FF7A00]" /> My Documents
            </p>
            <div className="flex items-center gap-2">
              <select value={vaultDocType} onChange={e => setVaultDocType(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white">
                {['passport','photo','bank_statement','itr','employment_letter','business_registration','invitation_letter','insurance','hotel_booking','flight_itinerary','other'].map(t => (
                  <option key={t} value={t} className="text-gray-900">{t.replace(/_/g,' ')}</option>
                ))}
              </select>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FF7A00] hover:bg-orange-600 text-white transition-all">
                {vaultUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FilePlus2 className="w-3.5 h-3.5" />}
                Add
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { uploadToVault(e.target.files?.[0]); e.target.value = ''; }} disabled={vaultUploading} />
              </label>
            </div>
          </div>
          {vaultLoading ? (
            <p className="text-xs text-white/40">Loading…</p>
          ) : vaultDocs.length === 0 ? (
            <p className="text-xs text-white/40">No documents saved yet. Upload your passport, photo, or other documents once — you'll be able to reuse them for future applications.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {vaultDocs.map(d => (
                <div key={d._id} className="flex items-center justify-between gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/90 capitalize truncate">{d.documentType.replace(/_/g,' ')}</p>
                    <p className="text-[10px] text-white/40 truncate">{d.originalName}</p>
                  </div>
                  <button onClick={() => removeFromVault(d._id)} className="text-white/40 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <h2 className="font-black text-white text-xl flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#FF7A00]" />
              My Applications
            </h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : apps.length === 0 ? (
            <EmptyState icon="✈️" title="No visa applications yet"
              subtitle="Browse visas and apply in minutes"
              actionHref="/visa" actionLabel="Browse Visas" />
          ) : (
            <div className="divide-y divide-white/5">
              {apps.map(app => {
                const isExpanded = expanded === app._id;
                const pendingDocRequests = (app.docsRequested || []).filter(r => !r.fulfilled);
                const canUpload  = ['pending','documents_received'].includes(app.status) || pendingDocRequests.length > 0;
                const visaDoc    = app.documents?.find(d => d.docType === 'visaDocument');
                const currentStep = stepIdx(app.status);

                return (
                  <div key={app._id} className="animate-fade-in-up hover:bg-white/5 transition-colors">
                    {/* Main Card */}
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 cursor-pointer transition-all"
                      onClick={() => setExpanded(isExpanded ? null : app._id)}>

                      <div className="flex items-center gap-4">
                        <div className="text-4xl leading-none flex-shrink-0 p-3 bg-white/10 rounded-2xl">{app.visaId?.flag || '🌍'}</div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-black text-white text-lg">{app.visaId?.country || 'Unknown'} Visa</h3>
                            <StatusBadge status={app.status} />
                            {app.paymentStatus === 'paid' && <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">✓ Paid</div>}
                          </div>
                          <p className="text-sm text-white/60">
                            #{app.applicationId} · <span className="font-semibold text-white">{app.planLabel}</span> · <span className="text-[#FF7A00] font-bold">₹{app.pricePaid?.toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-white/60 uppercase tracking-wide">Status Progress</p>
                          <p className="text-lg font-black text-white">{currentStep + 1} of {STATUS_STEPS.length}</p>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-white/5 bg-white/2 p-6 space-y-4">
                        {/* Status Timeline */}
                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/60 font-bold mb-3">Processing Timeline</p>
                          <div className="flex gap-2">
                            {STATUS_STEPS.map((step, idx) => {
                              const isActive = idx <= currentStep;
                              const isPast = idx < currentStep;
                              const isCurrent = idx === currentStep;
                              
                              return (
                                <div key={step} className="flex-1 flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    isCurrent ? 'bg-[#FF7A00] text-white scale-125' :
                                    isPast ? 'bg-emerald-500 text-white' :
                                    isActive ? 'bg-white/20 text-white/80 border border-white/40' :
                                    'bg-white/10 text-white/40'
                                  }`}>
                                    {isPast ? '✓' : idx + 1}
                                  </div>
                                  <p className="text-xs text-white/50 mt-1 text-center leading-tight">{step.split('_').pop()}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Visa ready — dispatched by admin */}
                        {visaDoc && (
                          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <PlaneTakeoff className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                              <div>
                                <p className="font-bold text-white text-sm">Your visa is ready!</p>
                                <p className="text-xs text-white/70">Dispatched to your email — download it below.</p>
                              </div>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); openApplicationDocument(app._id, 'visaDocument').catch(() => toast.error('Could not open document')); }}
                              className="flex-shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 transition-colors">
                              <Download className="w-4 h-4" /> Download
                            </button>
                          </div>
                        )}

                        {/* Additional documents requested by admin */}
                        {pendingDocRequests.length > 0 && (
                          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                              <p className="font-bold text-white text-sm">Additional documents needed</p>
                            </div>
                            {pendingDocRequests.map((r, i) => (
                              <div key={i} className="text-xs text-amber-100 mb-1">
                                <span className="font-semibold">{r.items.join(', ')}</span>
                                {r.note && <span className="text-amber-200/80"> — {r.note}</span>}
                              </div>
                            ))}
                            <p className="text-xs text-white/60 mt-2">Upload them below, or reply on WhatsApp.</p>
                          </div>
                        )}

                        {/* Documents Upload Section */}
                        {canUpload && (
                          <div className="bg-gradient-to-br from-[#FF7A00]/20 to-orange-500/10 border border-[#FF7A00]/30 rounded-2xl p-4">
                            <label className="flex flex-col items-center gap-3 cursor-pointer">
                              <input type="file" multiple onChange={(e) => handleUpload(app._id, e.target.files)}
                                disabled={uploading === app._id}
                                className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                              <Upload className={`w-5 h-5 ${uploading === app._id ? 'animate-spin' : 'text-[#FF7A00]'}`} />
                              <div className="text-center">
                                <p className="font-bold text-white text-sm">{uploading === app._id ? 'Uploading...' : 'Upload Documents'}</p>
                                <p className="text-xs text-white/70">PDF, JPG, PNG (max 5MB each)</p>
                              </div>
                            </label>
                          </div>
                        )}

                        {/* Approved, visa file not dispatched yet */}
                        {app.status === 'approved' && !visaDoc && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            <p className="text-xs text-blue-100">Your visa is approved! The final visa file will appear here for download as soon as it's dispatched.</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={e => { e.stopPropagation(); downloadInvoice(app._id, app.applicationId).catch(() => toast.error('Could not download invoice')); }}
                            className="flex-1 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-all border border-blue-500/30">
                            <Download className="w-4 h-4" /> Invoice
                          </button>
                          <button onClick={e => { e.stopPropagation(); downloadApplicationPack(app._id, app.applicationId).catch(() => toast.error('Could not download pack')); }}
                            className="flex-1 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-purple-500/30 transition-all border border-purple-500/30">
                            <FolderOpen className="w-4 h-4" /> Documents (ZIP)
                          </button>
                          <a href={waTrack(app.applicationId, user?.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="flex-1 px-4 py-2 rounded-xl bg-green-500/20 text-green-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-500/30 transition-all border border-green-500/30">
                            <MessageCircle className="w-4 h-4" /> Track
                          </a>
                        </div>
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
