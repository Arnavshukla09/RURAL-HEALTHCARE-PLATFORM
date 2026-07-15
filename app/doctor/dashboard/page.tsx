"use client"
import { useApp } from "@/components/providers/AppProvider"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "doctor") { router.push("/dashboard"); return null; }
  return <DoctorDashboard language={language} user={user} setJitsiRoom={() => {}} />
}
