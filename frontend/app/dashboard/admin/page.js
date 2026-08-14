'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, FileText, Globe, DollarSign, TrendingUp, ArrowUpCircle,
  RefreshCw, CheckCircle, XCircle, MessageCircle, Edit2, Save, X,
  Loader2, BarChart2, Search, Filter, ExternalLink, ShieldCheck, File,
  UserPlus, Download, Upload, PlaneTakeoff, FilePlus2,
} from 'lucide-react';
import { adminAPI, agentAPI, appAPI, visaAPI, uploadsOrigin } from '../../../lib/api';
import { getUser } from '../../../lib/auth';
import StatusBadge from '../../../components/ui/StatusBadge';
import Loading from '../../../components/ui/Loading';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import CountrySelect from '../../../components/common/CountrySelect';
import toast from 'react-hot-toast';

const TABS = ['Dashboard','Applications','Agents','Visas','Users','Transactions','Settings'];
const APP_STATUSES = ['pending','documents_received','in_review','processing','sent_to_immigration','approved','rejected','delivered'];
const DOC_TYPE_LABELS = {
  frontPassport: 'Front Passport',
  backPassport:  'Back Passport',
  digitalPhoto:  'Digital Photo',
  visaDocument:  'Visa Document',
  optional1: 'Additional Doc 1',
  optional2: 'Additional Doc 2',
  optional3: 'Additional Doc 3',
  optional4: 'Additional Doc 4',
};

