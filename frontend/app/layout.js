import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import WhatsAppButton from '../components/ui/WhatsAppButton'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Visayatri — Fast & Trusted Visa Services',
  description: 'Apply for visa to 39+ countries in minutes. Expert guidance, fast approvals, best prices.',
  keywords: 'visa services, e-visa, india, travel visa, visa apply online',
  openGraph: {
    title: 'Visayatri — Fast & Trusted Visa Services',
    description: 'Apply for visa to 39+ countries in minutes',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  )
}
