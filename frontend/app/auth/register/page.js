'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';
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
    <div className="min-h-screen pt-16 bg-gradient-to-br from-primary via-secondary to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4 shadow-lg">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
          <p className="text-blue-200 mt-2">Join Visayatri today — it's free</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            {[['user','🧳 Traveler'],['agent','🏢 Agent (B2B)']].map(([role,label]) => (
              <button key={role} type="button" onClick={() => setForm({...form, role})}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${form.role === role ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[['name','Full Name','text','John Doe'],['email','Email','email','you@example.com'],['phone','Phone Number','tel','+91 98765 43210'],['password','Password','password','Min. 6 characters']].map(([field,label,type,ph]) => (
              <div key={field}>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">{label}</label>
                <input type={type} required={field !== 'phone'} value={form[field]} onChange={e => setForm({...form,[field]:e.target.value})}
                  placeholder={ph} className="input-field" />
              </div>
            ))}
            {form.role === 'agent' && (
              <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                ℹ️ Agent accounts require admin approval before use.
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account? <Link href="/auth/login" className="text-primary font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
