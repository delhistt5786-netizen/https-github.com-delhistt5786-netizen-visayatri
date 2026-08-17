'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, X } from 'lucide-react';
import { authAPI } from '../../lib/api';
import { setAuth, dashboardPath } from '../../lib/auth';
import { waForgotPassword } from '../../lib/whatsapp';
import toast from 'react-hot-toast';

export default function LoginBox({ onSuccess, onClose, compact = false }) {
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
      onSuccess?.(data.user);
      router.push(dashboardPath(data.user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* Navy gradient backdrop, matching the site's hero styling */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#FF7A00] rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className={`relative z-10 ${compact ? 'px-5 py-5' : 'px-7 py-8'}`}>
        {onClose && (
          <button onClick={onClose} type="button" className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}

        <h2 className={`font-serif font-bold text-[#FF7A00] text-center ${compact ? 'text-xl mb-1' : 'text-3xl mb-2'}`}>Login</h2>
        {!compact && <p className="text-white/80 text-sm text-center mb-5">Login with your credentials.</p>}
        <div className={`border-t border-white/20 ${compact ? 'mb-3' : 'mb-6'}`}></div>

        <form onSubmit={handleSubmit} className={compact ? 'space-y-2.5' : 'space-y-4'}>
          <input type="text" required placeholder="Email ID / Mobile No" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className={`w-full rounded-full bg-transparent border border-white/40 text-white placeholder-white/60 text-sm focus:outline-none focus:border-[#FF7A00] transition-colors ${compact ? 'px-4 py-2' : 'px-5 py-3'}`} />

          <div className="relative">
            <input type={showPass ? 'text' : 'password'} required placeholder="Password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className={`w-full pr-11 rounded-full bg-transparent border border-white/40 text-white placeholder-white/60 text-sm focus:outline-none focus:border-[#FF7A00] transition-colors ${compact ? 'px-4 py-2' : 'px-5 py-3'}`} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF7A00] hover:text-orange-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full rounded-full bg-[#FF7A00] hover:bg-orange-600 text-white font-bold transition-all disabled:opacity-60 ${compact ? 'py-2 text-sm' : 'py-3'}`}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className={`text-center ${compact ? 'mt-2' : 'mt-4'}`}>
          <a href={waForgotPassword()} target="_blank" rel="noopener noreferrer"
            className={`text-white underline hover:text-[#FF7A00] transition-colors ${compact ? 'text-xs' : 'text-sm'}`}>
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
}
