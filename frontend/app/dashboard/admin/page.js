'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, FileText, Globe, DollarSign, TrendingUp, ArrowUpCircle,
  RefreshCw, CheckCircle, XCircle, MessageCircle, Edit2, Save, X,
  Loader2, BarChart2, Search, Filter
} from 'lucide-react';
import { adminAPI, agentAPI, appAPI, visaAPI } from '../../../lib/api';
import { getUser } from '../../../lib/auth';
import StatusBadge from '../../../components/ui/StatusBadge';
import Loading from '../../../components/ui/Loading';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import toast from 'react-hot-toast';

const TABS = ['Dashboard','Applications','Agents','Visas','Users','Transactions','Settings'];
const APP_STATUSES = ['pending','documents_received','in_review','processing','approved','rejected','delivered'];

export default function AdminDashboard() {
  const router = useRouter();
  const user   = getUser();

  const [tab,      setTab]       = useState('Dashboard');
  const [dash,     setDash]      = useState(null);
  const [apps,     setApps]      = useState([]);
  const [agents,   setAgents]    = useState([]);
  const [visas,    setVisas]     = useState([]);
  const [users,    setUsers]     = useState([]);
  const [txns,     setTxns]      = useState([]);
  const [settings, setSettings]  = useState(null);
  const [loading,  setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,    setError]     = useState('');

  /* Filters */
  const [statusFilter, setStatusFilter] = useState('');
  const [appSearch,    setAppSearch]    = useState('');

  /* Credit wallet form */
  const [creditForm, setCreditForm] = useState({ agentId:'', amount:'', description:'' });
  const [crediting,  setCrediting]  = useState(false);

  /* Edit application modal */
  const [editApp,    setEditApp]    = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [saving,     setSaving]     = useState(false);

  /* Edit agent modal */
  const [editAgent,  setEditAgent]  = useState(null);
  const [agentForm,  setAgentForm]  = useState({});

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    loadAll();
  }, []);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [d, a, ag, v, u, t, s] = await Promise.all([
        adminAPI.getDashboard(),
        appAPI.getAll({ limit: 100 }),
        agentAPI.getList(),
        visaAPI.getAll({ active: 'false' }),
        adminAPI.getUsers({ limit: 100 }),
        adminAPI.getTransactions({ limit: 50 }),
        adminAPI.getSettings(),
      ]);
      setDash(d.data);
      setApps(a.data.data     || []);
      setAgents(ag.data.data  || []);
      setVisas(v.data.data    || []);
      setUsers(u.data.data    || []);
      setTxns(t.data.data     || []);
      setSettings(s.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  /* ── Update app status ─────────────────────────────────── */
  const updateStatus = useCallback(async (id, status) => {
    try {
      await appAPI.updateStatus(id, { status });
      toast.success(`Status → ${status.replace(/_/g,' ')}`);
      setApps(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch { toast.error('Update failed'); }
  }, []);

  /* ── Toggle agent approve/suspend ──────────────────────── */
  const toggleAgent = useCallback(async (id, current) => {
    try {
      const r = await agentAPI.approve(id, !current);
      toast.success(r.data.message);
      setAgents(prev => prev.map(a => a._id === id ? { ...a, isApproved: !current } : a));
    } catch { toast.error('Failed'); }
  }, []);

  /* ── Toggle user active ────────────────────────────────── */
  const toggleUser = useCallback(async (id) => {
    try {
      await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
      toast.success('User updated');
    } catch { toast.error('Failed'); }
  }, []);

  /* ── Credit agent wallet ───────────────────────────────── */
  const creditWallet = useCallback(async () => {
    if (!creditForm.agentId || !creditForm.amount || Number(creditForm.amount) <= 0) {
      toast.error('Select agent and enter a positive amount'); return;
    }
    setCrediting(true);
    try {
      const r = await agentAPI.creditWallet(creditForm);
      toast.success(r.data.message);
      setCreditForm({ agentId:'', amount:'', description:'' });
      setAgents(prev => prev.map(a => a._id === creditForm.agentId
        ? { ...a, walletBalance: r.data.walletBalance }
        : a
      ));
      const t = await adminAPI.getTransactions({ limit: 50 }); setTxns(t.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to credit wallet'); }
    finally { setCrediting(false); }
  }, [creditForm]);

  /* ── Save edited application ───────────────────────────── */
  const saveEditApp = useCallback(async () => {
    setSaving(true);
    try {
      await appAPI.updateStatus(editApp._id, { 
        status: editForm.status, 
        note: editForm.note, 
        adminNotes: editForm.adminNotes 
      });
      toast.success('Application updated successfully');
      setApps(prev => prev.map(a => 
        a._id === editApp._id 
          ? { ...a, status: editForm.status, adminNotes: editForm.adminNotes } 
          : a
      ));
      setEditApp(null);
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Save failed'); 
    }
    finally { setSaving(false); }
  }, [editApp, editForm]);

  /* ── Save agent edits ──────────────────────────────────── */
  const saveEditAgent = useCallback(async () => {
    setSaving(true);
    try {
      const r = await agentAPI.approve(editAgent._id, agentForm.isApproved);
      setAgents(prev => prev.map(a => 
        a._id === editAgent._id 
          ? { ...a, isApproved: agentForm.isApproved, commissionRate: Number(agentForm.commissionRate) } 
          : a
      ));
      toast.success('Agent updated successfully');
      setEditAgent(null);
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Save failed'); 
    }
    finally { setSaving(false); }
  }, [editAgent, agentForm]);

  /* ── Save settings ─────────────────────────────────────── */
  const saveSettings = useCallback(async (formData) => {
    setSaving(true);
    try {
      const r = await adminAPI.updateSettings(formData);
      setSettings(r.data.data);
      toast.success('Settings updated successfully');
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Save failed'); 
    }
    finally { setSaving(false); }
  }, []);

  /* ── Edit visa prices ──────────────────────────────────── */
  const [editVisa, setEditVisa] = useState(null);
  const [visaForm, setVisaForm] = useState({});

  const saveEditVisa = useCallback(async () => {
    setSaving(true);
    try {
      const r = await visaAPI.update(editVisa._id, visaForm);
      setVisas(prev => prev.map(v => v._id === editVisa._id ? r.data.data : v));
      toast.success('Visa prices updated successfully');
      setEditVisa(null);
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Save failed'); 
    }
    finally { setSaving(false); }
  }, [editVisa, visaForm]);

  /* ── Filtered apps ─────────────────────────────────────── */
  const filteredApps = apps.filter(a => {
    const ms = !statusFilter || a.status === statusFilter;
    const mq = !appSearch || [a.applicantName, a.applicationId, a.visaId?.country, a.applicantPhone]
      .some(f => f?.toLowerCase().includes(appSearch.toLowerCase()));
    return ms && mq;
  });

  if (loading) return <div className="pt-20"><Loading text="Loading admin panel…" /></div>;

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">Visayatri CRM · {user?.name}</p>
          </div>
          <button onClick={() => loadAll(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm btn-outline disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && <div className="mb-5"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                ${tab===t ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'}`}>
              {t}
              {t === 'Agents' && agents.filter(a => !a.isApproved).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {agents.filter(a => !a.isApproved).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            DASHBOARD
        ══════════════════════════════════════════════════════ */}
        {tab === 'Dashboard' && dash && (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                [Users,      'Users',        dash.stats.totalUsers,        'bg-blue-50   text-blue-600'],
                [Users,      'Agents',       dash.stats.totalAgents,       'bg-purple-50 text-purple-600'],
                [FileText,   'Applications', dash.stats.totalApplications, 'bg-orange-50 text-orange-600'],
                [Globe,      'Visas',        dash.stats.totalVisas,        'bg-cyan-50   text-cyan-600'],
                [DollarSign, 'Revenue',      `₹${(dash.stats.revenue||0).toLocaleString('en-IN')}`, 'bg-emerald-50 text-emerald-600'],
                [FileText,   'Pending',      dash.stats.pendingApps,       'bg-amber-50  text-amber-600'],
              ].map(([Icon, label, val, cls]) => (
                <div key={label} className={`rounded-2xl p-4 ${cls.split(' ')[0]}`}>
                  <Icon className={`w-5 h-5 mb-2 ${cls.split(' ')[1]}`} />
                  <p className={`text-xl font-extrabold ${cls.split(' ')[1]}`}>{val}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent apps */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-primary mb-4">Recent Applications</h3>
                <div className="space-y-2">
                  {dash.recentApps?.map(app => (
                    <div key={app._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0">{app.visaId?.flag || '🌍'}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">{app.applicantName || app.userId?.name}</p>
                          <p className="text-xs text-gray-400">{app.visaId?.country}</p>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Top visas */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Top Applied Visas</h3>
                <div className="space-y-2">
                  {dash.topVisas?.map((v, i) => (
                    <div key={v._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold text-gray-300 w-5">#{i+1}</span>
                      <span className="text-xl">{v.flag}</span>
                      <span className="font-semibold text-sm flex-1">{v.country}</span>
                      <span className="badge bg-primary text-white">{v.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            APPLICATIONS
        ══════════════════════════════════════════════════════ */}
        {tab === 'Applications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filters */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <h2 className="font-bold text-primary mr-auto">Applications ({filteredApps.length})</h2>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input placeholder="Search…" value={appSearch} onChange={e => setAppSearch(e.target.value)}
                    className="input-field text-sm pl-9 w-48" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="input-field text-sm w-44">
                  <option value="">All Status</option>
                  {APP_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            </div>
            {filteredApps.length === 0
              ? <EmptyState icon="📋" title="No applications found" subtitle="Try changing the filter" />
              : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[950px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-gray-400 uppercase">
                      {['ID','Applicant','Country','Plan','Amount','Agent','Status','Payment','Update Status','Edit'].map(h =>
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredApps.map(app => (
                      <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">#{app.applicationId?.slice(-8)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs">{app.applicantName}</p>
                          <p className="text-xs text-gray-400">{app.applicantEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{app.visaId?.flag} {app.visaId?.country}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{app.planLabel}</td>
                        <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">₹{app.pricePaid?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{app.agentId?.name || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                        <td className="px-4 py-3"><StatusBadge status={app.paymentStatus} /></td>
                        <td className="px-4 py-3">
                          <select value={app.status}
                            onChange={e => updateStatus(app._id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                            {APP_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setEditApp(app); setEditForm({ status: app.status, adminNotes: app.adminNotes || '', notes: app.notes || '', note: '' }); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-primary transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
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
            AGENTS
        ══════════════════════════════════════════════════════ */}
        {tab === 'Agents' && (
          <div className="space-y-5">
            {/* Wallet credit form */}
            <div className="bg-white rounded-2xl shadow-sm border border-l-4 border-l-emerald-500 p-5">
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-emerald-500" /> Credit Agent Wallet
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select value={creditForm.agentId} onChange={e => setCreditForm({...creditForm, agentId: e.target.value})}
                  className="input-field text-sm">
                  <option value="">Select Agent</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.agentCode}) — ₹{a.walletBalance?.toLocaleString('en-IN')}</option>)}
                </select>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input type="number" min="1" placeholder="Amount" value={creditForm.amount}
                    onChange={e => setCreditForm({...creditForm, amount: e.target.value})}
                    className="input-field pl-7 text-sm" />
                </div>
                <input placeholder="Description (optional)" value={creditForm.description}
                  onChange={e => setCreditForm({...creditForm, description: e.target.value})}
                  className="input-field text-sm" />
                <button onClick={creditWallet} disabled={crediting}
                  className="btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {crediting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                  Credit Wallet
                </button>
              </div>
            </div>

            {/* Agents table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-bold text-primary">Agents ({agents.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-400 uppercase text-left">
                      {['Name','Code','Company','Wallet','Spent','Commission','Status','Actions'].map(h =>
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {agents.map(a => (
                      <tr key={a._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.email}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-primary text-xs">{a.agentCode}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{a.companyName || '—'}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">₹{a.walletBalance?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">₹{a.totalSpent?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-4 py-3 font-semibold">{a.commissionRate || 10}%</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${a.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {a.isApproved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleAgent(a._id, a.isApproved)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                ${a.isApproved ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                              {a.isApproved ? 'Suspend' : 'Approve'}
                            </button>
                            <button onClick={() => { setEditAgent(a); setAgentForm({ commissionRate: a.commissionRate || 10, isApproved: a.isApproved }); }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-primary transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            VISAS
        ══════════════════════════════════════════════════════ */}
        {tab === 'Visas' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-primary">Visa Management ({visas.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-400 uppercase text-left">
                    {['Country','Region','Plans — Base / Agent / Public','Processing','Status','Action'].map(h =>
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visas.map(v => (
                    <tr key={v._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{v.flag} {v.country}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{v.region}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                        {v.plans?.map(p => p.isContactUs
                          ? `${p.label}: Contact Us`
                          : `${p.label}: ₹${p.basePrice}/₹${p.agentPrice}/₹${p.publicPrice}`
                        ).join(' · ')}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{v.processingTime}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${v.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => {
                          setEditVisa(v);
                          setVisaForm({
                            plans: v.plans?.map(p => ({
                              label: p.label,
                              basePrice: p.basePrice || 0,
                              agentPrice: p.agentPrice || 0,
                              publicPrice: p.publicPrice || 0,
                              isContactUs: p.isContactUs || false
                            })) || []
                          });
                        }}
                          className="text-xs btn-outline px-3 py-1">
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            USERS
        ══════════════════════════════════════════════════════ */}
        {tab === 'Users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-primary">Users ({users.length})</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-400 uppercase text-left">
                    {['Name','Email','Role','Phone','Joined','Status','Action'].map(h =>
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-xs">{u.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role==='admin' ? 'bg-purple-100 text-purple-700' : u.role==='agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{u.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {u.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <button onClick={() => toggleUser(u._id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                              ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                            {u.isActive ? 'Block' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TRANSACTIONS
        ══════════════════════════════════════════════════════ */}
        {tab === 'Transactions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-primary">Wallet Transactions ({txns.length})</h2></div>
            {txns.length === 0 ? <EmptyState icon="💳" title="No transactions yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-400 uppercase text-left">
                      {['Date','Agent','Type','Category','Amount','Before','After','Description'].map(h =>
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {txns.map(t => (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs">{t.agentId?.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{t.agentId?.agentCode}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold text-xs ${t.type==='credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">{t.category.replace(/_/g,' ')}</td>
                        <td className={`px-4 py-3 font-bold whitespace-nowrap ${t.type==='credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {t.type==='credit' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">₹{t.balanceBefore?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs font-bold text-primary">₹{t.balanceAfter?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SETTINGS
        ══════════════════════════════════════════════════════ */}
        {tab === 'Settings' && settings && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-primary mb-6 flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Service Fee Settings
            </h2>
            <div className="max-w-md space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Service Fee (₹)</label>
                <input type="number" min="0" value={settings.serviceFee || 0}
                  onChange={e => setSettings({...settings, serviceFee: Number(e.target.value)})}
                  className="input-field" placeholder="599" />
                <p className="text-xs text-gray-500 mt-1">Added to every visa application</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Service Fee Label</label>
                <input value={settings.serviceFeeLabel || ''}
                  onChange={e => setSettings({...settings, serviceFeeLabel: e.target.value})}
                  className="input-field" placeholder="Processing Fee" />
                <p className="text-xs text-gray-500 mt-1">Display name for the fee</p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input type="checkbox" id="feeEnabled" checked={settings.serviceFeeEnabled || false}
                  onChange={e => setSettings({...settings, serviceFeeEnabled: e.target.checked})}
                  className="w-4 h-4 accent-primary" />
                <label htmlFor="feeEnabled" className="text-sm font-semibold text-gray-700">Enable Service Fee</label>
              </div>
              <button onClick={() => saveSettings(settings)} disabled={saving}
                className="btn-primary w-full justify-center disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Edit Application Modal ─────────────────────────── */}
      <Modal open={!!editApp} onClose={() => setEditApp(null)} title={`Edit Application — #${editApp?.applicationId?.slice(-8)}`} size="lg">
        {editApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
              <div><p className="text-gray-400 text-xs mb-1">Applicant</p><p className="font-semibold">{editApp.applicantName}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Country</p><p className="font-semibold">{editApp.visaId?.flag} {editApp.visaId?.country}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Email</p><p className="font-semibold">{editApp.applicantEmail}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Phone</p><p className="font-semibold">{editApp.applicantPhone}</p></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
              <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="input-field">
                {APP_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Status Note</label>
              <input value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})}
                placeholder="e.g. Documents verified, processing started…" className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Admin Notes (internal)</label>
              <textarea rows={3} value={editForm.adminNotes} onChange={e => setEditForm({...editForm, adminNotes: e.target.value})}
                placeholder="Internal notes — not visible to applicant" className="input-field text-sm resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveEditApp} disabled={saving}
                className="btn-primary flex-1 justify-center disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditApp(null)} className="btn-outline flex-1 justify-center">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Agent Modal ───────────────────────────────── */}
      <Modal open={!!editAgent} onClose={() => setEditAgent(null)} title={`Edit Agent — ${editAgent?.name}`}>
        {editAgent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
              <div><p className="text-gray-400 text-xs mb-1">Agent Code</p><p className="font-mono font-bold text-primary">{editAgent.agentCode}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Wallet Balance</p><p className="font-bold text-emerald-600">₹{editAgent.walletBalance?.toLocaleString('en-IN') || 0}</p></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Commission Rate (%)</label>
              <input type="number" min="0" max="100" value={agentForm.commissionRate}
                onChange={e => setAgentForm({...agentForm, commissionRate: e.target.value})}
                className="input-field text-sm" />
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input type="checkbox" id="agentApproved" checked={agentForm.isApproved}
                onChange={e => setAgentForm({...agentForm, isApproved: e.target.checked})}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="agentApproved" className="text-sm font-semibold text-gray-700">Agent Approved</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveEditAgent} disabled={saving}
                className="btn-primary flex-1 justify-center disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditAgent(null)} className="btn-outline flex-1 justify-center">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Visa Modal ────────────────────────────────── */}
      <Modal open={!!editVisa} onClose={() => setEditVisa(null)} title={`Edit Visa Prices — ${editVisa?.flag} ${editVisa?.country}`} size="lg">
        {editVisa && (
          <div className="space-y-6">
            <div className="text-sm bg-gray-50 rounded-xl p-4">
              <p className="text-gray-600">Update pricing for each plan. Changes apply immediately to new applications.</p>
            </div>
            <div className="space-y-4">
              {visaForm.plans?.map((plan, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-primary">{plan.label}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Base Price (₹)</label>
                      <input type="number" min="0" value={plan.basePrice}
                        onChange={e => {
                          const newPlans = [...visaForm.plans];
                          newPlans[index].basePrice = Number(e.target.value);
                          setVisaForm({...visaForm, plans: newPlans});
                        }}
                        className="input-field text-sm" />
                      <p className="text-xs text-gray-500 mt-1">Internal cost</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Agent Price (₹)</label>
                      <input type="number" min="0" value={plan.agentPrice}
                        onChange={e => {
                          const newPlans = [...visaForm.plans];
                          newPlans[index].agentPrice = Number(e.target.value);
                          setVisaForm({...visaForm, plans: newPlans});
                        }}
                        className="input-field text-sm" />
                      <p className="text-xs text-gray-500 mt-1">Agent pays this</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Public Price (₹)</label>
                      <input type="number" min="0" value={plan.publicPrice}
                        onChange={e => {
                          const newPlans = [...visaForm.plans];
                          newPlans[index].publicPrice = Number(e.target.value);
                          setVisaForm({...visaForm, plans: newPlans});
                        }}
                        className="input-field text-sm" />
                      <p className="text-xs text-gray-500 mt-1">Customer pays this</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveEditVisa} disabled={saving}
                className="btn-primary flex-1 justify-center disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Update Prices'}
              </button>
              <button onClick={() => setEditVisa(null)} className="btn-outline flex-1 justify-center">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
