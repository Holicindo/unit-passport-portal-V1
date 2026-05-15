'use client';

import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { usePathname } from 'next/navigation'

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

import { useState } from 'react'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <html lang="id" className={`${inter.variable} ${montserrat.variable}`}>
      <body style={{ display: 'flex', margin: 0, padding: 0, background: 'var(--color-light-tech-grey)' }}>
        {!isLoginPage && <Sidebar isOpen={sidebarOpen} />}
        <div 
          className={`${!isLoginPage ? "main-wrapper" : ""} ${!sidebarOpen && !isLoginPage ? "sidebar-collapsed" : ""}`} 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            maxWidth: '100vw',
            overflowX: 'hidden'
          }}
        >
          {!isLoginPage && <TopBar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />}
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
