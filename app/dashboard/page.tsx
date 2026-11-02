"use client"

import { useApp } from "@/components/providers/AppProvider"
import { Dashboard } from "@/components/Dashboard"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { AdminDashboard } from "@/components/AdminDashboard"
import { Authentication } from "@/components/Authentication"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading, setUser } = useApp()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            {language === "hi" ? "डैशबोर्ड लोड हो रहा है..." : "Loading dashboard..."}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-6">
        <div className="max-w-md mx-auto mb-4 text-center">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg py-2 px-4 inline-block font-medium">
            {language === "hi"
              ? "डैशबोर्ड देखने के लिए कृपया लॉगिन करें"
              : "Please sign in to view your healthcare dashboard"}
          </p>
        </div>
        <Authentication
          setUser={setUser}
          setCurrentPage={(p) => router.push(p === "home" ? "/" : `/${p}`)}
          language={language}
        />
      </div>
    )
  }

  if (user.role === "doctor") return <DoctorDashboard language={language} user={user} setJitsiRoom={() => {}} />
  if (user.role === "admin") return <AdminDashboard language={language} user={user} />
  
  return <Dashboard language={language} user={user} />
}
