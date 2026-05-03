'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet, TrendingUp, FileText, ArrowUpCircle, ArrowDownCircle,
  MessageCircle, Download, RefreshCw, ChevronRight, BarChart2,
  CheckCircle, Clock, XCircle, AlertCircle, Loader2
} from 'lucide-react';
import { agentAPI, pdfURL } from '../../../lib/api';
import { getUser } from '../../../lib/auth';
import { waTrack, waTopUp } from '../../../lib/whatsapp';
import StatusBadge from '../../../components/ui/StatusBadge';
import Loading from '../../../components/ui/Loading';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Applications', 'Wallet', 'Profit'];

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

  const loadWallet = useCallback(async () => {
    if (wallet) return; // cached
    setWalletLoading(true);
    try {
      const r = await agentAPI.getWallet();
      setWallet(r.data);
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
      toast.success('WhatsApp opened — send the message to request top-up');
      setTopUpAmt('');
    } catch { toast.error('Could not generate top-up request'); }
    finally { setTopUpLoading(false); }
  };

  /* ── Pending approval ─────────────────────────────────── */
  if (!loading && data?.pending) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-amber-400 mx-auto mb-5" />
          <h2 className="text-2xl font-extrabold text-primary mb-3">Account Pending Approval</h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Your agent account is under review. Our team will activate it within 24 hours.
            WhatsApp us to expedite.
          </p>
          <a href={data.whatsappLink} target="_blank" rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 mx-auto">
            <MessageCircle className="w-4 h-4" /> WhatsApp Us Now
          </a>
        </div>
      </div>
    );
  }

  const { stats = {}, applications = [], transactions = [], profitBreakdown = [] } = data || {};

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Agent Portal</h1>
            <p className="text-gray-500 text-sm mt-1">
              {user?.name}
              {stats.agentCode && <span className="ml-2 font-mono bg-blue-50 text-primary px-2 py-0.5 rounded-lg text-xs font-bold">{stats.agentCode}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => load(true)} disabled={refreshing}
              className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-xl bg-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/visa" className="btn-primary text-sm">+ Apply for Client</Link>
          </div>
        </div>

        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                ${tab === t ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? <Loading text="Loading dashboard…" /> : (

        <>
        {/* ══════════════════════════════════════════════════════
            OVERVIEW
        ══════════════════════════════════════════════════════ */}
        {tab === 'Overview' && (
          <div className="space-y-5">

            {/* Wallet card — hero */}
            <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-6 text-white">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Wallet Balance</p>
              <p className="text-5xl font-extrabold">₹{stats.walletBalance?.toLocaleString('en-IN') || 0}</p>
              <div className="flex gap-6 mt-5 flex-wrap">
                {[
                  ['Total Added',     `₹${stats.totalTopUp?.toLocaleString('en-IN') || 0}`],
                  ['Total Spent',     `₹${stats.totalSpent?.toLocaleString('en-IN') || 0}`],
                  ['Commission Earned',`₹${stats.totalCommission?.toLocaleString('en-IN') || 0}`],
                  ['Commission Rate', `${stats.commissionRate || 10}%`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-2xl font-bold text-white">{v}</p>
                    <p className="text-xs text-blue-200 mt-0.5">{k}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-3 flex-wrap">
                <button onClick={() => setTab('Wallet')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                  Top Up Wallet
                </button>
                <button onClick={() => setTab('Profit')}
                  className="bg-cta hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> View Profit Report
                </button>
              </div>
            </div>

            {/* Application stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                [FileText,    'Total',     stats.total    || 0, 'text-blue-600 bg-blue-50'],
                [Clock,       'Pending',   stats.pending  || 0, 'text-amber-600 bg-amber-50'],
                [CheckCircle, 'Approved',  stats.approved || 0, 'text-emerald-600 bg-emerald-50'],
                [XCircle,     'Rejected',  stats.rejected || 0, 'text-red-500 bg-red-50'],
              ].map(([Icon, label, val, cls]) => (
                <div key={label} className={`rounded-2xl p-4 ${cls.split(' ')[1]}`}>
                  <Icon className={`w-5 h-5 mb-2 ${cls.split(' ')[0]}`} />
                  <p className={`text-2xl font-extrabold ${cls.split(' ')[0]}`}>{val}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Recent applications */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-primary">Recent Applications</h3>
                <button onClick={() => setTab('Applications')} className="text-xs text-secondary hover:text-primary font-medium flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {applications.length === 0 ? (
                <EmptyState icon="📋" title="No applications yet" subtitle="Apply for your first client's visa" actionHref="/visa" actionLabel="Browse Visas" />
              ) : (
                <div className="space-y-2">
                  {applications.slice(0, 6).map(app => (
                    <div key={app._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{app.visaId?.flag || '🌍'}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{app.applicantName}</p>
                          <p className="text-xs text-gray-400 truncate">{app.visaId?.country} · ₹{app.agentCost?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={app.status} />
                        <a href={waTrack(app.applicationId, app.applicantName)} target="_blank" rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-green-500 hover:text-green-700 transition-all">
                          <MessageCircle className="w-4 h-4" />
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
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-primary">All Applications ({applications.length})</h2>
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
                    {applications.map(app => (
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
          <div className="space-y-5">

            {/* Balance hero */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Current Balance</p>
              <p className="text-5xl font-extrabold">₹{stats.walletBalance?.toLocaleString('en-IN') || 0}</p>
              <div className="flex gap-6 mt-4 flex-wrap text-sm text-emerald-100">
                <div><p className="text-white font-bold text-lg">₹{stats.totalTopUp?.toLocaleString('en-IN') || 0}</p><p>Total Added</p></div>
                <div><p className="text-white font-bold text-lg">₹{stats.totalSpent?.toLocaleString('en-IN') || 0}</p><p>Total Spent</p></div>
                <div><p className="text-white font-bold text-lg">₹{stats.totalCommission?.toLocaleString('en-IN') || 0}</p><p>Commission</p></div>
              </div>
            </div>

            {/* Top-up request */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-primary mb-1">Request Wallet Top-Up</h3>
              <p className="text-gray-400 text-sm mb-4">Enter amount → opens WhatsApp → send to admin to credit your wallet.</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input type="number" min="100" step="100" value={topUpAmt}
                    onChange={e => setTopUpAmt(e.target.value)}
                    placeholder="Amount (min ₹100)"
                    className="input-field pl-7 text-sm" />
                </div>
                <button onClick={handleTopUpRequest} disabled={topUpLoading}
                  className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-60">
                  {topUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  Request via WhatsApp
                </button>
              </div>
            </div>

            {/* Transaction history */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-center p-5 border-b border-gray-100">
                <h3 className="font-bold text-primary">Transaction History</h3>
                <button onClick={() => { setWallet(null); loadWallet(); }} className="text-secondary hover:text-primary">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {walletLoading ? <Loading text="Loading transactions…" /> :
                !wallet?.transactions?.length ? (
                  <EmptyState icon="💳" title="No transactions yet" subtitle="Top up your wallet to get started" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="bg-gray-50">
                        <tr className="text-xs text-gray-400 uppercase text-left">
                          {['Date','Type','Category','Amount','Balance After','Note'].map(h =>
                            <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {wallet.transactions.map(t => (
                          <tr key={t._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(t.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`flex items-center gap-1.5 font-semibold text-xs ${t.type==='credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {t.type==='credit' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                {t.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 capitalize">{t.category.replace(/_/g,' ')}</td>
                            <td className={`px-4 py-3 font-bold ${t.type==='credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {t.type==='credit' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">₹{t.balanceAfter?.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{t.description}</td>
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
        </>
        )}

      </div>
    </div>
  );
}
