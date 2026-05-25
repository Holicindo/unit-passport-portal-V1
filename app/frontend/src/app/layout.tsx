import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper'

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

export const metadata = {
  title: 'Holicindo Unit Passport Portal',
  description: 'Sistem Pemantauan Unit & Diagnostik Pemeliharaan Terpadu',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${montserrat.variable}`}>
      <body style={{ display: 'flex', margin: 0, padding: 0, background: 'var(--color-light-tech-grey)' }}>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}

