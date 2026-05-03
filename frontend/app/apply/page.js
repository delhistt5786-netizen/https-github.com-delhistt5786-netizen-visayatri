'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, CreditCard, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { paymentAPI, appAPI } from '../../lib/api';
import { getUser } from '../../lib/auth';
import toast from 'react-hot-toast';

/* ── Load Razorpay script dynamically ──────────────────── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script    = document.createElement('script');
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PaymentContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const user    = getUser();

  const appId   = params.get('appId')   || '';
  const amount  = Number(params.get('amount') || 0);
  const country = params.get('country') || 'Visa';
  const plan    = params.get('plan')    || '';

  const [appData,    setAppData]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [paying,     setPaying]     = useState(false);
  const [paid,       setPaid]       = useState(false);
  const [error,      setError]      = useState('');
  const [scriptReady,setScriptReady]= useState(false);

  /* Fetch application details */
  useEffect(() => {
    if (!user)  { router.push('/auth/login');      return; }
    if (!appId) { router.push('/dashboard/user'); return; }

    Promise.all([
      appAPI.getById(appId).catch(() => null),
      loadRazorpayScript(),
    ]).then(([res, scriptOk]) => {
      if (res?.data?.data) {
        const a = res.data.data;
        if (a.paymentStatus === 'paid') { setPaid(true); }
        setAppData(a);
      }
      setScriptReady(scriptOk);
      setLoading(false);
    });
  }, []);

  const handlePay = useCallback(async () => {
    if (!scriptReady) {
      toast.error('Payment gateway failed to load. Please refresh.');
      return;
    }
    setPaying(true);
    setError('');

    try {
      /* 1. Create Razorpay order */
      const { data: orderData } = await paymentAPI.createOrder({ applicationId: appId });

      /* 2. Open Razorpay checkout */
      await new Promise((resolve, reject) => {
        const options = {
          key:         orderData.key,
          amount:      orderData.order.amount,
          currency:    'INR',
          name:        'Visayatri',
          description: `${country} Visa — ${plan}`,
          image:       '/logo.png',
          order_id:    orderData.order.id,
          prefill: {
            name:    orderData.applicantName  || user?.name  || '',
            email:   orderData.applicantEmail || user?.email || '',
            contact: orderData.applicantPhone || user?.phone || '',
          },
          notes: { applicationId: appId },
          theme: { color: '#0B3C5D', backdrop_color: 'rgba(0,0,0,0.7)' },
          modal: {
            ondismiss: () => {
              setPaying(false);
              reject(new Error('dismissed'));
            },
          },
          handler: async (response) => {
            try {
              /* 3. Verify on backend */
              await paymentAPI.verify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                applicationId:       appId,
              });
              setPaid(true);
              toast.success('🎉 Payment successful! Your application is confirmed.');
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        };
        new window.Razorpay(options).open();
      });
    } catch (err) {
      if (err.message === 'dismissed') {
        toast('Payment cancelled.', { icon: 'ℹ️' });
      } else {
        const msg = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setPaying(false);
    }
  }, [scriptReady, appId, country, plan, user]);

  /* ── Success screen ─────────────────────────────────── */
  if (paid) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary mb-3">Payment Successful!</h1>
          <p className="text-gray-500 mb-2">Your {country} visa application is confirmed.</p>
          {appData?.applicationId && (
            <p className="text-sm font-mono bg-gray-50 rounded-xl px-4 py-2 inline-block mt-2 text-primary">
              App ID: #{appData.applicationId}
            </p>
          )}
          <div className="mt-8 space-y-3">
            <Link href="/dashboard/user" className="btn-primary w-full justify-center">
              View My Application
            </Link>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent(`Hello! I just paid for my ${country} visa application. App ID: ${appData?.applicationId}. Please process it. Thank you!`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-semibold transition-all">
              💬 Confirm via WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading skeleton ───────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded-xl w-2/3" />
            <div className="h-32 bg-gray-100 rounded-2xl" />
            <div className="h-14 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Payment screen ─────────────────────────────────── */
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">

        {/* Back link */}
        <Link href="/dashboard/user" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary px-7 py-6">
            <p className="text-blue-200 text-sm font-medium">Secure Payment</p>
            <h1 className="text-2xl font-extrabold text-white mt-1">Complete Your Visa Payment</h1>
          </div>

          <div className="p-7 space-y-5">
            {/* Order summary */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Visa</span>
                <span className="font-semibold">{country}</span>
              </div>
              {plan && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold">{plan}</span>
                </div>
              )}
              {appData?.applicationId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">App ID</span>
                  <span className="font-mono text-primary">#{appData.applicationId}</span>
                </div>
              )}
              {appData?.applicantName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Applicant</span>
                  <span className="font-semibold">{appData.applicantName}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-800">Total Amount</span>
                <span className="text-3xl font-extrabold text-primary">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={paying || !scriptReady}
              className="w-full bg-cta hover:bg-orange-600 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-200 active:scale-95">
              {paying
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                : <><CreditCard className="w-5 h-5" /> Pay ₹{amount.toLocaleString('en-IN')}</>
              }
            </button>

            {/* Trust row */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>256-bit SSL · UPI · Cards · NetBanking · Wallets</span>
            </div>

            {/* Powered by */}
            <div className="text-center text-xs text-gray-300">Powered by Razorpay</div>
          </div>
        </div>

        {/* WhatsApp fallback */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-500 mb-3">Prefer to pay offline?</p>
          <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent(`Hello Visayatri! I want to apply for ${country} visa (${plan}). App ID: ${appData?.applicationId || 'New'}. Please guide me for offline payment.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            💬 Pay via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
