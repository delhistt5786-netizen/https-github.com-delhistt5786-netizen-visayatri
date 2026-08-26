'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, ArrowLeft, MessageCircle, ChevronDown, TrendingUp, Wallet, CreditCard, Calendar, FileText, Users, Shield, MapPin, Zap, ShieldCheck, AlertTriangle, Circle } from 'lucide-react';
import { visaAPI, appAPI, visaRuleAPI } from '../../../lib/api';
import { waApply, waAgentApply } from '../../../lib/whatsapp';
import { getUser, setAuth } from '../../../lib/auth';
import Loading from '../../../components/ui/Loading';
import DocumentUpload from '../../../components/visa/DocumentUpload';
import CountrySelect from '../../../components/common/CountrySelect';
import ApplyStepper from '../../../components/visa/ApplyStepper';
import toast from 'react-hot-toast';

const settingsAPI = {
  get: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
      if (!res.ok) throw new Error('Settings fetch failed');
      return await res.json();
    } catch (err) {
      console.warn('⚠️  Settings API error, using defaults:', err.message);
      return { data: { serviceFeeEnabled: false, serviceFee: 0 } };
    }
  }
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
  const [expandedSection, setExpandedSection] = useState('overview');
  const [form, setForm] = useState({
    // Passport details (auto-filled by OCR when front/back passport is uploaded, always editable)
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    passportNumber: '',
    dateOfBirth: '',
    nationality: '',
    gender: '',
    passportIssueDate: '',
    passportExpiryDate: '',

    // Travel details
    travelDate: '',
    returnDate: '',
    purposeOfVisit: 'Tourism',

    // Contact details
    applicantEmail: user?.email || '',
    applicantPhone: user?.phone || '',
  });
  const [ocrConflicts, setOcrConflicts] = useState([]);
  const [documents, setDocuments] = useState({
    frontPassport: null,
    backPassport: null,
    digitalPhoto: null,
    optional1: null,
    optional2: null,
    optional3: null,
    optional4: null,
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

  // Additive trip-summary sidebar data only — does not affect the official
  // application form's fields, order, or validation logic in any way.
  const [officialRules, setOfficialRules] = useState([]);
  useEffect(() => {
    visaRuleAPI.getByCountry(slug).then(r => setOfficialRules(r.data.data || [])).catch(() => setOfficialRules([]));
  }, [slug]);

  const basePrice = isAgent ? selectedPlan?.price : (selectedPlan?.price || selectedPlan?.publicPrice);
  // Service fee (₹599) applies to B2C individual applicants only — agents (B2B)
  // are exempt since their margin is already built into agentPrice.
  const serviceFee = !isAgent && settings?.serviceFeeEnabled ? (settings?.serviceFee || 0) : 0;
  const totalPrice = basePrice + serviceFee;

  const handleApply = async (e) => {
    e.preventDefault();
    // B2C (individual) applicants can apply without logging in — a guest
    // account is created behind the scenes on submit. Agents (B2B) must
    // already be logged in to reach agent pricing in the first place, since
    // isAgent only becomes true from a real, authenticated agent session.
    if (!selectedPlan) { toast.error('Please select a plan'); return; }
    
    // Validate mandatory documents
    if (!documents.frontPassport || !documents.backPassport || !documents.digitalPhoto) {
      toast.error('Please upload all mandatory documents: Front Passport, Back Passport, and Digital Photo');
      return;
    }
    
    if (selectedPlan.isContactUs) {
      window.open(waApply({
        visaCountry: visa.country, planLabel: selectedPlan.label,
        userName: user?.name || `${form.firstName} ${form.lastName}`.trim(),
        email: user?.email || form.applicantEmail,
      }), '_blank');
      return;
    }

    setApplying(true);
    try {
      // Step 1: create the application from a plain JSON payload
      const { data } = await appAPI.create({
        visaId: visa._id,
        planLabel: selectedPlan.label,
        paymentMethod,
        applicantName:  `${form.firstName} ${form.lastName}`.trim(),
        applicantEmail: form.applicantEmail,
        applicantPhone: form.applicantPhone,
        passportNumber: form.passportNumber,
        passportExpiry: form.passportExpiryDate,
        nationality:    form.nationality,
        dateOfBirth:    form.dateOfBirth,
        travelDate:     form.travelDate,
        returnDate:     form.returnDate,
        purposeOfVisit: form.purposeOfVisit,
        extra: { gender: form.gender, passportIssueDate: form.passportIssueDate },
      });
      const applicationId = data.data._id;

      // Guest (B2C, no-login) checkout — the backend auto-created/reused an
      // account and issued a token. Sign the applicant in silently so the
      // document upload below (and their dashboard afterwards) both work.
      if (data.token && data.user) {
        setAuth(data.token, { _id: data.user.id, ...data.user });
      }

      // Step 2: upload the mandatory + optional documents to the created application
      const docEntries = [
        ['frontPassport', documents.frontPassport],
        ['backPassport', documents.backPassport],
        ['digitalPhoto', documents.digitalPhoto],
        ['optional1', documents.optional1],
        ['optional2', documents.optional2],
        ['optional3', documents.optional3],
        ['optional4', documents.optional4],
      ].filter(([, file]) => !!file);

      if (docEntries.length) {
        const docFormData = new FormData();
        const docTypes = docEntries.map(([type]) => type);
        docEntries.forEach(([, file]) => docFormData.append('documents', file));
        docFormData.append('docTypes', JSON.stringify(docTypes));
        try {
          const uploadRes = await appAPI.uploadDocs(applicationId, docFormData);
          const rejected = uploadRes.data?.rejected || [];
          if (rejected.length) {
            toast.error(`Some documents need to be re-uploaded: ${rejected.map(r => r.message).join(' ')}`, { duration: 8000 });
          }
        } catch (uploadErr) {
          // Application itself was already created — surface the document failure
          // separately so the applicant knows to go re-upload rather than assuming
          // the whole submission failed.
          toast.error(uploadErr.response?.data?.message || 'Documents could not be uploaded. Please re-upload them from your dashboard.', { duration: 8000 });
        }
      }

      toast.success('Application submitted successfully!');

      // If WhatsApp — open the WA link returned by backend
      if (paymentMethod === 'whatsapp' && data.whatsappLink) {
        window.open(data.whatsappLink, '_blank');
      }

      // If Razorpay — redirect to payment page
      if (paymentMethod === 'razorpay') {
        router.push(`/apply?appId=${applicationId}&amount=${totalPrice}&country=${encodeURIComponent(visa.country)}`);
        return;
      }

      router.push('/dashboard/user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally { setApplying(false); }
  };

  // Handle auto-fill form from OCR
  // Fields the applicant has already typed are NEVER silently overwritten —
  // a mismatch between what they typed and what the passport says is
  // surfaced as a warning (ocrConflicts) for them to resolve themselves,
  // per the "never auto-correct application data" rule for passport OCR.
  const handleOCRFormUpdate = (ocrData) => {
    const FIELD_MAP = [
      ['firstName', ocrData.givenNames, 'First name'],
      ['lastName', ocrData.surname, 'Last name'],
      ['passportNumber', ocrData.passportNumber, 'Passport number'],
      ['nationality', ocrData.nationality, 'Nationality'],
      ['dateOfBirth', ocrData.dateOfBirth, 'Date of birth'],
      ['gender', ocrData.gender, 'Gender'],
      ['passportIssueDate', ocrData.dateOfIssue, 'Passport issue date'],
      ['passportExpiryDate', ocrData.dateOfExpiry, 'Passport expiry date'],
    ];

    const conflicts = [];
    setForm(prev => {
      const next = { ...prev };
      for (const [field, ocrValue, label] of FIELD_MAP) {
        if (!ocrValue) continue;
        const existing = prev[field];
        if (!existing) {
          next[field] = ocrValue; // empty field — safe to pre-fill
        } else if (String(existing).trim().toLowerCase() !== String(ocrValue).trim().toLowerCase()) {
          conflicts.push({ label, typed: existing, passport: ocrValue }); // leave `next[field]` as what they typed
        }
      }
      return next;
    });

    setOcrConflicts(conflicts);
    if (conflicts.length > 0) {
      toast.error(`Passport doesn't match ${conflicts.length} field(s) you entered — review below.`, { duration: 6000 });
    } else {
      toast.success('Passport details extracted successfully.');
    }
  };

  if (loading) return <div className="pt-16"><Loading /></div>;
  if (!visa) return null;

  const hasRealPlans = visa.plans?.some(p => !p.isContactUs);

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Dark Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#061f3b] via-[#0d3b66] to-[#0B3C5D] text-white pt-20 pb-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#3282B8] rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#FF7A00] rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/visa" className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Visas
          </Link>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Left: Flag & Title */}
            <div className="md:col-span-2">
              <div className="flex items-start gap-6 mb-8">
                <span className="text-8xl leading-none">{visa.flag}</span>
                <div>
                  <h1 className="text-5xl font-black mb-3">{visa.country} Visa</h1>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {visa.isRiskFree && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/90 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                        <Shield className="w-4 h-4" /> Risk Free
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-white/20 text-white px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
                      <Zap className="w-4 h-4" /> {visa.visaType}
                    </span>
                  </div>
                  <p className="text-blue-100 text-lg mb-4 max-w-2xl">{visa.description || 'Fast & reliable visa processing with expert support throughout your journey.'}</p>
                </div>
              </div>

              {/* Key Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Processing Time</p>
                  <p className="text-2xl font-bold mt-1 flex items-center gap-1"><Clock className="w-5 h-5" />{visa.processingTime}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Validity</p>
                  <p className="text-2xl font-bold mt-1">{visa.validity || '1 Year'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Stay Duration</p>
                  <p className="text-2xl font-bold mt-1">{visa.stayDuration || '30 Days'}</p>
                </div>
              </div>
            </div>

            {/* Right: Quick Trust Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-6 border border-white/20 h-fit">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">✓ Trusted by thousands</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Expert guidance included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>24/7 WhatsApp support</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-xs text-blue-200">⭐ 4.9/5 rating • 2,400+ successful applications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* LEFT: Main Content Tabs */}
          <div className="lg:col-span-3 space-y-8">

            {/* ── Trip Summary + Document Progress (additive UX layer) ──
                Reads existing form/documents/visa state and the existing
                official VisaRule data — never adds fields to, reorders, or
                otherwise changes the official application form itself. */}
            {(() => {
              const rule = officialRules[0]; // country-level reference rule
              const tripDays = form.travelDate && form.returnDate
                ? Math.round((new Date(form.returnDate) - new Date(form.travelDate)) / (1000 * 60 * 60 * 24))
                : null;
              const exceedsMaxStay = tripDays != null && rule?.maximumStay?.value != null && tripDays > rule.maximumStay.value;

              const docChecklist = rule?.requiredDocuments?.length
                ? rule.requiredDocuments
                : (visa.requirements || []).map(r => ({ documentName: r, critical: false }));
              const DOC_TYPE_BY_NAME = { passport: 'frontPassport', photo: 'digitalPhoto', 'bank statement': null };
              const isLikelyUploaded = (name) => {
                const n = name.toLowerCase();
                if (n.includes('passport')) return !!(documents.frontPassport && documents.backPassport);
                if (n.includes('photo')) return !!documents.digitalPhoto;
                return null; // unknown mapping — show as informational only, not a false "missing"
              };

              return (
                <div className="soft-card space-y-5">
                  <h3 className="text-lg font-bold text-[#0B3C5D] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#FF7A00]" /> Trip Summary
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div><p className="text-gray-400 text-xs">Destination</p><p className="font-semibold">{visa.flag} {visa.country}</p></div>
                    <div><p className="text-gray-400 text-xs">Official Visa Type</p><p className="font-semibold">{rule?.officialVisaName || visa.visaType}</p></div>
                    <div><p className="text-gray-400 text-xs">Purpose</p><p className="font-semibold">{form.purposeOfVisit || '—'}</p></div>
                    <div><p className="text-gray-400 text-xs">Departure</p><p className="font-semibold">{form.travelDate || '—'}</p></div>
                    <div><p className="text-gray-400 text-xs">Return</p><p className="font-semibold">{form.returnDate || '—'}</p></div>
                    <div><p className="text-gray-400 text-xs">Trip Duration</p><p className="font-semibold">{tripDays != null ? `${tripDays} day${tripDays === 1 ? '' : 's'}` : '—'}</p></div>
                    {rule && (
                      <>
                        <div><p className="text-gray-400 text-xs">Visa Validity</p><p className="font-semibold">{rule.validityPeriod?.value} {rule.validityPeriod?.unit}</p></div>
                        <div><p className="text-gray-400 text-xs">Maximum Stay</p><p className="font-semibold">{rule.maximumStay?.value} {rule.maximumStay?.unit}</p></div>
                        <div><p className="text-gray-400 text-xs">Entry Type</p><p className="font-semibold capitalize">{rule.entryType}</p></div>
                        <div><p className="text-gray-400 text-xs">Government Fee</p><p className="font-semibold">{rule.governmentFee?.amount != null ? `${rule.governmentFee.currency} ${rule.governmentFee.amount}` : 'Verification required'}</p></div>
                      </>
                    )}
                    {selectedPlan && (
                      <div><p className="text-gray-400 text-xs">Visayatri Price</p><p className="font-semibold text-[#FF7A00]">{selectedPlan.isContactUs ? 'Contact us' : `₹${(selectedPlan.price || selectedPlan.publicPrice || 0).toLocaleString('en-IN')}`}</p></div>
                    )}
                  </div>

                  {tripDays != null && rule?.maximumStay?.value != null && (
                    exceedsMaxStay ? (
                      <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>This visa's maximum stay ({rule.maximumStay.value} {rule.maximumStay.unit}) may not cover your selected {tripDays}-day trip. Consider a longer-stay product if available, or double-check with the official portal.</span>
                      </div>
                    ) : (
                      <div className="flex gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Suitable based on configured rules — your {tripDays}-day trip is within the {rule.maximumStay.value}-{rule.maximumStay.unit} maximum stay.</span>
                      </div>
                    )
                  )}

                  {docChecklist.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Document Checklist
                      </p>
                      <ul className="space-y-1.5">
                        {docChecklist.map((d, i) => {
                          const name = d.documentName || d;
                          const uploaded = isLikelyUploaded(name);
                          return (
                            <li key={i} className="flex items-center gap-2 text-xs">
                              {uploaded === true ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                : uploaded === false ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                : <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                              <span className={d.critical ? 'font-semibold' : ''}>{d.critical ? '⭐ ' : ''}{name}</span>
                              {uploaded === true && <span className="text-emerald-600 ml-auto">Uploaded</span>}
                              {uploaded === false && <span className="text-amber-600 ml-auto">Missing</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Visa approval is solely at the discretion of the relevant government/immigration authority. This summary is informational and does not promise approval.
                  </p>
                </div>
              );
            })()}

            {/* Tabs/Sections Navigation */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-0">
              {['overview', 'requirements', 'faqs', 'eligibility'].map((tab) => (
                <button key={tab}
                  onClick={() => setExpandedSection(expandedSection === tab ? null : tab)}
                  className={`px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-all capitalize ${
                    expandedSection === tab
                      ? 'border-[#FF7A00] text-[#FF7A00]'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {expandedSection === 'overview' || expandedSection === null && (
              <div className="space-y-6 animate-in fade-in">
                {/* Processing Timeline */}
                <div className="soft-card">
                  <h3 className="text-xl font-bold text-[#0B3C5D] mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FF7A00]" /> How Long Does It Take?
                  </h3>
                  <div className="space-y-4">
                    {[
                      { step: 'Application Submission', days: '0-1' },
                      { step: 'Document Verification', days: '1-3' },
                      { step: 'Embassy Processing', days: `${visa.processingTime || '5-7 days'}` },
                      { step: 'Visa Approval & Delivery', days: '1-2' },
                    ].map((stage, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#FF7A00] text-white flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</div>
                          {idx < 3 && <div className="w-0.5 h-8 bg-gradient-to-b from-[#FF7A00] to-gray-200 mt-2"></div>}
                        </div>
                        <div className="pb-4">
                          <p className="font-semibold text-gray-800">{stage.step}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{stage.days}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Country Overview */}
                <div className="soft-card">
                  <h3 className="text-xl font-bold text-[#0B3C5D] mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#FF7A00]" /> About This Visa
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {visa.description || `Get your ${visa.country} visa quickly with our expert assistance. Our team handles all documentation and communication with the embassy to ensure smooth visa approval.`}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-transparent rounded-lg p-4 border border-blue-100">
                      <p className="text-xs text-gray-600 font-semibold uppercase">Entry Type</p>
                      <p className="text-lg font-bold text-[#0B3C5D] mt-1">{visa.visaType || 'Single Entry'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-transparent rounded-lg p-4 border border-green-100">
                      <p className="text-xs text-gray-600 font-semibold uppercase">Cost Range</p>
                      <p className="text-lg font-bold text-[#0B3C5D] mt-1">₹{Math.min(...(visa.plans?.map(p => p.price || p.publicPrice) || [999])).toLocaleString('en-IN')} - ₹{Math.max(...(visa.plans?.map(p => p.price || p.publicPrice) || [999])).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements Tab */}
            {expandedSection === 'requirements' && (
              <div className="soft-card animate-in fade-in">
                <h3 className="text-xl font-bold text-[#0B3C5D] mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF7A00]" /> Documents Required
                </h3>
                <div className="space-y-3">
                  {(visa.requirements?.length ? visa.requirements : ['Valid passport (6+ months validity)', 'Passport size photo (white background)', 'Return flight ticket', 'Hotel booking', 'Bank statements (last 3-6 months)', 'Employment letter from employer']).map((r, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-100 hover:shadow-sm transition-shadow">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-medium">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs Tab */}
            {expandedSection === 'faqs' && visa.faqs?.length > 0 && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-xl font-bold text-[#0B3C5D] mb-6">Frequently Asked Questions</h3>
                {visa.faqs.map((f, i) => (
                  <div key={i} className="soft-card overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex justify-between items-start px-6 py-4 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all group">
                      <span className="font-semibold text-gray-800 flex-1">{f.question}</span>
                      <ChevronDown className={`w-5 h-5 text-[#FF7A00] flex-shrink-0 ml-3 transition-transform duration-300 group-hover:text-[#FF7A00] ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-4 text-gray-600 leading-relaxed border-t border-gray-100 text-sm">{f.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Eligibility Tab */}
            {expandedSection === 'eligibility' && (
              <div className="soft-card animate-in fade-in">
                <h3 className="text-xl font-bold text-[#0B3C5D] mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FF7A00]" /> Eligibility Criteria
                </h3>
                <div className="space-y-4">
                  {[
                    'Valid passport with at least 6 months validity',
                    'Stable employment or proof of income',
                    'Clear criminal record',
                    'Genuine purpose of travel',
                    'Sufficient financial means for the trip',
                    'No previous visa rejections',
                  ].map((criterion, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <CheckCircle className="w-5 h-5 text-[#0B3C5D] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Plans Section - Always Visible */}
            <div className="soft-card">
              <h3 className="text-2xl font-bold text-[#0B3C5D] mb-8">Choose Your Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {visa.plans?.map((p, i) => (
                  <button key={i} onClick={() => !p.isContactUs && setSelectedPlan(p)}
                    className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                      p.isContactUs
                        ? 'border-dashed border-gray-300 cursor-default bg-gray-50'
                        : selectedPlan?.label === p.label
                        ? 'border-[#FF7A00] bg-gradient-to-br from-orange-50 to-white shadow-lg'
                        : 'border-gray-200 hover:border-[#FF7A00] hover:shadow-md'
                    }`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-bold text-gray-800 text-lg">{p.label}</p>
                      {selectedPlan?.label === p.label && !p.isContactUs && (
                        <span className="bg-[#FF7A00] text-white px-2 py-0.5 rounded-full text-xs font-bold">✓ Selected</span>
                      )}
                    </div>
                    
                    {p.isContactUs ? (
                      <p className="text-gray-500 text-sm">Contact us for custom pricing</p>
                    ) : (
                      <>
                        <p className="text-3xl font-black text-[#0B3C5D] mb-2">
                          ₹{(p.price || p.publicPrice || 0).toLocaleString('en-IN')}
                        </p>
                        {isAgent && p.profit > 0 && (
                          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />Profit: ₹{p.profit.toLocaleString('en-IN')}
                          </p>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-semibold mb-2 uppercase tracking-wide">Includes:</p>
                          <ul className="space-y-1">
                            {['Document review', 'Embassy communication', '24/7 support'].map((inc, idx) => (
                              <li key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> {inc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="soft-card lg:sticky lg:top-24 shadow-xl">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-2xl font-black text-[#0B3C5D] mb-1">Ready to Apply?</h2>
                <p className="text-sm text-gray-600">Join 10,000+ happy travelers</p>
              </div>

              {user && (
                <ApplyStepper
                  activeIndex={
                    !(form.firstName && form.lastName && form.passportNumber && form.applicantEmail && form.applicantPhone) ? 0
                    : !(documents.frontPassport && documents.backPassport && documents.digitalPhoto) ? 1
                    : 2
                  }
                  steps={[
                    { label: 'Details', complete: !!(form.firstName && form.lastName && form.passportNumber && form.applicantEmail && form.applicantPhone) },
                    { label: 'Documents', complete: !!(documents.frontPassport && documents.backPassport && documents.digitalPhoto) },
                    { label: 'Submit', complete: false },
                  ]}
                />
              )}

              {/* Price Summary */}
              {selectedPlan && !selectedPlan.isContactUs && (
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-4 border border-blue-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 text-sm font-semibold">Visa Fee:</span>
                    <span className="font-bold text-gray-900">₹{(selectedPlan.price || selectedPlan.publicPrice || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {serviceFee > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Service Fee:</span>
                      <span className="font-semibold text-gray-900">₹{serviceFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="font-bold text-[#0B3C5D]">Total Cost:</span>
                    <span className="text-3xl font-black text-[#FF7A00]">₹{((selectedPlan.price || selectedPlan.publicPrice || 0) + serviceFee).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-gray-500 pt-2 text-center">Plan: <span className="font-semibold text-gray-700">{selectedPlan.label}</span></p>
                </div>
              )}

              {/* Apply Form — B2C applicants don't need to log in; an account
                  is created automatically on submit so they can track their
                  application afterwards. Agents (B2B) must log in first to
                  see agent pricing. */}
              {!user && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs">
                  <span className="text-blue-800">Applying as a guest — no login needed. We'll set up an account with your email so you can track this application.</span>
                  <Link href="/auth/login" className="whitespace-nowrap font-bold text-primary hover:underline">Agent? Login</Link>
                </div>
              )}
              <form onSubmit={handleApply} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">First Name *</label>
                      <input type="text" required
                        value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                        className="input-field text-sm w-full" placeholder="John" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Last Name *</label>
                      <input type="text" required
                        value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                        className="input-field text-sm w-full" placeholder="Doe" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Passport No. *</label>
                      <input type="text" required
                        value={form.passportNumber} onChange={e => setForm({ ...form, passportNumber: e.target.value })}
                        className="input-field text-sm w-full" placeholder="AB1234567" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Nationality *</label>
                      <CountrySelect required value={form.nationality}
                        onChange={v => setForm({ ...form, nationality: v })}
                        placeholder="Select nationality" />
                    </div>
                  </div>

                  {/* SECTION: Passport Details (auto-filled by OCR, stays editable) */}
                  <div className="pt-3 border-t border-gray-300 mt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">📖 Passport Details</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Date of Birth *</label>
                        <input type="date" required
                          value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                          className="input-field text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Gender *</label>
                        <select required
                          value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                          className="input-field text-sm w-full">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Passport Issue Date</label>
                        <input type="date"
                          value={form.passportIssueDate} onChange={e => setForm({ ...form, passportIssueDate: e.target.value })}
                          className="input-field text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Expiry Date</label>
                        <input type="date"
                          value={form.passportExpiryDate} onChange={e => setForm({ ...form, passportExpiryDate: e.target.value })}
                          className="input-field text-sm w-full" />
                      </div>
                    </div>
                  </div>

                  {/* SECTION: Travel Information */}
                  <div className="pt-3 border-t border-gray-300 mt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">✈️ Travel Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Travel Date *</label>
                        <input type="date" required
                          value={form.travelDate} onChange={e => setForm({ ...form, travelDate: e.target.value })}
                          className="input-field text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Return Date *</label>
                        <input type="date" required
                          value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })}
                          className="input-field text-sm w-full" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Purpose of Visit *</label>
                      <select required
                        value={form.purposeOfVisit} onChange={e => setForm({ ...form, purposeOfVisit: e.target.value })}
                        className="input-field text-sm w-full">
                        <option value="Tourism">Tourism</option>
                        <option value="Business">Business</option>
                        <option value="Study">Study</option>
                        <option value="Work">Work</option>
                        <option value="Medical">Medical</option>
                        <option value="Visit Family">Visit Family</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* SECTION: Contact Details */}
                  <div className="pt-3 border-t border-gray-300 mt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">📞 Contact Details</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Email *</label>
                        <input type="email" required
                          value={form.applicantEmail} onChange={e => setForm({ ...form, applicantEmail: e.target.value })}
                          className="input-field text-sm w-full" placeholder="john@example.com" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Phone *</label>
                        <input type="tel" required
                          value={form.applicantPhone} onChange={e => setForm({ ...form, applicantPhone: e.target.value })}
                          className="input-field text-sm w-full" placeholder="+91 98765 43210" />
                      </div>
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wide block mb-3">📄 Upload Documents</label>
                    <p className="text-xs text-red-600 mb-3">Front Passport, Back Passport and Digital Photo are mandatory.</p>
                    <DocumentUpload
                      onDocumentsChange={setDocuments}
                      onPassportExtracted={handleOCRFormUpdate}
                    />
                    <p className="text-xs text-gray-500 mt-2">Supported formats: JPG, PNG, PDF (Max 5MB each)</p>

                    {ocrConflicts.length > 0 && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                        <p className="text-xs font-bold text-red-800">⚠️ Passport doesn't match what you entered:</p>
                        {ocrConflicts.map((c, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-red-700">
                              <strong>{c.label}:</strong> you entered "{c.typed}", passport says "{c.passport}"
                            </span>
                            <button type="button"
                              onClick={() => {
                                const fieldKey = { 'First name':'firstName','Last name':'lastName','Passport number':'passportNumber','Nationality':'nationality','Date of birth':'dateOfBirth','Gender':'gender','Passport issue date':'passportIssueDate','Passport expiry date':'passportExpiryDate' }[c.label];
                                setForm(prev => ({ ...prev, [fieldKey]: c.passport }));
                                setOcrConflicts(prev => prev.filter((_, idx) => idx !== i));
                              }}
                              className="whitespace-nowrap text-red-700 font-semibold underline hover:text-red-900">
                              Use passport value
                            </button>
                          </div>
                        ))}
                        <p className="text-[11px] text-red-500">Double-check which is correct — a mismatch here is a common cause of visa rejection.</p>
                      </div>
                    )}
                  </div>

                  {/* Validation: Check Mandatory Documents */}
                  {!documents.frontPassport || !documents.backPassport || !documents.digitalPhoto ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                      <span className="font-bold">⚠️ Mandatory Documents:</span> Please upload Front Passport, Back Passport, and Digital Photo to proceed.
                    </div>
                  ) : null}

                  {/* Payment Method */}
                  {hasRealPlans && selectedPlan && !selectedPlan.isContactUs && (
                    <div className="pt-3">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ['whatsapp', '💬 WhatsApp'],
                          ...(isAgent ? [['wallet', '👛 Wallet']] : [['razorpay', '💳 Card']]),
                        ].map(([val, label]) => (
                          <button key={val} type="button" onClick={() => setPaymentMethod(val)}
                            className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all text-center ${
                              paymentMethod === val
                                ? 'border-[#FF7A00] bg-[#FF7A00] text-white'
                                : 'border-gray-200 text-gray-700 hover:border-[#FF7A00]'
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={applying || !selectedPlan || !documents.frontPassport || !documents.backPassport || !documents.digitalPhoto}
                    className="w-full bg-gradient-to-r from-[#061f3b] to-[#0d3b66] hover:from-[#0d3b66] hover:to-[#0B3C5D] text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg mt-6">
                    {applying ? 'Submitting...' : selectedPlan?.isContactUs ? 'Contact via WhatsApp' : '✓ Submit Application'}
                  </button>
                </form>

              {/* WhatsApp CTA */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a href={waApply({
                    visaCountry: visa.country,
                    planLabel: selectedPlan?.label,
                    userName: user?.name,
                    email: user?.email,
                    travelDate: form.travelDate,
                  })}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all">
                  <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                </a>
                <p className="text-center text-xs text-gray-500 mt-3">Instant reply • Expert guidance • No spam</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
