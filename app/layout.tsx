import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import { AppProvider } from "@/components/providers/AppProvider"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { AccessibilityBar } from "@/components/AccessibilityBar"
import { BottomTabBar } from "@/components/BottomTabBar"
import { FloatingChat } from "@/components/FloatingChat"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "RuralHealth — Quality Healthcare for Everyone",
  description: "AI-powered rural healthcare platform with specialist consultations, symptom checking, health information, and facility locator for rural India.",
  keywords: "rural healthcare, telemedicine, AI health, India healthcare, symptom checker",
  manifest: "/manifest.json",
}

export const viewport = {
  themeColor: "#0ea5e9",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to critical third-party origins to improve LCP */}
        <link rel="preconnect" href="https://boyzdmlvzvcplzolenef.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        <link rel="dns-prefetch" href="https://a.basemaps.cartocdn.com" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
        <AppProvider>
          <AccessibilityBar />
          <Header />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <BottomTabBar />
          <FloatingChat />
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}
