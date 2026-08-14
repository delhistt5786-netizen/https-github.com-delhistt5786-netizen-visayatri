'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User, LogOut, LayoutDashboard, History } from 'lucide-react';
import { getUser, logout, onAuthChange } from '../../lib/auth';
import { appAPI, uploadsOrigin } from '../../lib/api';
import LoginBox from './LoginBox';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showLoginBox, setShowLoginBox] = useState(false);

  const syncUser = () => {
    const u = getUser();
    setUser(u);
    if (u) {
      appAPI.getMyAvatar().then(res => {
        if (res.data?.avatarUrl) setAvatarUrl(`${uploadsOrigin}${res.data.avatarUrl}`);
      }).catch(() => {});
    } else {
      setAvatarUrl(null);
    }
  };

  useEffect(() => {
    syncUser();
    const unsubscribe = onAuthChange(syncUser);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { unsubscribe(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const dashPath = user?.role === 'admin' ? '/dashboard/admin' : user?.role === 'agent' ? '/dashboard/agent' : '/dashboard/user';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex h-16 items-center hover:opacity-90 transition-opacity">
            <div className="relative h-14 w-36 sm:w-40">
              <Image src="/logo.svg" alt="Visayatri Visa Services" fill priority sizes="(max-width: 640px) 144px, 160px" className="object-contain" />
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/visa" className="text-gray-600 hover:text-primary font-medium transition-colors">Visas</Link>
            <Link href="/visa?region=middle-east" className="text-gray-600 hover:text-primary font-medium transition-colors">Middle East</Link>
            <Link href="/visa?region=asia" className="text-gray-600 hover:text-primary font-medium transition-colors">Asia</Link>
            <Link href="/about" className="text-gray-600 hover:text-primary font-medium transition-colors">About</Link>
            <Link href="/contact" className="text-gray-600 hover:text-primary font-medium transition-colors">Contact</Link>
            <Link href="/history" className="flex items-center gap-1 text-gray-600 hover:text-primary font-medium transition-colors"><History className="h-4 w-4" /> History</Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} title={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-orange-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center" title={user.name}>
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <Link href={dashPath} className="flex items-center gap-1 text-sm font-medium text-primary hover:text-secondary">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={logout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="relative flex items-center gap-3">
                <button onClick={() => setShowLoginBox(v => !v)}
                  className="text-sm font-medium text-gray-600 hover:text-primary">Login</button>
                <Link href="/auth/register" className="btn-primary text-sm py-2">Get Started</Link>

                {showLoginBox && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLoginBox(false)}></div>
                    <div className="absolute right-0 top-full mt-3 z-50 w-96 max-w-[90vw]">
                      <LoginBox onClose={() => setShowLoginBox(false)} onSuccess={u => { setUser(u); setShowLoginBox(false); }} />
                    </div>
                  </>
                )}
              </div>
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
          <Link href="/about" className="block text-gray-700 py-2" onClick={() => setOpen(false)}>About Us</Link>
          <Link href="/contact" className="block text-gray-700 py-2" onClick={() => setOpen(false)}>Contact</Link>
          <Link href="/history" className="flex items-center gap-2 py-2 text-gray-700" onClick={() => setOpen(false)}><History className="h-4 w-4" /> Conversation history</Link>
          <Link href="/privacy" className="block text-gray-700 py-2 text-sm" onClick={() => setOpen(false)}>Privacy Policy</Link>
          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <>
                <div className="flex items-center gap-2 py-2">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border-2 border-orange-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                </div>
                <Link href={dashPath} className="block py-2 text-primary font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={logout} className="block py-2 text-red-500 w-full text-left">Logout</button>
              </>
            ) : showLoginBox ? (
              <div className="py-2">
                <LoginBox onClose={() => setShowLoginBox(false)} onSuccess={u => { setUser(u); setShowLoginBox(false); setOpen(false); }} />
              </div>
            ) : (
              <>
                <button onClick={() => setShowLoginBox(true)} className="block py-2 text-gray-700 w-full text-left">Login</button>
                <Link href="/auth/register" className="btn-primary w-full justify-center mt-2" onClick={() => setOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
