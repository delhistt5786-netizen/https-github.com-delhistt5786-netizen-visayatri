'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset link');
    } finally { setLoading(false); }
  };

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
            {!sent ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">Forgot Password?</h2>
                  <p className="text-blue-200">Enter your email and we'll send you a reset link.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-white uppercase tracking-wide block mb-2">Email Address</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all" />
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
                    {loading ? 'Sending...' : <>Send Reset Link <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#FF7A00]/20 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-[#FF7A00]" />
                </div>
                <h2 className="text-2xl font-black text-white mb-3">Check your email</h2>
                <p className="text-blue-200">If an account exists for that email, a password reset link is on its way. It expires in 1 hour.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
