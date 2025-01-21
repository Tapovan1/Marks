
import './globals.css'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'School Mark Management',
  description: 'Manage student marks and results',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
        
      <body className={inter.className}>
        <main className="container mx-auto p-4">
          {children}
          <Analytics/>
          <SpeedInsights/>
        </main>
      </body>
    </html>
  )
}

