'use client';
import { MapPin, Phone, Mail, MessageCircle, Globe, Award, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#061f3b] via-[#0d3b66] to-[#0B3C5D]">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -mr-40"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -ml-40"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            About <span className="text-gradient bg-gradient-to-r from-[#FF7A00] to-orange-400 bg-clip-text text-transparent">Shoib Tour and Travels</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Your trusted partner in seamless visa processing and travel documentation
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Our Story */}
        <section className="soft-card">
          <h2 className="text-3xl font-bold text-[#0B3C5D] mb-6 flex items-center gap-3">
            <Globe className="w-8 h-8 text-[#FF7A00]" />
            Our Story
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Shoib Tour and Travels was founded with a simple mission: to make international travel accessible and hassle-free for everyone. With over 10 years of experience in the travel and visa industry, we've successfully processed thousands of visa applications and guided travelers to their dream destinations.
            </p>
            <p>
              Based on our expertise and passion for travel, we created <strong>Visayatri</strong> — a modern platform that combines technology with personalized service to streamline the entire visa application process.
            </p>
            <p>
              Today, we serve travelers, tour operators, and immigration agents across India, offering fast, reliable, and transparent visa services backed by a dedicated team of experts.
            </p>
          </div>
        </section>

        {/* Why Choose Us */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Award,
                title: 'Expert Team',
                description: '10+ years of visa processing experience with 99.2% success rate'
              },
              {
                icon: MessageCircle,
                title: '24/7 Support',
                description: 'WhatsApp support available around the clock for your questions'
              },
              {
                icon: Shield,
                title: 'Secure Process',
                description: 'Your documents and personal data are 100% secure and confidential'
              },
              {
                icon: Globe,
                title: '39+ Countries',
                description: 'Visa services for 39+ countries with customized solutions'
              }
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-[#FF7A00]/50 transition">
                  <IconComponent className="w-10 h-10 text-[#FF7A00] mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-blue-100 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Our Services */}
        <section className="soft-card">
          <h2 className="text-3xl font-bold text-[#0B3C5D] mb-6">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Tourist Visa Processing',
              'Business Visa Assistance',
              'Student Visa Guidance',
              'Work Permit Processing',
              'Transit Visa Services',
              'Family Visit Visas',
              'Document Verification',
              'Embassy Liaison Services',
              'Visa Renewal Support',
              'Travel Insurance',
              'Hotel Booking Assistance',
              'Travel Consultation'
            ].map((service, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-[#FF7A00] font-bold text-lg mt-0.5">✓</span>
                <p className="text-gray-700 font-semibold">{service}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Shoib Ahmed',
                role: 'Founder & Director',
                expertise: '15+ years in visa & travel industry',
                image: '👨‍💼'
              },
              {
                name: 'Professional Team',
                role: 'Visa Consultants & Experts',
                expertise: 'Specialized in 39+ countries\' visa processes',
                image: '👥'
              }
            ].map((member, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-[#FF7A00] font-semibold mb-2">{member.role}</p>
                <p className="text-blue-100 text-sm">{member.expertise}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-[#FF7A00]/20 to-orange-500/10 rounded-3xl border border-[#FF7A00]/30 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Let Shoib Tour and Travels help you get your visa approved quickly and easily.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/visa" className="px-8 py-4 bg-gradient-to-r from-[#FF7A00] to-orange-500 text-white rounded-lg font-bold hover:from-orange-600 hover:to-orange-600 transition inline-block">
              Browse Visas
            </Link>
            <a href="https://wa.me/919129594282?text=Hi%20Shoib%20Tour%20and%20Travels" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition inline-block flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contact on WhatsApp
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
