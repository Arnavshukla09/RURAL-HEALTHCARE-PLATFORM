"use client"
import { useApp } from "@/components/providers/AppProvider"
import { Dashboard } from "@/components/Dashboard"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { AdminDashboard } from "@/components/AdminDashboard"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  if (loading) return null
  if (!user) { router.push("/login"); return null }

  if (user.role === "doctor") return <DoctorDashboard language={language} user={user} setJitsiRoom={() => {}} />
  if (user.role === "admin") return <AdminDashboard language={language} user={user} />
  
  return <Dashboard language={language} user={user} />
}
