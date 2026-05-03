'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { visaAPI } from '../../lib/api';
import VisaCard from '../../components/visa/VisaCard';
import Loading from '../../components/ui/Loading';

const REGIONS = [
  { value: '', label: 'All Regions' },
  { value: 'middle-east', label: '🌙 Middle East' },
  { value: 'asia', label: '🌏 Asia' },
  { value: 'africa', label: '🌍 Africa' },
  { value: 'europe', label: '🇪🇺 Europe' },
  { value: 'others', label: '🌐 Others' },
];

function VisaListContent() {
  const params = useSearchParams();
  const [visas, setVisas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState(params.get('region') || '');

  useEffect(() => {
    setLoading(true);
    visaAPI.getAll({ region: region || undefined }).then(r => {
      setVisas(r.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [region]);

  const filtered = visas.filter(v => !search || v.country.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">All E-Visa Services</h1>
          <p className="text-blue-200 text-lg">Apply online for {visas.length}+ countries — Fast, Easy, Transparent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search country..." className="input-field pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {REGIONS.map(r => (
              <button key={r.value} onClick={() => setRegion(r.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${region === r.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? <Loading text="Loading visas..." /> : (
          <>
            <p className="text-sm text-gray-500 mb-6">{filtered.length} visas found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(v => <VisaCard key={v._id} visa={v} />)}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-500 text-lg">No visas found for "{search}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VisaListPage() {
  return <Suspense fallback={<Loading />}><VisaListContent /></Suspense>;
}
