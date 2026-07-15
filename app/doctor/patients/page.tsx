"use client"
import { useApp } from "@/components/providers/AppProvider"
import { DoctorPatients } from "@/components/DoctorPatients"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "doctor") { router.push("/dashboard"); return null; }
  return <DoctorPatients language={language} />
}
