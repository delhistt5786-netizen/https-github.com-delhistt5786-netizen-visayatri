'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet, TrendingUp, FileText, ArrowUpCircle, ArrowDownCircle,
  MessageCircle, Download, RefreshCw, ChevronRight, BarChart2,
  CheckCircle, Clock, XCircle, AlertCircle, Loader2, User, Save, Search,
} from 'lucide-react';
import { agentAPI, authAPI, pdfURL } from '../../../lib/api';
import { getUser, setAuth, getToken } from '../../../lib/auth';
import { waTrack, waTopUp } from '../../../lib/whatsapp';
import StatusBadge from '../../../components/ui/StatusBadge';
import Loading from '../../../components/ui/Loading';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Applications', 'Wallet', 'Profit', 'Profile'];

export default function AgentDashboard() {
  const router = useRouter();
  const user   = getUser();

  const [tab,       setTab]       = useState('Overview');
  const [data,      setData]      = useState(null);
  const [wallet,    setWallet]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topUpAmt,  setTopUpAmt]  = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [appSearch, setAppSearch] = useState('');

  /* Profile form */
  const [profileForm, setProfileForm] = useState({ name:'', phone:'', companyName:'', city:'', gstNumber:'' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (user) setProfileForm({
      name: user.name || '', phone: user.phone || '',
      companyName: user.companyName || '', city: user.city || '', gstNumber: user.gstNumber || '',
    });
  }, []);

  const saveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const r = await authAPI.updateProfile(profileForm);
      setAuth(getToken(), { ...user, ...r.data.user });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (!pwdForm.currentPassword || !pwdForm.newPassword) { toast.error('Fill in all password fields'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    setChangingPwd(true);
    try {
      await authAPI.changePassword(pwdForm);
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setChangingPwd(false); }
  };

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'agent') { router.push('/dashboard/user'); return; }
    load();
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const r = await agentAPI.getDashboard();
      setData(r.data);
    } catch (err) {
      if (err.response?.data?.code === 'AGENT_PENDING') {
        setData({ pending: true, whatsappLink: err.response.data.whatsappLink });
      } else {
        setError(err.response?.data?.message || 'Could not load dashboard. Please refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const [topUpRequests, setTopUpRequests] = useState([]);

  const loadWallet = useCallback(async () => {
    if (wallet) return; // cached
    setWalletLoading(true);
    try {
      const [r, reqs] = await Promise.all([agentAPI.getWallet(), agentAPI.myTopUpRequests()]);
      setWallet(r.data);
      setTopUpRequests(reqs.data.data || []);
    } catch { toast.error('Could not load wallet data'); }
    finally { setWalletLoading(false); }
  }, [wallet]);

  useEffect(() => { if (tab === 'Wallet') loadWallet(); }, [tab]);

  const handleTopUpRequest = async () => {
    const amt = Number(topUpAmt);
    if (!amt || amt < 100) { toast.error('Minimum top-up is ₹100'); return; }
    setTopUpLoading(true);
    try {
      const { data: res } = await agentAPI.topUpRequest(amt);
      window.open(res.whatsappLink, '_blank');
      toast.success('Request submitted — admin will review it, or ping them on WhatsApp for faster approval');
      setTopUpAmt('');
      if (res.request) setTopUpRequests(prev => [res.request, ...prev]);
    } catch { toast.error('Could not submit top-up request'); }
    finally { setTopUpLoading(false); }
  };

  /* ── Pending approval ─────────────────────────────────── */
  if (!loading && data?.pending) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#FF7A00] rounded-full blur-3xl opacity-5"></div>
        </div>
        
        <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md w-full text-center relative z-10">
          <Clock className="w-16 h-16 text-[#FF7A00] mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-3">Account Pending Approval</h2>
          <p className="text-white/80 leading-relaxed mb-8">
            Your agent account is under review by our team. You'll be activated within 24 hours. Connect with us on WhatsApp to expedite.
          </p>
          <a href={data.whatsappLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold transition-all shadow-lg">
            <MessageCircle className="w-5 h-5" /> WhatsApp Us Now
          </a>
        </div>
      </div>
    );
  }

  const { stats = {}, applications = [], transactions = [], profitBreakdown = [] } = data || {};

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
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
                Agent Portal
              </h1>
              <p className="text-white/80 text-lg flex items-center gap-2">
                Welcome, <span className="font-bold text-[#FF7A00]">{user?.name}</span>
                {stats.agentCode && <span className="ml-2 font-mono bg-white/10 text-[#FF7A00] px-3 py-1 rounded-lg text-sm font-bold border border-[#FF7A00]/30">Agent: {stats.agentCode}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => load(true)} disabled={refreshing}
                className="p-3 text-white/70 hover:text-[#FF7A00] border border-white/20 rounded-xl bg-white/10 backdrop-blur transition-all hover:border-[#FF7A00]/50 tap-target">
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/visa" className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white transition-all shadow-lg">+ Apply for Client</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t 
                  ? 'bg-gradient-to-r from-[#FF7A00] to-orange-500 text-white shadow-lg' 
                  : 'bg-white/10 text-white/70 border border-white/20 backdrop-blur hover:border-[#FF7A00]/50 hover:text-[#FF7A00]'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? <Loading text="Loading your agent dashboard…" /> : (

        <>
        {/* ══════════════════════════════════════════════════════
            OVERVIEW
        ══════════════════════════════════════════════════════ */}
        {tab === 'Overview' && (
          <div className="space-y-8">

            {/* Wallet Card - Hero */}
            <div className="bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] rounded-3xl p-8 text-white relative overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-5 right-5 w-72 h-72 bg-[#FF7A00] rounded-full blur-3xl opacity-10"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-2">Your Wallet Balance</p>
                    <p className="text-6xl font-black">₹{stats.walletBalance?.toLocaleString('en-IN') || 0}</p>
                  </div>
                  <Wallet className="w-12 h-12 text-[#FF7A00] opacity-20" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 pb-8 border-b border-white/10">
                  {[
                    ['Total Added',           `₹${stats.totalTopUp?.toLocaleString('en-IN') || 0}`],
                    ['Total Spent',          `₹${stats.totalSpent?.toLocaleString('en-IN') || 0}`],
                    ['Commission Earned',    `₹${stats.totalCommission?.toLocaleString('en-IN') || 0}`],
                    ['Commission Rate',      `${stats.commissionRate || 10}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur">
                      <p className="text-2xl font-black text-white">{v}</p>
                      <p className="text-xs text-white/60 mt-1 font-semibold uppercase tracking-wide">{k}</p>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => setTab('Wallet')}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold transition-all backdrop-blur">
                    💰 Top Up Wallet
                  </button>
                  <button onClick={() => setTab('Profit')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white font-bold transition-all shadow-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> View Profit Report
                  </button>
                </div>
              </div>
            </div>

            {/* Application Stats - Glassmorphic Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                [FileText,    'Total Apps',   stats.total    || 0, 'text-blue-400', 'from-blue-500/20 to-blue-500/5'],
                [Clock,       'Pending',      stats.pending  || 0, 'text-amber-400', 'from-amber-500/20 to-amber-500/5'],
                [CheckCircle, 'Approved',     stats.approved || 0, 'text-emerald-400', 'from-emerald-500/20 to-emerald-500/5'],
                [XCircle,     'Rejected',     stats.rejected || 0, 'text-red-400', 'from-red-500/20 to-red-500/5'],
              ].map(([Icon, label, val, iconColor, bgGradient]) => (
                <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br ${bgGradient} border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all`}>
                  <Icon className={`w-6 h-6 mb-2 ${iconColor}`} />
                  <p className="text-3xl font-black text-white">{val}</p>
                  <p className="text-xs text-white/60 font-semibold mt-1 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            {/* Recent Applications */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent flex justify-between items-center">
                <h3 className="font-black text-white text-xl flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#FF7A00]" />
                  Recent Applications
                </h3>
                <button onClick={() => setTab('Applications')} className="text-xs text-[#FF7A00] hover:text-orange-400 font-bold flex items-center gap-1 transition-colors">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {applications.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon="📋" title="No applications yet" subtitle="Apply for your first client's visa" actionHref="/visa" actionLabel="Browse Visas" />
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                  {applications.slice(0, 6).map(app => (
                    <div key={app._id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-3xl flex-shrink-0 p-3 bg-white/10 rounded-2xl">{app.visaId?.flag || '🌍'}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{app.applicantName}</p>
                          <p className="text-xs text-white/60 truncate">{app.visaId?.country} · <span className="text-[#FF7A00] font-bold">₹{app.agentCost?.toLocaleString('en-IN')}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusBadge status={app.status} />
                        <a href={waTrack(app.applicationId, app.applicantName)} target="_blank" rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-green-400 hover:text-green-300 transition-all">
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            APPLICATIONS
        ══════════════════════════════════════════════════════ */}
        {tab === 'Applications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
              <h2 className="font-bold text-primary">
                All Applications ({applications.filter(app => !appSearch || [app.applicantName, app.applicationId, app.visaId?.country, app.applicantPhone].some(f => f?.toLowerCase().includes(appSearch.toLowerCase()))).length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input placeholder="Search client, country, ID…" value={appSearch} onChange={e => setAppSearch(e.target.value)}
                  className="input-field text-sm pl-9 w-56" />
              </div>
            </div>
            {applications.length === 0 ? (
              <EmptyState icon="📋" title="No applications yet" actionHref="/visa" actionLabel="Apply for First Client" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[750px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-400 text-xs uppercase">
                      {['App ID','Client','Visa','Plan','My Cost','Profit','Status','Actions'].map(h =>
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {applications
                      .filter(app => !appSearch || [app.applicantName, app.applicationId, app.visaId?.country, app.applicantPhone].some(f => f?.toLowerCase().includes(appSearch.toLowerCase())))
                      .map(app => (
                      <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">#{app.applicationId?.slice(-8)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs text-gray-900">{app.applicantName}</p>
                          <p className="text-xs text-gray-400">{app.applicantPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{app.visaId?.flag} {app.visaId?.country}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{app.planLabel}</td>
                        <td className="px-4 py-3 font-bold text-primary">₹{app.agentCost?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-4 py-3">
                          {app.agentProfit > 0
                            ? <span className="text-emerald-600 font-bold">+₹{app.agentProfit?.toLocaleString('en-IN')}</span>
                            : <span className="text-gray-300">—</span>
                          }
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a href={pdfURL(app._id)} target="_blank" rel="noopener noreferrer"
                              title="Download Invoice" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                              <Download className="w-4 h-4" />
                            </a>
                            <a href={waTrack(app.applicationId, app.applicantName)} target="_blank" rel="noopener noreferrer"
                              title="Track via WhatsApp" className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            WALLET
        ══════════════════════════════════════════════════════ */}
        {tab === 'Wallet' && (
          <div className="space-y-8">

            {/* Balance Hero Card */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white relative overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-5 right-5 w-72 h-72 bg-white rounded-full blur-3xl opacity-10"></div>
              </div>
              
              <div className="relative z-10">
                <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-2">Your Wallet Balance</p>
                <p className="text-6xl font-black mb-8">₹{stats.walletBalance?.toLocaleString('en-IN') || 0}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-wide">Total Added</p>
                    <p className="text-3xl font-black text-white mt-2">₹{stats.totalTopUp?.toLocaleString('en-IN') || 0}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-wide">Total Spent</p>
                    <p className="text-3xl font-black text-white mt-2">₹{stats.totalSpent?.toLocaleString('en-IN') || 0}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-wide">Commissions</p>
                    <p className="text-3xl font-black text-white mt-2">₹{stats.totalCommission?.toLocaleString('en-IN') || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-up Request Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-xl p-8 shadow-2xl">
              <h3 className="font-black text-white text-xl mb-2 flex items-center gap-3">
                <ArrowUpCircle className="w-6 h-6 text-[#FF7A00]" />
                Request Wallet Top-Up
              </h3>
              <p className="text-white/70 text-sm mb-6">Enter the amount you want to add → Opens WhatsApp → Send the message to our admin team</p>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-bold">₹</span>
                  <input type="number" min="100" step="100" value={topUpAmt}
                    onChange={e => setTopUpAmt(e.target.value)}
                    placeholder="Amount (min ₹100)"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all" />
                </div>
                <button onClick={handleTopUpRequest} disabled={topUpLoading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold transition-all shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-60">
                  {topUpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                  Request on WhatsApp
                </button>
              </div>

              {topUpRequests.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wide mb-3">My Recent Requests</p>
                  <div className="space-y-2">
                    {topUpRequests.slice(0, 5).map(r => (
                      <div key={r._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        <div>
                          <p className="font-bold text-white">₹{r.amount?.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-white/50">{new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          r.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {r.status === 'pending' ? '⏳ Pending' : r.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <h3 className="font-black text-white text-xl flex items-center gap-3">
                  <BarChart2 className="w-6 h-6 text-[#FF7A00]" />
                  Transaction History
                </h3>
                <button onClick={() => { setWallet(null); loadWallet(); }} className="text-white/60 hover:text-[#FF7A00] transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              
              {walletLoading ? <div className="p-6"><Loading text="Loading transactions…" /></div> :
                !wallet?.transactions?.length ? (
                  <div className="p-6">
                    <EmptyState icon="💳" title="No transactions yet" subtitle="Top up your wallet to get started" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs text-white/60 uppercase font-bold tracking-wide">
                          {['Date','Type','Category','Amount','Balance After','Note'].map(h =>
                            <th key={h} className="px-6 py-4 text-left">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {wallet.transactions.map(t => (
                          <tr key={t._id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs text-white/60">
                              {new Date(t.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`flex items-center gap-2 font-bold text-sm ${t.type==='credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {t.type==='credit' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                {t.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-white/70 capitalize">{t.category.replace(/_/g,' ')}</td>
                            <td className={`px-6 py-4 font-bold ${t.type==='credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {t.type==='credit' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 font-bold text-white">₹{t.balanceAfter?.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4 text-xs text-white/60 max-w-xs truncate">{t.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            PROFIT REPORT
        ══════════════════════════════════════════════════════ */}
        {tab === 'Profit' && (
          <div className="space-y-5">

            {/* Profit summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['Total Potential Profit', `₹${stats.totalPotentialProfit?.toLocaleString('en-IN') || 0}`, 'bg-emerald-50 text-emerald-700', '🎯'],
                ['Commission Earned',      `₹${stats.totalCommission?.toLocaleString('en-IN') || 0}`,      'bg-blue-50 text-blue-700',    '💰'],
                ['Total Spent on Visas',   `₹${stats.totalSpent?.toLocaleString('en-IN') || 0}`,           'bg-orange-50 text-orange-700', '💳'],
              ].map(([label, val, cls, icon]) => (
                <div key={label} className={`rounded-2xl p-5 ${cls}`}>
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-2xl font-extrabold">{val}</p>
                  <p className="text-sm font-medium mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Per-visa profit breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-primary flex items-center gap-2"><BarChart2 className="w-5 h-5" /> Profit by Visa Destination</h3>
                <p className="text-xs text-gray-400 mt-1">Profit = Public Price − Your Agent Cost</p>
              </div>
              {profitBreakdown.length === 0 ? (
                <EmptyState icon="📊" title="No data yet" subtitle="Apply for clients to see profit breakdown" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-gray-50">
                      <tr className="text-xs text-gray-400 uppercase text-left">
                        {['Destination','Applications','Approved','Total Cost','Total Profit','Avg Profit/App'].map(h =>
                          <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {profitBreakdown.map(v => (
                        <tr key={v.country} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-sm">{v.flag} {v.country}</td>
                          <td className="px-4 py-3 text-center font-bold">{v.count}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-emerald-600 font-bold">{v.approved}</span>
                            <span className="text-gray-300 text-xs">/{v.count}</span>
                          </td>
                          <td className="px-4 py-3 text-primary font-bold">₹{v.totalCost?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${v.totalProfit > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {v.totalProfit > 0 ? `+₹${v.totalProfit?.toLocaleString('en-IN')}` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {v.count > 0 ? `₹${Math.round(v.totalProfit / v.count).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            PROFILE
        ══════════════════════════════════════════════════════ */}
        {tab === 'Profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
                <User className="w-5 h-5" /> Profile Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                  <div><p className="text-gray-400 text-xs mb-1">Agent Code</p><p className="font-mono font-bold text-primary">{user?.agentCode}</p></div>
                  <div><p className="text-gray-400 text-xs mb-1">Email</p><p className="font-semibold truncate">{user?.email}</p></div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name</label>
                  <input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    className="input-field text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Company Name</label>
                    <input value={profileForm.companyName} onChange={e => setProfileForm({...profileForm, companyName: e.target.value})}
                      className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">City</label>
                    <input value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})}
                      className="input-field text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">GST Number</label>
                  <input value={profileForm.gstNumber} onChange={e => setProfileForm({...profileForm, gstNumber: e.target.value})}
                    className="input-field text-sm" />
                </div>
                <button onClick={saveProfile} disabled={savingProfile}
                  className="btn-primary w-full justify-center disabled:opacity-60">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingProfile ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
                <Save className="w-5 h-5" /> Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Current Password</label>
                  <input type="password" value={pwdForm.currentPassword}
                    onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">New Password</label>
                  <input type="password" value={pwdForm.newPassword}
                    onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Confirm New Password</label>
                  <input type="password" value={pwdForm.confirmPassword}
                    onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})}
                    className="input-field text-sm" />
                </div>
                <button onClick={changePassword} disabled={changingPwd}
                  className="btn-primary w-full justify-center disabled:opacity-60">
                  {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {changingPwd ? 'Updating…' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
}
