'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ChevronDown, ArrowRight, ShieldCheck, Star, Clock3, Users2 } from 'lucide-react';
import { visaAPI } from '../../lib/api';
import VisaCard from '../../components/visa/VisaCard';
import Loading from '../../components/ui/Loading';

const REGIONS = [
  { value: '', label: 'All Regions', icon: '🌐' },
  { value: 'middle-east', label: 'Middle East', icon: '🌙' },
  { value: 'asia', label: 'Asia', icon: '🌏' },
  { value: 'africa', label: 'Africa', icon: '🌍' },
  { value: 'europe', label: 'Europe', icon: '🇪🇺' },
  { value: 'others', label: 'Others', icon: '🌎' },
];

const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '0-1000', label: '₹0 - ₹1,000' },
  { value: '1000-5000', label: '₹1,000 - ₹5,000' },
  { value: '5000-plus', label: '₹5,000+' },
];

function VisaListContent() {
  const params = useSearchParams();
  const [visas, setVisas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState(params.get('region') || '');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    setLoading(true);
    visaAPI.getAll({ region: region || undefined }).then((r) => {
      setVisas(r.data.data || []);
      setLoading(false);
    }).catch((err) => {
      console.error('Visa API Error:', err);
      setLoading(false);
    });
  }, [region]);

  const minPriceOf = (v) => {
    const prices = (v.plans || [])
      .filter((p) => !p.isContactUs && (p.price || p.publicPrice))
      .map((p) => p.price || p.publicPrice);
    return prices.length ? Math.min(...prices) : Infinity;
  };
  const minDaysOf = (v) => {
    const match = (v.processingTime || '').match(/\d+/);
    return match ? Number(match[0]) : Infinity;
  };

  const filtered = visas
    .filter((v) => !search || v.country.toLowerCase().includes(search.toLowerCase()))
    .filter((v) => {
      if (!priceRange) return true;
      const minPrice = minPriceOf(v);
      if (!Number.isFinite(minPrice)) return false;
      if (priceRange === '0-1000') return minPrice <= 1000;
      if (priceRange === '1000-5000') return minPrice > 1000 && minPrice <= 5000;
      if (priceRange === '5000-plus') return minPrice > 5000;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return minPriceOf(a) - minPriceOf(b);
      if (sortBy === 'price-high') return minPriceOf(b) - minPriceOf(a);
      if (sortBy === 'fastest') return minDaysOf(a) - minDaysOf(b);
      if (sortBy === 'risk-free') return (b.isRiskFree ? 1 : 0) - (a.isRiskFree ? 1 : 0);
      return 0;
    });

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#061f3b] to-[#0d3b66] text-white py-20 md:py-28">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-500/30 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-sky-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black tracking-[-0.06em] md:text-6xl">
            Explore visas for {visas.length}+ countries
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-sky-100">
            Fast processing, transparent pricing, and expert support for every destination worldwide.
          </p>

          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { icon: Star, label: '4.9/5 rating', sub: '12,000+ reviews' },
              { icon: Users2, label: '50,000+ travelers', sub: 'visas processed' },
              { icon: Clock3, label: 'Fast turnaround', sub: 'as fast as 24 hrs' },
              { icon: ShieldCheck, label: 'Money-back guarantee', sub: 'on rejection' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md">
                <Icon className="h-5 w-5 flex-shrink-0 text-orange-300" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white sm:text-sm">{label}</p>
                  <p className="truncate text-[11px] text-sky-200">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by country name..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRegion(r.value)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    region === r.value
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="mr-1.5">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Visa Destinations</h2>
            <p className="mt-1 text-sm text-slate-600">
              {filtered.length} destination{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative inline-block">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="appearance-none cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 pr-10 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {PRICE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 pr-10 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Sort: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="fastest">Fastest Processing</option>
                <option value="risk-free">Risk-Free First</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((v) => (
              <VisaCard key={v._id} visa={v} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 py-20 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-2xl font-bold text-slate-900">No visas found</h3>
            <p className="mt-2 text-slate-600">
              Try adjusting your filters or search for a different country.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setRegion('');
                setPriceRange('');
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Reset filters <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisaListPage() {
  return <Suspense fallback={<Loading />}><VisaListContent /></Suspense>;
}
