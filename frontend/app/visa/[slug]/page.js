'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, ArrowLeft, MessageCircle, ChevronDown, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { visaAPI, appAPI, pdfURL } from '../../../lib/api';
import { waApply, waAgentApply } from '../../../lib/whatsapp';
import { getUser } from '../../../lib/auth';
import Loading from '../../../components/ui/Loading';
import toast from 'react-hot-toast';

const settingsAPI = {
  get: () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`).then(r => r.json())
};

export default function VisaDetailPage() {
  const { slug }   = useParams();
  const router     = useRouter();
  const user       = getUser();
  const isAgent    = user?.role === 'agent';

  const [visa, setVisa]               = useState(null);
  const [settings, setSettings]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openFaq, setOpenFaq]         = useState(null);
  const [applying, setApplying]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('whatsapp');
  const [form, setForm] = useState({
    applicantName: user?.name || '',
    applicantEmail: user?.email || '',
    applicantPhone: user?.phone || '',
    passportNumber: '',
    nationality: '',
    travelDate: '',
    returnDate: '',
    purposeOfVisit: 'Tourism',
  });

  useEffect(() => {
    Promise.all([
      visaAPI.getBySlug(slug),
      settingsAPI.get()
    ]).then(([visaRes, settingsRes]) => {
      const v = visaRes.data.data;
      setVisa(v);
      setSettings(settingsRes.data);
      const first = v.plans?.find(p => !p.isContactUs);
      if (first) setSelectedPlan(first);
      setLoading(false);
    }).catch(() => { setLoading(false); router.push('/visa'); });
  }, [slug]);

  const basePrice = isAgent ? selectedPlan?.price : (selectedPlan?.price || selectedPlan?.publicPrice);
  const serviceFee = settings?.serviceFeeEnabled ? (settings?.serviceFee || 0) : 0;
  const totalPrice = basePrice + serviceFee;

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    if (!selectedPlan) { toast.error('Please select a plan'); return; }
    if (selectedPlan.isContactUs) {
      window.open(waApply({ visaCountry: visa.country, planLabel: selectedPlan.label, userName: user.name, email: user.email }), '_blank');
      return;
    }

    setApplying(true);
    try {
      const payload = {
        visaId:     visa._id,
        planLabel:  selectedPlan.label,
        paymentMethod,
        ...form,
      };

      const { data } = await appAPI.create(payload);
      toast.success('Application submitted successfully!');

      // If WhatsApp — open the WA link returned by backend
      if (paymentMethod === 'whatsapp' && data.whatsappLink) {
        window.open(data.whatsappLink, '_blank');
      }

      // If Razorpay — redirect to payment page
      if (paymentMethod === 'razorpay') {
        router.push(`/apply?appId=${data.data._id}&amount=${totalPrice}&country=${encodeURIComponent(visa.country)}`);
        return;
      }

      router.push('/dashboard/user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally { setApplying(false); }
  };

  if (loading) return <div className="pt-16"><Loading /></div>;
  if (!visa) return null;

  const hasRealPlans = visa.plans?.some(p => !p.isContactUs);

  return (
    <div className="pt-16 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/visa" className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Visas
          </Link>
          <div className="flex items-center gap-5 flex-wrap">
            <span className="text-6xl leading-none">{visa.flag}</span>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-4xl font-extrabold">{visa.country} Visa</h1>
                {visa.isRiskFree && <span className="badge bg-emerald-400/90 text-white">✓ Risk Free</span>}
              </div>
              <div className="flex gap-5 text-blue-200 text-sm">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{visa.processingTime}</span>
                <span>{visa.visaType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT col */}
          <div className="lg:col-span-2 space-y-6">

            {/* Plan selector */}
            <div className="card">
              <h2 className="text-xl font-bold text-primary mb-5">Select Your Plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visa.plans?.map((p, i) => (
                  <button key={i} onClick={() => !p.isContactUs && setSelectedPlan(p)}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${p.isContactUs ? 'border-dashed border-gray-200 cursor-default' : ''}
                      ${!p.isContactUs && selectedPlan?.label === p.label
                        ? 'border-cta bg-orange-50 shadow-sm'
                        : !p.isContactUs ? 'border-gray-200 hover:border-secondary' : ''}`}>
                    <p className="font-semibold text-gray-800 text-sm">{p.label}</p>
                    {p.isContactUs
                      ? <p className="text-gray-400 text-sm mt-1">Call / WhatsApp for price</p>
                      : (
                        <>
                          <p className="text-2xl font-extrabold text-primary mt-1">
                            ₹{(p.price || p.publicPrice || 0).toLocaleString('en-IN')}
                          </p>
                          {isAgent && p.profit > 0 && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />+₹{p.profit.toLocaleString('en-IN')} potential profit
                            </p>
                          )}
                          {selectedPlan?.label === p.label && (
                            <p className="text-cta text-xs font-bold mt-1">✓ Selected</p>
                          )}
                        </>
                      )
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="card">
              <h2 className="text-xl font-bold text-primary mb-4">Documents Required</h2>
              <ul className="space-y-2.5">
                {(visa.requirements?.length ? visa.requirements : ['Valid passport (6+ months validity)', 'Passport size photo (white background)', 'Return flight ticket', 'Hotel booking']).map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQs */}
            {visa.faqs?.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {visa.faqs.map((f, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex justify-between items-center px-4 py-3 text-left font-semibold text-gray-800 text-sm hover:bg-gray-50 transition-colors">
                        {f.question}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">{f.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT col — sticky apply form */}
          <div>
            <div className="card sticky top-24">
              <h2 className="text-lg font-bold text-primary mb-1">Apply Now</h2>

              {selectedPlan && !selectedPlan.isContactUs && (
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Visa Fee:</span>
                      <span className="font-semibold">₹{basePrice?.toLocaleString('en-IN')}</span>
                    </div>
                    {serviceFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{settings?.serviceFeeLabel || 'Service Fee'}:</span>
                        <span className="font-semibold">₹{serviceFee.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-semibold text-primary">Total:</span>
                      <span className="text-2xl font-extrabold text-cta">₹{totalPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">· {selectedPlan.label}</p>
                  {isAgent && selectedPlan.profit > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1 text-center flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Profit: ₹{selectedPlan.profit.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}

              {user ? (
                <form onSubmit={handleApply} className="space-y-3">
                  {[
                    ['applicantName',  'Full Name',       'text',  true],
                    ['applicantEmail', 'Email',           'email', true],
                    ['applicantPhone', 'Phone Number',    'tel',   true],
                    ['passportNumber', 'Passport Number', 'text',  false],
                    ['nationality',   'Nationality',     'text',  false],
                    ['travelDate',    'Travel Date',     'date',  false],
                    ['returnDate',    'Return Date',     'date',  false],
                  ].map(([field, label, type, req]) => (
                    <div key={field}>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}{req && ' *'}</label>
                      <input type={type} required={req}
                        value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                        className="input-field text-sm" />
                    </div>
                  ))}

                  {/* Payment method */}
                  {hasRealPlans && selectedPlan && !selectedPlan.isContactUs && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ['whatsapp', '💬 WhatsApp'],
                          ...(isAgent ? [['wallet', '👛 Wallet']] : [['razorpay', '💳 Pay Online']]),
                        ].map(([val, label]) => (
                          <button key={val} type="button" onClick={() => setPaymentMethod(val)}
                            className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${paymentMethod === val ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {isAgent && paymentMethod === 'wallet' && (
                        <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 rounded-lg px-2 py-1.5">
                          ₹{price?.toLocaleString('en-IN')} will be deducted from your wallet balance: ₹{user.walletBalance?.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  <button type="submit" disabled={applying}
                    className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed">
                    {applying ? 'Submitting...' : selectedPlan?.isContactUs ? 'Contact via WhatsApp' : 'Submit Application'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-4">Login to apply online or track your application</p>
                  <Link href="/auth/login" className="btn-secondary w-full justify-center">Login to Apply</Link>
                </div>
              )}

              {/* Always-visible WA button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a href={waApply({
                    visaCountry: visa.country,
                    planLabel: selectedPlan?.label,
                    userName: user?.name,
                    email: user?.email,
                    travelDate: form.travelDate,
                  })}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-semibold transition-all text-sm">
                  <MessageCircle className="w-4 h-4" /> Apply via WhatsApp
                </a>
                <p className="text-center text-xs text-gray-400 mt-2">Instant reply · 24/7 support</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
