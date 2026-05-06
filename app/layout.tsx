import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rural Healthcare Platform',
  description: 'Connecting rural communities with quality healthcare services across India',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
