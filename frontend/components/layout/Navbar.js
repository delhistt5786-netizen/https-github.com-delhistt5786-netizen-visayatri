'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Globe, User, LogOut, LayoutDashboard } from 'lucide-react';
import { getUser, logout } from '../../lib/auth';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getUser());
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const dashPath = user?.role === 'admin' ? '/dashboard/admin' : user?.role === 'agent' ? '/dashboard/agent' : '/dashboard/user';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-primary">Visayatri</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/visa" className="text-gray-600 hover:text-primary font-medium transition-colors">Visas</Link>
            <Link href="/visa?region=middle-east" className="text-gray-600 hover:text-primary font-medium transition-colors">Middle East</Link>
            <Link href="/visa?region=asia" className="text-gray-600 hover:text-primary font-medium transition-colors">Asia</Link>
            <Link href="/visa?region=africa" className="text-gray-600 hover:text-primary font-medium transition-colors">Africa</Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href={dashPath} className="flex items-center gap-1 text-sm font-medium text-primary hover:text-secondary">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={logout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-primary">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <Link href="/visa" className="block text-gray-700 font-medium py-2" onClick={() => setOpen(false)}>All Visas</Link>
          <Link href="/visa?region=middle-east" className="block text-gray-700 py-2" onClick={() => setOpen(false)}>Middle East</Link>
          <Link href="/visa?region=asia" className="block text-gray-700 py-2" onClick={() => setOpen(false)}>Asia</Link>
          <Link href="/visa?region=africa" className="block text-gray-700 py-2" onClick={() => setOpen(false)}>Africa</Link>
          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <>
                <Link href={dashPath} className="block py-2 text-primary font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={logout} className="block py-2 text-red-500 w-full text-left">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block py-2 text-gray-700" onClick={() => setOpen(false)}>Login</Link>
                <Link href="/auth/register" className="btn-primary w-full justify-center mt-2" onClick={() => setOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
