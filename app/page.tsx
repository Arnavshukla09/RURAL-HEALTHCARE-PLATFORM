"use client"
import { useApp } from "@/components/providers/AppProvider"
import { LandingPage } from "@/components/LandingPage"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") router.push("/admin/dashboard")
      else if (user.role === "doctor") router.push("/doctor/dashboard")
      else router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading RuralHealth...</p>
        </div>
      </div>
    )
  }

  // If user is not loaded or null, show landing page
  return <LandingPage language={language} />
}
