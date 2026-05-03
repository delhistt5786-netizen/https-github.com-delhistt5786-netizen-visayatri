'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import { setAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen pt-16 bg-gradient-to-br from-primary via-secondary to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4 shadow-lg">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Welcome Back</h1>
          <p className="text-blue-200 mt-2">Login to your Visayatri account</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email Address</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••" className="input-field pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account? <Link href="/auth/register" className="text-primary font-semibold hover:underline">Register</Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
            Admin demo: admin@visayatri.com / Admin@123
          </div>
        </div>
      </div>
    </div>
  );
}
