import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          <div>
            <div className="mb-4 w-fit rounded-lg bg-white px-3 py-2">
              <div className="relative h-20 w-48">
                <Image src="/logo.svg" alt="Visayatri Visa Services" fill sizes="192px" className="object-contain" />
              </div>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">Fast & Trusted Visa Services by Shoib Tour and Travels. Apply online for 39+ countries with expert guidance.</p>
            <div className="mt-4 space-y-2">
              <a href="https://wa.me/919717743876" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">+91 97177 43876</span>
              </a>
              <a href="mailto:visa.stt5786@gmail.com" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" /> visa.stt5786@gmail.com
              </a>
              <div className="flex items-start gap-2 text-sm text-blue-200">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">C159 Opp. Fortis Escort Hospital, Sarai Jullena Okhla, New Delhi 110025</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              {['/', '/visa', '/auth/login', '/auth/register', '/dashboard/user'].map((href, i) => (
                <li key={i}><Link href={href} className="hover:text-white transition-colors">{['Home','All Visas','Login','Register','My Dashboard'][i]}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg">Popular Visas</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              {[['oman','🇴🇲 Oman'],['qatar','🇶🇦 Qatar'],['bahrain','🇧🇭 Bahrain'],['dubai','🇦🇪 Dubai'],['singapore','🇸🇬 Singapore']].map(([slug,label]) => (
                <li key={slug}><Link href={`/visa/${slug}`} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg">Company</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><a href="https://wa.me/919717743876" className="hover:text-white">Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg">For Partners</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/auth/register?role=agent" className="hover:text-white">Become an Agent</Link></li>
              <li><Link href="/dashboard/agent" className="hover:text-white">Agent Portal</Link></li>
              <li><a href="https://wa.me/919717743876" className="hover:text-white">WhatsApp Us</a></li>
            </ul>
            <div className="mt-6 p-3 bg-secondary/30 rounded-xl text-sm text-blue-100">
              <p className="font-semibold">📋 Documents Needed</p>
              <p>Passport copy + white background photo</p>
            </div>
          </div>
        </div>
        <div className="border-t border-blue-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-blue-300">
          <p>© 2025 Shoib Tour and Travels. All rights reserved.</p>
          <p>Made with ❤️ for travelers worldwide</p>
        </div>
      </div>
    </footer>
  );
}
