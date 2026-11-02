"use client"
import { useEffect } from "react"
import { useApp } from "@/components/providers/AppProvider"
import { DoctorAppointmentRequests } from "@/components/DoctorAppointmentRequests"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== "doctor") {
      router.push("/dashboard")
    }
  }, [loading, user, router])

  if (loading || user?.role !== "doctor") return null
  return <DoctorAppointmentRequests language={language} setJitsiRoom={() => {}} />
}
