'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, MessageCircle, Clock, Shield, Star, ChevronRight, CheckCircle } from 'lucide-react';
import { visaAPI } from '../lib/api';
import { waGeneral } from '../lib/whatsapp';
import VisaCard from '../components/visa/VisaCard';

const POPULAR_SLUGS = ['oman','qatar','bahrain','jordan','egypt','india','vietnam','singapore','sri-lanka','malaysia'];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [visas, setVisas] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    visaAPI.getAll().then(r => {
      const all = r.data.data;
      setVisas(all);
      setPopular(all.filter(v => POPULAR_SLUGS.includes(v.slug)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = search.length > 1 ? visas.filter(v => v.country.toLowerCase().includes(search.toLowerCase())) : [];

  return (
    <div className="pt-16">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-primary via-secondary to-blue-800 text-white overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cta rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 text-sm mb-8">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Trusted by 10,000+ travelers across India</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Apply Visa<br /><span className="text-cta">in Minutes</span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Fast & Trusted E-Visa services for 39+ countries. Expert guidance, quick approvals, best prices.
            </p>

            {/* Search */}
            <div className="relative mb-8 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search country — Oman, Qatar, Dubai..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-cta/50 shadow-xl"
              />
              {filtered.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl z-20 overflow-hidden">
                  {filtered.slice(0,6).map(v => (
                    <Link key={v._id} href={`/visa/${v.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-900">
                      <span className="text-2xl">{v.flag}</span>
                      <div>
                        <p className="font-semibold">{v.country}</p>
                        <p className="text-xs text-gray-500">From ₹{v.pricing?.find(p=>p.price>0)?.price?.toLocaleString() || 'Contact'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/visa" className="btn-primary text-base">
                View All Visas <ArrowRight className="w-5 h-5" />
              </Link>
              <a href={waGeneral()} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all text-base">
                <MessageCircle className="w-5 h-5" /> Apply via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Floating stats */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-4">
          {[['39+','Countries'],['24hr','Fast Approval'],['₹700','Starting from'],['10K+','Happy Travelers']].map(([num,label]) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
              <p className="text-2xl font-extrabold text-cta">{num}</p>
              <p className="text-xs text-blue-200">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-white border-b border-gray-100 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-sm text-gray-600">
            {[['🛡️','Secure & Safe'],['⚡','Fast Processing'],['🎯','Expert Guidance'],['💬','24/7 WhatsApp Support'],['📄','Transparent Pricing']].map(([icon,text]) => (
              <div key={text} className="flex items-center gap-2 font-medium">
                <span className="text-xl">{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-cta font-semibold text-sm uppercase tracking-wider">Simple Process</span>
            <h2 className="text-4xl font-extrabold text-primary mt-2">Get Your Visa in 3 Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📝', title: 'Apply Online', desc: 'Fill a simple form with your travel details. Takes less than 3 minutes.' },
              { step: '02', icon: '📤', title: 'Upload Documents', desc: 'Submit passport copy & white background photo. We guide you through each step.' },
              { step: '03', icon: '✅', title: 'Get Your Visa', desc: 'Receive your e-visa via email. Track status anytime via WhatsApp.' },
            ].map((s, i) => (
              <div key={i} className="relative text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-cta text-white rounded-full flex items-center justify-center text-sm font-bold">{s.step}</div>
                <div className="text-5xl mb-4 mt-2">{s.icon}</div>
                <h3 className="text-xl font-bold text-primary mb-3">{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR VISAS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-cta font-semibold text-sm uppercase tracking-wider">Most Applied</span>
              <h2 className="text-4xl font-extrabold text-primary mt-2">Popular Visa Destinations</h2>
            </div>
            <Link href="/visa" className="text-secondary font-semibold hover:text-primary flex items-center gap-1">
              View all 39+ countries <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_,i) => <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popular.map(v => <VisaCard key={v._id} visa={v} />)}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold">Loved by Travelers</h2>
            <p className="text-blue-200 mt-3">See what our customers say about us</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name:'Rahul Sharma', city:'Delhi', visa:'Oman Visa', text:'Got my Oman visa in just 2 days! Super smooth process. Visayatri team guided me through WhatsApp at every step.', rating:5 },
              { name:'Priya Verma', city:'Mumbai', visa:'Qatar Visa', text:'Excellent service! Very transparent pricing and fast approval. Got my Qatar visa at just ₹1000. Highly recommend!', rating:5 },
              { name:'Amit Singh', city:'Jaipur', visa:'Bahrain Visa', text:'Applied for 1 year multi-entry Bahrain visa. The team was very professional and helpful. Will definitely use again!', rating:5 },
            ].map((t,i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <div className="flex text-yellow-400 text-sm mb-3">{'★'.repeat(t.rating)}</div>
                <p className="text-blue-100 italic mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-blue-200 text-sm">{t.city} · {t.visa}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-cta">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to Travel?</h2>
          <p className="text-orange-100 text-lg mb-10">Apply for your visa now and get approved in 24–72 hours.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/visa" className="bg-white text-cta px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all">
              Browse Visas →
            </Link>
            <a href={waGeneral()} target="_blank" rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> WhatsApp Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
