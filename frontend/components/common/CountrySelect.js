'use client';
import { useState, useEffect, useMemo } from 'react';
import { countryAPI } from '../../lib/api';

/**
 * CountrySelect
 *
 * Searchable country dropdown backed by GET /api/countries, replacing free-text
 * country inputs across the apply form and admin visa modal.
 */
export default function CountrySelect({ value, onChange, placeholder = 'Select country', required = false, className = '' }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    countryAPI.getAll().then(res => {
      setCountries(res.data?.data || res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries]
  );

  return (
    <select
      value={value || ''}
      onChange={(e) => {
        const country = sorted.find(c => c.name === e.target.value);
        onChange(e.target.value, country);
      }}
      required={required}
      disabled={loading}
      className={className || 'input-field text-sm w-full'}
    >
      <option value="">{loading ? 'Loading countries…' : placeholder}</option>
      {sorted.map((c) => (
        <option key={c._id} value={c.name}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>
      ))}
    </select>
  );
}
