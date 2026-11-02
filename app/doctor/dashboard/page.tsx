"use client"
import { useEffect } from "react"
import { useApp } from "@/components/providers/AppProvider"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== "doctor") {
      router.push("/dashboard")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (user?.role !== "doctor") return null
  return <DoctorDashboard language={language} user={user} setJitsiRoom={() => {}} />
}
