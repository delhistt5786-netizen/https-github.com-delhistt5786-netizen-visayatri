'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  MessageCircle,
  Clock3,
  ShieldCheck,
  Star,
  ChevronRight,
  CheckCircle2,
  Plane,
  Sparkles,
  Globe2,
  CreditCard,
  FileText,
  Zap,
  BadgeCheck,
  Users,
} from 'lucide-react';
import { visaAPI } from '../lib/api';
import { waGeneral } from '../lib/whatsapp';
import { getUser, dashboardPath } from '../lib/auth';
import VisaCard from '../components/visa/VisaCard';
import LoginBox from '../components/layout/LoginBox';

const POPULAR_SLUGS = ['dubai', 'oman', 'qatar', 'bahrain', 'jordan', 'egypt', 'vietnam', 'singapore', 'sri-lanka', 'malaysia'];

const BENEFITS = [
  { icon: ShieldCheck, title: 'Secure & trusted', desc: 'Protected payment flow with expert visa guidance from start to finish.' },
  { icon: Clock3, title: 'Fast processing', desc: 'Priority review for common destinations with updates at every milestone.' },
  { icon: FileText, title: 'Simple paperwork', desc: 'Clear document checklist and support to avoid unnecessary delays.' },
  { icon: CreditCard, title: 'Transparent pricing', desc: 'No hidden fees, clear visa charges, and flexible payment options.' },
];

const COUNTRIES = [
  ['UAE', 'dubai'], ['Qatar', 'qatar'], ['Bahrain', 'bahrain'], ['Saudi', 'saudi-arabia'],
  ['Singapore', 'singapore'], ['Thailand', 'thailand'], ['Vietnam', 'vietnam'], ['Malaysia', 'malaysia'], ['Oman', 'oman'],
];

