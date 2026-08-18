'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, Shield, Zap, ArrowRight } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import { setAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';

// lib/api.js hard-redirects here with ?expired=1 when a stored session
// token is rejected by the backend (expired, or invalid — e.g. signed
// under a JWT_SECRET the server no longer recognizes). Without this the
// user just sees the page reload back to login with no explanation.
// useSearchParams() needs its own Suspense boundary or the whole page
// deopts out of static rendering.
function ExpiredSessionNotice() {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('expired')) {
      toast.error('Your session expired. Please log in again.');
    }
  }, [searchParams]);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      const paths = { admin: '/dashboard/admin', agent: '/dashboard/agent', user: '/dashboard/user' };
      router.push(paths[data.user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] relative overflow-hidden">
      <Suspense fallback={null}><ExpiredSessionNotice /></Suspense>
      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#3282B8] rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#FF7A00] rounded-full filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* LEFT: Brand Story */}
          <div className="text-white hidden md:block space-y-8">
            <div>
              <h1 className="text-5xl font-black mb-4 leading-tight">Welcome back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-orange-400">Visayatri</span></h1>
              <p className="text-xl text-blue-200 leading-relaxed">Access your visa applications, track progress, and manage your travel documents all in one place.</p>
            </div>

            {/* Trust badges */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Bank-level security for your documents' },
                { icon: Zap, text: '24/7 instant support via WhatsApp' },
                { icon: CheckCircle, text: '10,000+ successful visa applications' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-blue-100">
                  <item.icon className="w-5 h-5 text-[#FF7A00]" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-blue-300 mb-3">Trusted by leading travel agencies</p>
              <div className="flex gap-3 flex-wrap">
                {['⭐ 4.9/5 rating', '✓ ISO Certified', '🔒 GDPR Compliant'].map((badge, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/20">{badge}</span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Sign In</h2>
                <p className="text-blue-200">Access your Visayatri account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-white uppercase tracking-wide block mb-2">Email Address</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="you@example.com" 
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all" />
                </div>

                <div>
                  <label className="text-sm font-bold text-white uppercase tracking-wide block mb-2">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="••••••••" 
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all pr-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
                  {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </button>

                <div className="text-center">
                  <Link href="/auth/forgot-password" className="text-white/80 text-sm underline hover:text-[#FF7A00] transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-white/20 text-center">
                <p className="text-white/80 mb-4">New to Visayatri?</p>
                <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-semibold transition-all border border-white/20">
                  Create Account <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Demo credentials */}
              <div className="mt-6 p-3 bg-[#FF7A00]/20 rounded-xl border border-[#FF7A00]/30 text-xs text-[#FFB366] text-center space-y-1">
                <p className="font-semibold mb-1">Demo Accounts</p>
                <p>Admin: admin@visayatri.com / Admin@123</p>
                <p>Agent: agent@visayatri.com / Agent@123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