export default function AdminDashboard() {
  const router = useRouter();
  const user   = getUser();

  const [tab,      setTab]       = useState('Dashboard');
  const [dash,     setDash]      = useState(null);
  const [apps,     setApps]      = useState([]);
  const [agents,   setAgents]    = useState([]);
  const [visas,    setVisas]     = useState([]);
  const [users,    setUsers]     = useState([]);
  const [userType, setUserType]  = useState('all'); // 'all' | 'b2c' | 'b2b'
  const [txns,     setTxns]      = useState([]);
  const [settings, setSettings]  = useState(null);
  const [loading,  setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,    setError]     = useState('');
  const [topUpRequests, setTopUpRequests] = useState([]);
  const [reviewingReq, setReviewingReq]   = useState(null);

  /* Filters */
  const [statusFilter, setStatusFilter] = useState('');
  const [appSearch,    setAppSearch]    = useState('');
  const [agentSearch,  setAgentSearch]  = useState('');
  const [userSearch,   setUserSearch]   = useState('');

  /* Add agent form */
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [addAgentForm, setAddAgentForm] = useState({ name:'', email:'', password:'', phone:'', companyName:'', city:'', commissionRate: 10 });
  const [addingAgent,  setAddingAgent]  = useState(false);

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
      const [d, a, ag, v, u, t, s, wr] = await Promise.all([
        adminAPI.getDashboard(),
        appAPI.getAll({ limit: 100 }),
        agentAPI.getList(),
        visaAPI.getAll({ active: 'false' }),
        adminAPI.getUsers({ limit: 100 }),
        adminAPI.getTransactions({ limit: 50 }),
        adminAPI.getSettings(),
        agentAPI.getTopUpRequests({ status: 'pending' }),
      ]);
      setDash(d.data);
      setApps(a.data.data     || []);
      setAgents(ag.data.data  || []);
      setVisas(v.data.data    || []);
      setUsers(u.data.data    || []);
      setTxns(t.data.data     || []);
      setSettings(s.data.data || null);
      setTopUpRequests(wr.data.data || []);
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

  /* ── Approve / reject wallet top-up request ─────────────── */
  const approveTopUp = useCallback(async (id) => {
    setReviewingReq(id);
    try {
      const r = await agentAPI.approveTopUpRequest(id);
      toast.success(r.data.message);
      setTopUpRequests(prev => prev.filter(req => req._id !== id));
      setAgents(prev => prev.map(a => a._id === r.data.request.agentId ? { ...a, walletBalance: r.data.walletBalance } : a));
      const t = await adminAPI.getTransactions({ limit: 50 }); setTxns(t.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
    finally { setReviewingReq(null); }
  }, []);

  const rejectTopUp = useCallback(async (id) => {
    setReviewingReq(id);
    try {
      await agentAPI.rejectTopUpRequest(id);
      toast.success('Request rejected');
      setTopUpRequests(prev => prev.filter(req => req._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject'); }
    finally { setReviewingReq(null); }
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

  /* ── Upload the final visa document (marks delivered) ──── */
  const [uploadingVisaDoc, setUploadingVisaDoc] = useState(false);
  const uploadVisaDocument = useCallback(async (file) => {
    if (!file || !editApp) return;
    setUploadingVisaDoc(true);
    try {
      const fd = new FormData();
      fd.append('visaDocument', file);
      const r = await appAPI.uploadVisaDocument(editApp._id, fd);
      toast.success(r.data.message);
      setApps(prev => prev.map(a => a._id === editApp._id ? r.data.data : a));
      setEditApp(r.data.data);
      setEditForm(f => ({ ...f, status: 'delivered' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploadingVisaDoc(false); }
  }, [editApp]);

  /* ── Request additional documents from applicant ────────── */
  const [docsRequestForm, setDocsRequestForm] = useState({ items: '', note: '' });
  const [requestingDocs, setRequestingDocs] = useState(false);
  const requestDocuments = useCallback(async () => {
    const items = docsRequestForm.items.split(',').map(s => s.trim()).filter(Boolean);
    if (!items.length) { toast.error('Enter at least one document, comma-separated'); return; }
    setRequestingDocs(true);
    try {
      const r = await appAPI.requestDocuments(editApp._id, { items, note: docsRequestForm.note });
      toast.success(r.data.message);
      setApps(prev => prev.map(a => a._id === editApp._id ? r.data.data : a));
      setEditApp(r.data.data);
      setDocsRequestForm({ items: '', note: '' });
      window.open(r.data.whatsappLink, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally { setRequestingDocs(false); }
  }, [editApp, docsRequestForm]);

  /* ── Save agent edits ──────────────────────────────────── */
  const saveEditAgent = useCallback(async () => {
    setSaving(true);
    try {
      const r = await agentAPI.update(editAgent._id, {
        isApproved: agentForm.isApproved,
        commissionRate: Number(agentForm.commissionRate),
      });
      setAgents(prev => prev.map(a => a._id === editAgent._id ? r.data.data : a));
      toast.success('Agent updated successfully');
      setEditAgent(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    finally { setSaving(false); }
  }, [editAgent, agentForm]);

  /* ── Create agent directly ─────────────────────────────── */
  const createAgent = useCallback(async () => {
    if (!addAgentForm.name || !addAgentForm.email || !addAgentForm.password) {
      toast.error('Name, email and password are required'); return;
    }
    if (addAgentForm.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setAddingAgent(true);
    try {
      const r = await agentAPI.create(addAgentForm);
      setAgents(prev => [r.data.data, ...prev]);
      toast.success(r.data.message || 'Agent created successfully');
      setShowAddAgent(false);
      setAddAgentForm({ name:'', email:'', password:'', phone:'', companyName:'', city:'', commissionRate: 10 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create agent');
    } finally { setAddingAgent(false); }
  }, [addAgentForm]);

  /* ── CSV export helper ─────────────────────────────────── */
  const exportCSV = useCallback((rows, filename) => {
    if (!rows.length) { toast.error('Nothing to export'); return; }
    const headers = Object.keys(rows[0]);
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportTransactionsCSV = useCallback(() => {
    exportCSV(txns.map(t => ({
      Date: new Date(t.createdAt).toLocaleDateString('en-IN'), Agent: t.agentId?.name || '',
      AgentCode: t.agentId?.agentCode || '', Type: t.type, Category: t.category,
      Amount: t.amount, BalanceBefore: t.balanceBefore, BalanceAfter: t.balanceAfter,
      Description: t.description,
    })), `transactions_${Date.now()}.csv`);
  }, [exportCSV, txns]);

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
  const [bumpPercent, setBumpPercent] = useState('');

  /* Embassy raised its fee? Bump base price by % and recalc agent/public tiers. */
  const applyPriceBump = useCallback(() => {
    const pct = Number(bumpPercent);
    if (!pct) { toast.error('Enter a percentage to increase by'); return; }
    setVisaForm(prev => ({
      ...prev,
      plans: prev.plans.map(p => {
        if (p.isContactUs) return p;
        const newBase = Math.round(p.basePrice * (1 + pct / 100));
        return {
          ...p,
          basePrice: newBase,
          agentPrice: Math.ceil(newBase * 1.08 / 100) * 100,
          publicPrice: Math.ceil(newBase * 1.20 / 100) * 100,
        };
      }),
    }));
    toast.success(`Base price bumped ${pct}% — agent & public prices recalculated`);
    setBumpPercent('');
  }, [bumpPercent]);
  const [showAddVisa, setShowAddVisa] = useState(false);
  const [newVisaForm, setNewVisaForm] = useState({
    country: '',
    countryRef: '',
    slug: '',
    flag: '',
    region: 'middle-east',
    processingTime: '5-7 business days',
    visaType: 'E-Visa',
    plans: []
  });
  const [addingVisa, setAddingVisa] = useState(false);
  const [deletingVisa, setDeletingVisa] = useState(null);
  const [togglingVisa, setTogglingVisa] = useState(null);

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

  const addNewVisa = useCallback(async () => {
    if (!newVisaForm.country || !newVisaForm.slug || !newVisaForm.region) {
      toast.error('Country, slug, and region are required');
      return;
    }
    if (newVisaForm.plans.some(p => !p.label.trim())) {
      toast.error('Every plan needs a label (e.g. "30 Days")');
      return;
    }
    setAddingVisa(true);
    try {
      const r = await visaAPI.create(newVisaForm);
      setVisas(prev => [...prev, r.data.data]);
      toast.success('Visa added successfully');
      setShowAddVisa(false);
      setNewVisaForm({
        country: '', countryRef: '', slug: '', flag: '', region: 'middle-east',
        processingTime: '5-7 business days', visaType: 'E-Visa', plans: []
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add visa');
    }
    finally { setAddingVisa(false); }
  }, [newVisaForm]);

  const deleteVisa = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this visa? This cannot be undone.')) return;
    setDeletingVisa(id);
    try {
      await visaAPI.delete(id);
      setVisas(prev => prev.filter(v => v._id !== id));
      toast.success('Visa deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete visa');
    }
    finally { setDeletingVisa(null); }
  }, []);

  const toggleVisaStatus = useCallback(async (id) => {
    setTogglingVisa(id);
    try {
      const r = await visaAPI.toggleStatus(id);
      setVisas(prev => prev.map(v => v._id === id ? r.data.data : v));
      toast.success(`Visa ${r.data.data.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
    finally { setTogglingVisa(null); }
  }, []);

  /* ── Filtered apps ─────────────────────────────────────── */
  const filteredApps = apps.filter(a => {
    const ms = !statusFilter || a.status === statusFilter;
    const mq = !appSearch || [a.applicantName, a.applicationId, a.visaId?.country, a.applicantPhone]
      .some(f => f?.toLowerCase().includes(appSearch.toLowerCase()));
    return ms && mq;
  });

  const exportApplicationsCSV = () => {
    exportCSV(filteredApps.map(a => ({
      ApplicationID: a.applicationId, Applicant: a.applicantName, Email: a.applicantEmail,
      Phone: a.applicantPhone, Country: a.visaId?.country, Plan: a.planLabel,
      Amount: a.pricePaid, Agent: a.agentId?.name || '', Status: a.status, PaymentStatus: a.paymentStatus,
      Date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '',
    })), `applications_${Date.now()}.csv`);
  };

  /* ── Filtered agents & users ────────────────────────────── */
  const filteredAgents = agents.filter(a => !agentSearch ||
    [a.name, a.email, a.agentCode, a.companyName].some(f => f?.toLowerCase().includes(agentSearch.toLowerCase())));

  const filteredUsers = users
    .filter(u => userType === 'all' ? true : userType === 'b2b' ? u.role === 'agent' : u.role !== 'agent')
    .filter(u => !userSearch || [u.name, u.email, u.phone].some(f => f?.toLowerCase().includes(userSearch.toLowerCase())));

  if (loading) return <div className="pt-20"><Loading text="Loading admin panel…" /></div>;

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-[#0a1f35] via-[#0d2d45] to-[#f8f9fa]">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#FF7A00] rounded-full blur-3xl opacity-5"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
                Admin Panel
              </h1>
              <p className="text-white/80 text-lg">Visayatri Platform Control Center · <span className="font-bold text-[#FF7A00]">{user?.name}</span></p>
            </div>
            <button onClick={() => loadAll(true)} disabled={refreshing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold bg-white/10 border border-white/20 hover:border-[#FF7A00]/50 hover:bg-white/20 transition-all backdrop-blur disabled:opacity-60">
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && <div className="mb-5"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                tab===t 
                  ? 'bg-gradient-to-r from-[#FF7A00] to-orange-500 text-white shadow-lg' 
                  : 'bg-white/10 text-white/70 border border-white/20 backdrop-blur hover:border-[#FF7A00]/50 hover:text-[#FF7A00]'
              }`}>
              {t}
              {t === 'Agents' && (agents.filter(a => !a.isApproved).length + topUpRequests.length) > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {agents.filter(a => !a.isApproved).length + topUpRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            DASHBOARD
        ══════════════════════════════════════════════════════ */}
        {tab === 'Dashboard' && dash && (
          <div className="space-y-8">
            {/* Stat Cards - Glassmorphic — click to jump to the relevant tab */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                [Users,      'Users',            dash.stats.totalUsers,                  'text-blue-400', 'from-blue-500/20 to-blue-500/5', () => { setUserType('b2c'); setTab('Users'); }],
                [Users,      'Agents',           dash.stats.totalAgents,                 'text-purple-400', 'from-purple-500/20 to-purple-500/5', () => setTab('Agents')],
                [FileText,   'Applications',     dash.stats.totalApplications,           'text-orange-400', 'from-orange-500/20 to-orange-500/5', () => { setStatusFilter(''); setTab('Applications'); }],
                [Globe,      'Visas',            dash.stats.totalVisas,                  'text-cyan-400', 'from-cyan-500/20 to-cyan-500/5', () => setTab('Visas')],
                [DollarSign, 'Revenue',          `₹${(dash.stats.revenue||0).toLocaleString('en-IN')}`, 'text-emerald-400', 'from-emerald-500/20 to-emerald-500/5', () => setTab('Transactions')],
                [FileText,   'Pending',          dash.stats.pendingApps,                 'text-amber-400', 'from-amber-500/20 to-amber-500/5', () => { setStatusFilter('pending'); setTab('Applications'); }],
              ].map(([Icon, label, val, iconColor, bgGradient, onClick]) => (
                <button key={label} onClick={onClick} type="button"
                  className={`text-left rounded-2xl p-5 bg-gradient-to-br ${bgGradient} border border-white/10 backdrop-blur-sm hover:border-[#FF7A00]/50 hover:-translate-y-0.5 transition-all cursor-pointer`}>
                  <Icon className={`w-6 h-6 mb-2 ${iconColor}`} />
                  <p className="text-2xl sm:text-3xl font-black text-white">{val}</p>
                  <p className="text-xs text-white/60 font-semibold mt-1 uppercase tracking-wide">{label}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Applications */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                  <h3 className="font-black text-white text-xl flex items-center gap-3">
                    <FileText className="w-6 h-6 text-[#FF7A00]" />
                    Recent Applications
                  </h3>
                </div>
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {dash.recentApps?.map(app => (
                    <button key={app._id} type="button" onClick={() => { setEditApp(app); setEditForm({ status: app.status, adminNotes: app.adminNotes || '', notes: app.notes || '', note: '' }); }}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-3xl flex-shrink-0 p-3 bg-white/10 rounded-2xl">{app.visaId?.flag || '🌍'}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{app.applicantName || app.userId?.name}</p>
                          <p className="text-xs text-white/60 truncate">{app.visaId?.country}</p>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Visas */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                  <h3 className="font-black text-white text-xl flex items-center gap-3">
                    <BarChart2 className="w-6 h-6 text-[#FF7A00]" />
                    Top Applied Visas
                  </h3>
                </div>
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {dash.topVisas?.map((v, i) => (
                    <button key={v._id} type="button" onClick={() => setTab('Visas')}
                      className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-colors text-left">
                      <span className="text-sm font-black text-white/40 w-6 text-center">#{i+1}</span>
                      <div className="text-3xl flex-shrink-0 p-3 bg-white/10 rounded-2xl">{v.flag}</div>
                      <span className="font-bold text-white text-sm flex-1">{v.country}</span>
                      <span className="px-3 py-1 rounded-full bg-[#FF7A00]/20 text-[#FF7A00] font-bold text-sm">{v.count}</span>
                    </button>
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
                <button onClick={exportApplicationsCSV}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>
            {filteredApps.length === 0
              ? <EmptyState icon="📋" title="No applications found" subtitle="Try changing the filter" />
              : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[950px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-gray-400 uppercase">
                      {['ID','Applicant','Country','Plan','Amount','Agent','Status','Payment','Docs','Update Status','Edit'].map(h =>
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
                          <button onClick={() => { setEditApp(app); setEditForm({ status: app.status, adminNotes: app.adminNotes || '', notes: app.notes || '', note: '' }); }}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-colors ${
                              (app.documents?.length || 0) > 0 ? 'bg-blue-50 text-primary hover:bg-blue-100' : 'bg-gray-50 text-gray-400'
                            }`}>
                            <FileText className="w-3 h-3" /> {app.documents?.length || 0}
                          </button>
                        </td>
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
            {/* Pending wallet top-up requests */}
            {topUpRequests.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-l-4 border-l-amber-500 p-5">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-amber-500" /> Pending Top-Up Requests ({topUpRequests.length})
                </h3>
                <div className="space-y-2">
                  {topUpRequests.map(r => (
                    <div key={r._id} className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 rounded-xl px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">{r.agentId?.name} <span className="text-gray-400 font-mono text-xs">({r.agentId?.agentCode})</span></p>
                        <p className="text-xs text-gray-500">Requested ₹{r.amount?.toLocaleString('en-IN')} · Current balance ₹{r.agentId?.walletBalance?.toLocaleString('en-IN') || 0} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => approveTopUp(r._id)} disabled={reviewingReq === r._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-60">
                          {reviewingReq === r._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve & Credit'}
                        </button>
                        <button onClick={() => rejectTopUp(r._id)} disabled={reviewingReq === r._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-60">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <h2 className="font-bold text-primary mr-auto">Agents ({filteredAgents.length})</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input placeholder="Search name, email, code…" value={agentSearch} onChange={e => setAgentSearch(e.target.value)}
                    className="input-field text-sm pl-9 w-56" />
                </div>
                <button onClick={() => setShowAddAgent(true)}
                  className="btn-primary text-sm flex items-center gap-2 px-3 py-1.5">
                  <UserPlus className="w-4 h-4" /> Add Agent
                </button>
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
                    {filteredAgents.length === 0 && (
                      <tr><td colSpan={8}><EmptyState icon="🧑‍💼" title="No agents found" subtitle="Try changing the search" /></td></tr>
                    )}
                    {filteredAgents.map(a => (
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
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-primary">Visa Management ({visas.length})</h2>
              <button onClick={() => setShowAddVisa(true)}
                className="btn-primary text-sm flex items-center gap-2 px-3 py-1.5">
                <Globe className="w-4 h-4" />
                Add New Visa
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-400 uppercase text-left">
                    {['Country','Region','Plans','Processing','Status','Actions'].map(h =>
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visas.map(v => (
                    <tr key={v._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{v.flag} {v.country}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{v.region}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                        {v.plans?.length > 0 ? v.plans.map(p => p.isContactUs
                          ? `${p.label}: Contact Us`
                          : `${p.label}: ₹${p.basePrice}/₹${p.agentPrice}/₹${p.publicPrice}`
                        ).join(' • ') : 'No plans'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{v.processingTime}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleVisaStatus(v._id)} disabled={togglingVisa === v._id}
                          className={`badge cursor-pointer transition-all ${v.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {togglingVisa === v._id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : (v.isActive ? 'Active' : 'Inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
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
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit pricing">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteVisa(v._id)} disabled={deletingVisa === v._id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete visa">
                            {deletingVisa === v._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </div>
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
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-primary mr-auto">Users ({filteredUsers.length})</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input placeholder="Search name, email, phone…" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  className="input-field text-sm pl-9 w-56" />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  ['all', 'All'],
                  ['b2c', 'B2C — Individual'],
                  ['b2b', 'B2B — Agents'],
                ].map(([val, label]) => (
                  <button key={val} onClick={() => setUserType(val)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      userType === val ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-400 uppercase text-left">
                    {['Name','Email','Role','Phone','Joined','Status','Action'].map(h =>
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={7}><EmptyState icon="👥" title="No users found" subtitle="Try changing the search or filter" /></td></tr>
                  )}
                  {filteredUsers.map(u => (
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
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-primary">Wallet Transactions ({txns.length})</h2>
              <button onClick={exportTransactionsCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
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
              <label className="text-xs font-semibold text-gray-600 mb-2 block">
                Uploaded Documents ({editApp.documents?.length || 0})
              </label>
              {!editApp.documents?.length ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-4 text-center">No documents uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {editApp.documents.map((doc, i) => {
                    const url = `${uploadsOrigin}/${doc.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/')}`;
                    const isImage = doc.mimetype?.startsWith('image/');
                    return (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="group relative rounded-xl border border-gray-200 overflow-hidden hover:border-primary hover:shadow-md transition-all">
                        {isImage ? (
                          <img src={url} alt={doc.docType} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-gray-50 flex items-center justify-center">
                            <File className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <div className="p-2 bg-white">
                          <p className="text-xs font-bold text-gray-700 truncate">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</p>
                          {doc.docType === 'digitalPhoto' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-0.5">
                              <ShieldCheck className="w-3 h-3" /> Face verified
                            </span>
                          )}
                        </div>
                        <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3 h-3 text-white" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Requested documents history */}
            {editApp.docsRequested?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">Documents Requested</p>
                <div className="space-y-2">
                  {editApp.docsRequested.map((r, i) => (
                    <div key={i} className="text-xs text-amber-900">
                      <span className="font-semibold">{r.items.join(', ')}</span>
                      {r.note && <span className="text-amber-700"> — {r.note}</span>}
                      <span className="text-amber-500"> · {new Date(r.requestedAt).toLocaleDateString('en-IN')}</span>
                      {r.fulfilled && <span className="ml-2 text-emerald-600 font-bold">✓ Fulfilled</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request more documents */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-2">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5"><FilePlus2 className="w-3.5 h-3.5" /> Request More Documents</label>
              <input value={docsRequestForm.items} onChange={e => setDocsRequestForm({...docsRequestForm, items: e.target.value})}
                placeholder="Comma-separated, e.g. Bank statement, Hotel booking" className="input-field text-sm" />
              <input value={docsRequestForm.note} onChange={e => setDocsRequestForm({...docsRequestForm, note: e.target.value})}
                placeholder="Note (optional)" className="input-field text-sm" />
              <button onClick={requestDocuments} disabled={requestingDocs}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {requestingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                {requestingDocs ? 'Sending…' : 'Request via Email + WhatsApp'}
              </button>
            </div>

            {/* Upload final visa document */}
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-2">
              <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <PlaneTakeoff className="w-3.5 h-3.5" /> Upload Approved Visa & Dispatch
              </label>
              <p className="text-xs text-emerald-700">Uploading marks this application "delivered" and notifies the applicant by email + WhatsApp.</p>
              <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-dashed border-emerald-300 bg-white text-emerald-700 font-bold text-sm cursor-pointer hover:bg-emerald-50 transition-colors">
                {uploadingVisaDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingVisaDoc ? 'Uploading…' : 'Choose Visa File (PDF/JPG/PNG)'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploadingVisaDoc}
                  onChange={e => uploadVisaDocument(e.target.files?.[0])} />
              </label>
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

      {/* ── Add Agent Modal ────────────────────────────────── */}
      <Modal open={showAddAgent} onClose={() => setShowAddAgent(false)} title="Add New Agent">
        <div className="space-y-4">
          <div className="text-sm bg-gray-50 rounded-xl p-4">
            <p className="text-gray-600">Creates an agent account that's approved immediately — no self-registration wait.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name *</label>
            <input value={addAgentForm.name} onChange={e => setAddAgentForm({...addAgentForm, name: e.target.value})}
              placeholder="Agent's full name" className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
            <input type="email" value={addAgentForm.email} onChange={e => setAddAgentForm({...addAgentForm, email: e.target.value})}
              placeholder="agent@example.com" className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Password * (min 6 characters)</label>
            <input type="text" value={addAgentForm.password} onChange={e => setAddAgentForm({...addAgentForm, password: e.target.value})}
              placeholder="Temporary password" className="input-field text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone</label>
              <input value={addAgentForm.phone} onChange={e => setAddAgentForm({...addAgentForm, phone: e.target.value})}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Commission Rate (%)</label>
              <input type="number" min="0" max="100" value={addAgentForm.commissionRate}
                onChange={e => setAddAgentForm({...addAgentForm, commissionRate: e.target.value})}
                className="input-field text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Company Name</label>
              <input value={addAgentForm.companyName} onChange={e => setAddAgentForm({...addAgentForm, companyName: e.target.value})}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">City</label>
              <input value={addAgentForm.city} onChange={e => setAddAgentForm({...addAgentForm, city: e.target.value})}
                className="input-field text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={createAgent} disabled={addingAgent}
              className="btn-primary flex-1 justify-center disabled:opacity-60">
              {addingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {addingAgent ? 'Creating…' : 'Create Agent'}
            </button>
            <button onClick={() => setShowAddAgent(false)} className="btn-outline flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Visa Modal ────────────────────────────────── */}
      <Modal open={!!editVisa} onClose={() => setEditVisa(null)} title={`Edit Visa Prices — ${editVisa?.flag} ${editVisa?.country}`} size="lg">
        {editVisa && (
          <div className="space-y-6">
            <div className="text-sm bg-gray-50 rounded-xl p-4">
              <p className="text-gray-600">Update pricing for each plan. Changes apply immediately to new applications.</p>
            </div>

            {/* Embassy fee hike — bulk bump */}
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">Embassy Increased Its Fee?</p>
              <p className="text-xs text-amber-700 mb-3">Bump base price by a % across all plans — agent price (+8%) and public price (+20%) recalculate automatically. Review below before saving.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="number" step="0.5" value={bumpPercent} onChange={e => setBumpPercent(e.target.value)}
                    placeholder="e.g. 10 for +10%" className="input-field text-sm pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                </div>
                <button type="button" onClick={applyPriceBump}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors whitespace-nowrap">
                  Apply to All Plans
                </button>
              </div>
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

      {/* ── Add Visa Modal ────────────────────────────────────── */}
      <Modal open={showAddVisa} onClose={() => setShowAddVisa(false)} title="Add New Visa" size="lg">
        <div className="space-y-6">
          <div className="text-sm bg-gray-50 rounded-xl p-4">
            <p className="text-gray-600">Fill in the visa details and add at least one pricing plan below.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Country Name *</label>
              <CountrySelect value={newVisaForm.country} placeholder="Select country"
                onChange={(name, country) => setNewVisaForm({
                  ...newVisaForm,
                  country: name,
                  countryRef: country?._id || '',
                  flag: newVisaForm.flag || country?.flag || '',
                })}
                className="input-field text-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Country Slug *</label>
              <input placeholder="e.g., united-states (lowercase, no spaces)" value={newVisaForm.slug}
                onChange={e => setNewVisaForm({...newVisaForm, slug: e.target.value.toLowerCase()})}
                className="input-field text-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Flag Emoji</label>
              <input placeholder="e.g., 🇺🇸" value={newVisaForm.flag}
                onChange={e => setNewVisaForm({...newVisaForm, flag: e.target.value})}
                className="input-field text-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Region *</label>
              <select value={newVisaForm.region}
                onChange={e => setNewVisaForm({...newVisaForm, region: e.target.value})}
                className="input-field text-sm">
                <option value="middle-east">Middle East</option>
                <option value="asia">Asia</option>
                <option value="africa">Africa</option>
                <option value="europe">Europe</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Processing Time</label>
              <input placeholder="e.g., 5-7 business days" value={newVisaForm.processingTime}
                onChange={e => setNewVisaForm({...newVisaForm, processingTime: e.target.value})}
                className="input-field text-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Visa Type</label>
              <input placeholder="e.g., E-Visa" value={newVisaForm.visaType}
                onChange={e => setNewVisaForm({...newVisaForm, visaType: e.target.value})}
                className="input-field text-sm" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 block">Pricing Plans</label>
                <button type="button" onClick={() => setNewVisaForm({
                    ...newVisaForm,
                    plans: [...newVisaForm.plans, { label: '', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: false }],
                  })}
                  className="text-xs font-bold text-primary hover:underline">+ Add Plan</button>
              </div>

              {newVisaForm.plans.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-4 text-center">No plans yet — add at least one so this visa can be applied for.</p>
              ) : (
                <div className="space-y-3">
                  {newVisaForm.plans.map((plan, index) => {
                    const updatePlan = (field, value) => {
                      const plans = [...newVisaForm.plans];
                      plans[index] = { ...plans[index], [field]: value };
                      setNewVisaForm({ ...newVisaForm, plans });
                    };
                    return (
                      <div key={index} className="border border-gray-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input placeholder="Plan label — e.g. 30 Days" value={plan.label}
                            onChange={e => updatePlan('label', e.target.value)}
                            className="input-field text-sm flex-1" />
                          <button type="button" onClick={() => setNewVisaForm({
                              ...newVisaForm, plans: newVisaForm.plans.filter((_, i) => i !== index),
                            })}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input type="checkbox" checked={plan.isContactUs}
                            onChange={e => updatePlan('isContactUs', e.target.checked)}
                            className="w-3.5 h-3.5 accent-primary" />
                          Contact Us (no fixed price)
                        </label>
                        {!plan.isContactUs && (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Base (₹)</label>
                              <input type="number" min="0" value={plan.basePrice}
                                onChange={e => updatePlan('basePrice', Number(e.target.value))}
                                className="input-field text-sm" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Agent (₹)</label>
                              <input type="number" min="0" value={plan.agentPrice}
                                onChange={e => updatePlan('agentPrice', Number(e.target.value))}
                                className="input-field text-sm" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Public (₹)</label>
                              <input type="number" min="0" value={plan.publicPrice}
                                onChange={e => updatePlan('publicPrice', Number(e.target.value))}
                                className="input-field text-sm" />
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

          <div className="flex gap-3 pt-2">
            <button onClick={addNewVisa} disabled={addingVisa}
              className="btn-primary flex-1 justify-center disabled:opacity-60">
              {addingVisa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {addingVisa ? 'Creating…' : 'Create Visa'}
            </button>
            <button onClick={() => setShowAddVisa(false)} className="btn-outline flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
