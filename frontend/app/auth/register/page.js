'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Shield, Zap, ArrowRight, Users, TrendingUp } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import { setAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', role: params.get('role') || 'user' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      setAuth(data.token, data.user);
      toast.success('Account created successfully!');
      if (data.user.role === 'agent') {
        toast('Your agent account is pending approval by admin.', { icon: 'ℹ️', duration: 5000 });
        router.push('/dashboard/agent');
      } else {
        router.push('/dashboard/user');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#3282B8] rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#FF7A00] rounded-full filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* LEFT: Benefits & Social Proof */}
          <div className="text-white hidden md:block space-y-8">
            <div>
              <h1 className="text-5xl font-black mb-4 leading-tight">Start your visa journey with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-orange-400">Visayatri</span></h1>
              <p className="text-xl text-blue-200 leading-relaxed">Quick visa processing, expert guidance, and 24/7 support — all in one platform.</p>
            </div>

            {/* Benefits for different roles */}
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-wider text-[#FF7A00]">Why join us?</p>
              {[
                { icon: CheckCircle, text: 'Fast visa approvals (24-72 hours)' },
                { icon: Shield, text: 'Secure document handling' },
                { icon: Zap, text: '24/7 WhatsApp support' },
                { icon: Users, text: 'Join 10,000+ successful travelers' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-blue-100">
                  <item.icon className="w-5 h-5 text-[#FF7A00] flex-shrink-0" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Agent benefits callout */}
            <div className="p-4 bg-gradient-to-br from-[#FF7A00]/20 to-orange-500/10 rounded-2xl border border-[#FF7A00]/30">
              <p className="text-sm font-bold text-[#FFB366] mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> For Agents</p>
              <p className="text-sm text-white/90">Earn commission on each visa application. Build your B2B visa business today.</p>
            </div>
          </div>

          {/* RIGHT: Registration Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Create Account</h2>
                <p className="text-blue-200">Join Visayatri today — it's free</p>
              </div>

              {/* Role selector - Premium style */}
              <div className="mb-6 space-y-2">
                <label className="text-sm font-bold text-white uppercase tracking-wide block">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { role: 'user', label: '🧳 Traveler', desc: 'Apply for visas' },
                    { role: 'agent', label: '🏢 Agent', desc: 'B2B visa business' }
                  ].map(({role, label, desc}) => (
                    <button key={role} type="button" onClick={() => setForm({...form, role})}
                      className={`p-3 rounded-xl font-semibold text-sm border-2 transition-all text-center ${
                        form.role === role 
                          ? 'border-[#FF7A00] bg-[#FF7A00]/20 text-white' 
                          : 'border-white/20 text-white/80 hover:border-white/40 hover:bg-white/10'
                      }`}>
                      <div className="text-lg mb-1">{label.split(' ')[0]}</div>
                      <div className="text-xs opacity-80">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { field: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
                  { field: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', required: true },
                  { field: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', required: false },
                  { field: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters', required: true },
                ].map(({field, label, type, placeholder, required}) => (
                  <div key={field}>
                    <label className="text-sm font-bold text-white uppercase tracking-wide block mb-2">{label}</label>
                    <input type={type} required={required} value={form[field]} onChange={e => setForm({...form,[field]:e.target.value})}
                      placeholder={placeholder} 
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all" />
                  </div>
                ))}

                {form.role === 'agent' && (
                  <div className="p-3 bg-[#FF7A00]/20 rounded-xl border border-[#FF7A00]/30 text-xs text-[#FFB366] space-y-1">
                    <p className="font-bold">✓ Agent accounts pending approval</p>
                    <p>Your account will be reviewed by our team within 24 hours.</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-6">
                  {loading ? 'Creating account...' : <>Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/20 text-center">
                <p className="text-white/80 mb-4">Already have an account?</p>
                <Link href="/auth/login" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-semibold transition-all border border-white/20">
                  Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
