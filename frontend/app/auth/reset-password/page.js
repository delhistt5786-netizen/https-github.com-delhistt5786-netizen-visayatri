'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

// useSearchParams() needs its own Suspense boundary or the whole page
// deopts out of static rendering (see app/auth/login/page.js for the same fix).
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or has expired');
    } finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <h2 className="text-2xl font-black text-white mb-3">Invalid Link</h2>
        <p className="text-blue-200 mb-6">This password reset link is missing its token. Please request a new one.</p>
        <Link href="/auth/forgot-password" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-semibold transition-all border border-white/20">
          Request New Link <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">Password Reset!</h2>
        <p className="text-blue-200">Taking you to the login page...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-2">Set a New Password</h2>
        <p className="text-blue-200">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-bold text-white uppercase tracking-wide block mb-2">New Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all pr-10" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-white uppercase tracking-wide block mb-2">Confirm Password</label>
          <input type={showPass ? 'text' : 'password'} required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
          {loading ? 'Resetting...' : <>Reset Password <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#3282B8] rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#FF7A00] rounded-full filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-6 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
          </Link>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
