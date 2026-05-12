import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Holicindo Unit Passport Portal',
  description: 'Industrial-Chic Unit Passport Portal for Holicindo.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${montserrat.variable}`}>
      <body style={{ display: 'flex', margin: 0, padding: 0 }}>
        <Sidebar />
        <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin 0.3s ease' }}>
          <TopBar />
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