const STATS = [
  { value: '39+', label: 'countries' },
  { value: '24-72h', label: 'avg. turnaround' },
  { value: '10K+', label: 'happy travelers' },
  { value: '4.9/5', label: 'customer rating' },
];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [visas, setVisas] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  useEffect(() => {
    visaAPI.getAll()
      .then((r) => {
        const all = r.data.data || [];
        setVisas(all);
        setPopular(all.filter((v) => POPULAR_SLUGS.includes(v.slug)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Rotate the "Popular destination" card through the popular list so the
  // eligibility link always points at whichever country is on screen —
  // paused on hover so it doesn't jump away mid-read/mid-click.
  useEffect(() => {
    if (popular.length < 2 || heroPaused) return;
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % popular.length), 4500);
    return () => clearInterval(id);
  }, [popular.length, heroPaused]);

  const filtered = search.length > 1 ? visas.filter((v) => v.country.toLowerCase().includes(search.toLowerCase())) : [];

  const heroVisa = popular[heroIndex % (popular.length || 1)] || visas.find((v) => v.slug === 'dubai');
  const heroCheapest = (heroVisa?.plans || [])
    .filter((p) => !p.isContactUs && (p.price || p.publicPrice) > 0)
    .sort((a, b) => (a.price || a.publicPrice) - (b.price || b.publicPrice))[0];

  return (
    <div className="pt-16">
      <section className="relative overflow-hidden bg-[#061f3b] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,0,0.25),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(50,130,184,0.35),_transparent_25%)]" />
        <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute right-8 bottom-8 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="glass-pill mb-6 inline-flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Trusted by 10,000+ travelers across India
              </div>

              {/* Login box — shown here (above the fold) on narrower screens where
                  the two-column layout below hasn't kicked in yet; hidden at lg+
                  since it already renders in the right column there. */}
              <div className="mb-6 max-w-xs lg:hidden">
                {user ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-sky-100">Welcome back, <span className="font-bold text-white">{user.name}</span></p>
                    <Link href={dashboardPath(user.role)} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
                      Dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <LoginBox onSuccess={setUser} compact />
                )}
              </div>

              <h1 className="max-w-xl text-4xl font-black tracking-[-0.06em] text-white md:text-6xl">
                Fast visa approvals
                <span className="mt-2 block text-orange-400">without the stress.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-sky-100">
                Apply for global visas with expert support, quick processing, and transparent pricing for every destination.
              </p>

              <div className="relative mt-8 max-w-xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search visa country"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country — Oman, Qatar, Dubai..."
                  className="w-full rounded-2xl border border-white/10 bg-white/95 px-12 py-4 text-base text-slate-900 shadow-2xl outline-none ring-0 placeholder:text-slate-400 focus:border-orange-400"
                />

                {filtered.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {filtered.slice(0, 5).map((v) => (
                      <Link key={v._id} href={`/visa/${v.slug}`} className="flex items-center gap-3 px-4 py-3 text-slate-800 transition hover:bg-slate-50">
                        <span className="text-2xl">{v.flag}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{v.country}</p>
                          <p className="text-xs text-slate-500">From ₹{(v.plans || []).find((p) => !p.isContactUs && (p.price || p.publicPrice))?.price || 'Contact'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/visa" className="btn-primary text-base">
                  Explore visas <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href={waGeneral()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-green-500 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-green-600"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp now
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-sky-100">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-orange-400" /> 100% digital process</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-orange-400" /> Document support included</span>
              </div>
            </div>

            <div className="relative">
              {/* Width intentionally matches the floating-card below (no max-w
                  cap) so the two right-column boxes align edge-to-edge instead
                  of the login box looking undersized next to a wider card.
                  No space-y here — the floating card's own mt-8 plus the
                  "24/7" badge's -top-5 poke need the full, unconflicting gap
                  below the login box, or the badge overlaps into it. */}
              <div className="hidden lg:block">
                {user ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-sky-100">Welcome back, <span className="font-bold text-white">{user.name}</span></p>
                    <Link href={dashboardPath(user.role)} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
                      Dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <LoginBox onSuccess={setUser} compact />
                )}
              </div>

              <div className="relative mt-8">
              <div className="floating-card p-5" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)}>
                <div key={heroVisa?.slug || 'dubai'} className="animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Popular destination</p>
                      <h2 className="mt-2 text-2xl font-bold text-white">{heroVisa?.country || 'UAE'} Visa</h2>
                    </div>
                    <div className="rounded-2xl bg-orange-500/20 p-2.5 text-2xl">{heroVisa?.flag || '🇦🇪'}</div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {[
                      ['Processing time', heroVisa?.processingTime || '24-48 hrs'],
                      ['Travel window', heroCheapest?.label || '30 days'],
                      ['Starting from', heroCheapest ? `₹${(heroCheapest.price || heroCheapest.publicPrice).toLocaleString('en-IN')}` : 'Loading…'],
                    ].map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
                        <span className="text-sky-100">{key}</span>
                        <span className="font-semibold text-white">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Link href={`/visa/${heroVisa?.slug || 'dubai'}`} className="btn-primary flex-1 justify-center">Check eligibility</Link>
                    <a href={waGeneral()} className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {popular.length > 1 && (
                  <div className="mt-4 flex justify-center gap-1.5">
                    {popular.map((v, i) => (
                      <button key={v.slug} type="button" onClick={() => setHeroIndex(i)}
                        aria-label={`Show ${v.country}`}
                        className={`h-1.5 rounded-full transition-all ${i === heroIndex % popular.length ? 'w-5 bg-orange-400' : 'w-1.5 bg-white/25 hover:bg-white/40'}`} />
                    ))}
                  </div>
                )}
              </div>

              <div className="absolute -left-5 -top-5 hidden rounded-2xl border border-white/10 bg-sky-500/15 px-4 py-3 shadow-xl backdrop-blur md:block">
                <div className="flex items-center gap-2 text-sm text-white">
                  <BadgeCheck className="h-4 w-4 text-orange-400" />
                  Visa experts available 24/7
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="text-3xl font-black text-orange-400">{item.value}</div>
                <div className="mt-1 text-sm text-sky-100">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-600 sm:gap-8">
            {COUNTRIES.map(([country, slug]) => (
              <Link key={country} href={`/visa/${slug}`} className="country-pill transition hover:bg-orange-100 hover:text-orange-700">{country}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Why choose us</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl">Trusted support for smoother travel plans</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="soft-card p-6">
                <div className="mb-5 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Most applied</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl">Popular visa destinations</h2>
            </div>
            <Link href="/visa" className="inline-flex items-center gap-2 text-base font-semibold text-sky-700 transition hover:text-sky-900">
              View all countries <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-60 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {popular.map((v) => (
                <VisaCard key={v._id} visa={v} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">How it works</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl">Three simple steps to your visa</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Tell us where you are going', desc: 'Share your destination and travel dates in under 2 minutes.', icon: Plane },
              { step: '02', title: 'Upload your documents', desc: 'Add your passport, photo, and travel details with guided support.', icon: FileText },
              { step: '03', title: 'Get approval and travel', desc: 'Receive updates, pay online, and get your visa confirmation securely.', icon: Zap },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="soft-card relative p-6 text-left">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Step {step}</div>
                <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#061f3b] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">Traveler feedback</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] md:text-5xl">Loved by people planning international trips</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { name: 'Rahul S.', country: 'Oman', quote: 'The process was incredibly smooth and transparent. I had my visa approved in less than 48 hours.' },
              { name: 'Pooja M.', country: 'Qatar', quote: 'Very professional team and clear pricing. I loved the support from the WhatsApp team throughout the journey.' },
              { name: 'Amit K.', country: 'Bahrain', quote: 'The application felt premium and easy. Everything was well-guided and stress-free from start to finish.' },
            ].map(({ name, country, quote }) => (
              <div key={name} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-base leading-8 text-slate-200">“{quote}”</p>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <div className="font-bold text-white">{name}</div>
                    <div className="text-sm text-sky-200">{country} Visa</div>
                  </div>
                  <div className="rounded-full bg-orange-500/20 p-2 text-orange-300">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-orange-500 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-100">Ready to travel?</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">Start your visa application in minutes.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-orange-50">
            From visas to expert guidance, we make global travel simple, secure, and stress-free.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/visa" className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-bold text-orange-600 transition hover:bg-orange-50">
              Browse visas <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href={waGeneral()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-green-500 px-8 py-4 text-base font-bold text-white transition hover:bg-green-600"
            >
              <MessageCircle className="h-5 w-5" />
              Apply on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
