'use client';
import { Shield, Lock, Eye, FileText, AlertCircle } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Shield,
      title: 'Information We Collect',
      content: `We collect the following types of information:
      
• Personal Information: Name, email, phone number, address, date of birth, nationality
• Travel Information: Passport details, visa history, travel dates, destinations
• Financial Information: Bank details, payment methods (processed securely via Razorpay)
• Document Information: Passport scans, photos, visa application documents
• Technical Information: IP address, browser type, device information, usage patterns`
    },
    {
      icon: Lock,
      title: 'How We Use Your Information',
      content: `Your information is used exclusively for:

• Processing visa applications and travel documentation
• Communicating with embassies and government agencies
• Providing customer support via WhatsApp, email, and phone
• Improving our services and user experience
• Sending updates about your application status
• Complying with legal and regulatory requirements
• Preventing fraud and ensuring platform security

We NEVER sell or share your data with unauthorized third parties.`
    },
    {
      icon: Eye,
      title: 'Data Security & Protection',
      content: `We implement multiple layers of security:

• SSL/TLS encryption for all data in transit
• AES-256 encryption for sensitive data at rest
• Regular security audits and penetration testing
• Role-based access control - only authorized staff access your data
• Secure password hashing with bcrypt
• Two-factor authentication available for user accounts
• GDPR and data protection law compliance

Our hosting providers (Vercel, Render, MongoDB Atlas) maintain industry-leading security standards.`
    },
    {
      icon: FileText,
      title: 'Your Rights & Data Control',
      content: `You have the following rights:

• Access: Request a copy of all data we hold about you
• Correction: Update or correct inaccurate information
• Deletion: Request deletion of your data (subject to legal obligations)
• Portability: Get your data in machine-readable format
• Withdraw Consent: Stop communications at any time
• Complaint: Lodge complaints with data protection authorities

To exercise these rights, contact us at visa.stt5786@gmail.com`
    },
    {
      icon: AlertCircle,
      title: 'Third-Party Services',
      content: `We use third-party services for specific functions:

• Razorpay: Payment processing (PCI-DSS compliant)
• WhatsApp: Communication with customers (end-to-end encrypted)
• MongoDB Atlas: Database hosting (encrypted backups)
• Google Analytics: Anonymized usage statistics
• Vercel/Render: Application hosting

These services have their own privacy policies. We only share data necessary for their functions.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#061f3b] via-[#0d3b66] to-[#0B3C5D]">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -mr-40"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -ml-40"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            Privacy <span className="text-gradient bg-gradient-to-r from-[#FF7A00] to-orange-400 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="text-xl text-blue-100">Last Updated: December 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Introduction */}
        <div className="soft-card">
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>Shoib Tour and Travels</strong> ("we", "us", "our") operates the Visayatri platform. We are committed to protecting your privacy and ensuring you have a positive experience on our platform.
          </p>
          <p className="text-gray-700 leading-relaxed">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully. If you do not agree with our policies and practices, please do not use our services.
          </p>
        </div>

        {/* Main Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const IconComponent = section.icon;
            return (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:border-[#FF7A00]/30 transition">
                <div className="bg-gradient-to-r from-[#FF7A00]/10 to-orange-500/10 px-6 py-4 border-b border-white/20 flex items-center gap-3">
                  <IconComponent className="w-6 h-6 text-[#FF7A00] flex-shrink-0" />
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <div className="p-6 text-blue-100 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cookies Section */}
        <div className="soft-card">
          <h2 className="text-2xl font-bold text-[#0B3C5D] mb-4">🍪 Cookies & Tracking</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              We use cookies to enhance your browsing experience. Cookies are small files stored on your device that help us:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• Remember your login credentials and preferences</li>
              <li>• Track site usage and improve functionality</li>
              <li>• Deliver personalized content</li>
              <li>• Analyze traffic patterns</li>
            </ul>
            <p className="mt-4">
              You can control cookie settings in your browser. Disabling cookies may affect your ability to use certain features.
            </p>
          </div>
        </div>

        {/* Children's Privacy */}
        <div className="soft-card">
          <h2 className="text-2xl font-bold text-[#0B3C5D] mb-4">👶 Children's Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            Our platform is not directed toward children under 18. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected information from a child under 18, we will promptly delete such information and terminate the child's account.
          </p>
        </div>

        {/* Data Retention */}
        <div className="soft-card">
          <h2 className="text-2xl font-bold text-[#0B3C5D] mb-4">⏰ Data Retention</h2>
          <div className="space-y-3 text-gray-700">
            <p>We retain your personal data for:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>Active Users:</strong> Entire duration of account + 1 year after deletion</li>
              <li>• <strong>Application Records:</strong> 7 years (required by immigration law)</li>
              <li>• <strong>Financial Records:</strong> 7 years (tax compliance)</li>
              <li>• <strong>Support Logs:</strong> 2 years (customer service)</li>
            </ul>
            <p className="mt-4">After retention periods, data is securely deleted or anonymized.</p>
          </div>
        </div>

        {/* International Data Transfer */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">🌍 International Data Transfer</h2>
          <p className="text-blue-100">
            Your information may be transferred to, stored in, and processed in countries other than your country of residence (including India, USA, and EU). These countries may have data protection laws different from your home country. By using our services, you consent to such transfer.
          </p>
        </div>

        {/* Contact & Rights */}
        <div className="soft-card">
          <h2 className="text-2xl font-bold text-[#0B3C5D] mb-4">📧 Contact Us About Privacy</h2>
          <div className="space-y-3 text-gray-700">
            <p>If you have privacy questions or wish to exercise your rights:</p>
            <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-lg p-4 space-y-2 mt-4">
              <p><strong>Email:</strong> <a href="mailto:visa.stt5786@gmail.com" className="text-[#FF7A00] hover:underline">visa.stt5786@gmail.com</a></p>
              <p><strong>WhatsApp:</strong> <a href="https://wa.me/919717743876" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">+91 97177 43876</a></p>
              <p><strong>Company:</strong> Shoib Tour and Travels</p>
            </div>
          </div>
        </div>

        {/* Policy Updates */}
        <div className="bg-blue-50/10 border border-blue-200/30 rounded-lg p-6">
          <p className="text-blue-100 text-sm">
            <strong>Note:</strong> We may update this Privacy Policy from time to time. The "Last Updated" date at the top indicates when this policy was last modified. Your continued use of the platform after changes constitutes acceptance of the updated policy.
          </p>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/about" className="text-[#FF7A00] hover:underline">About Us</a>
            <span className="text-white/30">•</span>
            <a href="/contact" className="text-[#FF7A00] hover:underline">Contact Us</a>
            <span className="text-white/30">•</span>
            <a href="/" className="text-[#FF7A00] hover:underline">Home</a>
          </div>
          <p className="text-blue-200 text-sm">
            © 2024 Shoib Tour and Travels. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
