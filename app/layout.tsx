import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "RuralHealth — Quality Healthcare for Everyone",
  description: "AI-powered rural healthcare platform with specialist consultations, symptom checking, health information, and facility locator for rural India.",
  keywords: "rural healthcare, telemedicine, AI health, India healthcare, symptom checker",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      </head>
      <body className={`${inter.className} min-h-screen`}>{children}</body>
    </html>
  )
}
