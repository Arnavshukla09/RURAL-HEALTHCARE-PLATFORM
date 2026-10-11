"use client"

import { useEffect } from "react"
import { useApp } from "@/components/providers/AppProvider"
import { Dashboard } from "@/components/Dashboard"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { AdminDashboard } from "@/components/AdminDashboard"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading || !user) return null

  if (user.role === "doctor") return <DoctorDashboard language={language} user={user} setJitsiRoom={() => {}} />
  if (user.role === "admin") return <AdminDashboard language={language} user={user} />
  
  return <Dashboard language={language} user={user} />
}
