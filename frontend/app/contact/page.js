'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send, Clock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In production, this would send to backend email service
      // await fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) })
      
      // Mock success
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#061f3b] via-[#0d3b66] to-[#0B3C5D]">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -mr-40"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -ml-40"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            Get in <span className="text-gradient bg-gradient-to-r from-[#FF7A00] to-orange-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-blue-100">We're here to help! Reach out to Shoib Tour and Travels anytime.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Phone */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="w-6 h-6 text-[#FF7A00]" />
                <h3 className="text-lg font-bold text-white">Call Us</h3>
              </div>
              <p className="text-blue-100 font-semibold">+91 91295 94282</p>
              <p className="text-blue-200 text-sm mt-1">Mon-Sun, 9 AM - 10 PM</p>
            </div>

            {/* Email */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-6 h-6 text-[#FF7A00]" />
                <h3 className="text-lg font-bold text-white">Email</h3>
              </div>
              <p className="text-blue-100 font-semibold break-all">visa.stt5786@gmail.com</p>
              <p className="text-blue-200 text-sm mt-1">Response within 2 hours</p>
            </div>

            {/* WhatsApp */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="w-6 h-6 text-[#FF7A00]" />
                <h3 className="text-lg font-bold text-white">WhatsApp</h3>
              </div>
              <p className="text-blue-100 font-semibold">+91 91295 94282</p>
              <p className="text-blue-200 text-sm mt-1">Chat anytime, 24/7</p>
              <a 
                href="https://wa.me/919129594282?text=Hi%20Shoib%20Tour%20and%20Travels" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition text-sm"
              >
                Start Chat
              </a>
            </div>

            {/* Office Hours */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-[#FF7A00]" />
                <h3 className="text-lg font-bold text-white">Office Hours</h3>
              </div>
              <div className="space-y-2 text-blue-100 text-sm">
                <p><span className="font-semibold">Mon-Fri:</span> 9 AM - 9 PM</p>
                <p><span className="font-semibold">Sat-Sun:</span> 10 AM - 8 PM</p>
                <p><span className="font-semibold">Holidays:</span> Available 24/7</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="soft-card p-8">
              <h2 className="text-2xl font-bold text-[#0B3C5D] mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 outline-none transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 outline-none transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 outline-none transition"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 outline-none transition"
                  >
                    <option value="">Select a subject</option>
                    <option value="visa_inquiry">Visa Inquiry</option>
                    <option value="general_question">General Question</option>
                    <option value="support">Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help you..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 outline-none transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#FF7A00] to-orange-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin">⌛</div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-600 text-center">
                  We'll get back to you within 24 hours.
                </p>
              </form>
            </div>

            {/* Quick FAQ */}
            <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {[
                  {
                    q: 'How quickly can I get a visa?',
                    a: 'Most visas are processed within 5-14 days. Some countries offer express services in 24-48 hours.'
                  },
                  {
                    q: 'Is my document information secure?',
                    a: 'Yes! We use enterprise-level encryption and NEVER share your data with third parties.'
                  },
                  {
                    q: 'Do you offer refunds?',
                    a: 'If your visa is rejected, we offer a full refund of our service charges (embassy fees are non-refundable).'
                  },
                  {
                    q: 'Can agents apply on behalf of clients?',
                    a: 'Yes! Agents can use their agent account to apply for multiple clients and track commissions.'
                  }
                ].map((item, idx) => (
                  <div key={idx}>
                    <p className="font-semibold text-white mb-1">{item.q}</p>
                    <p className="text-blue-100 text-sm">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
