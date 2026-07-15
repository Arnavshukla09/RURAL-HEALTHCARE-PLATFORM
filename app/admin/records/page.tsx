"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminRecords } from "@/components/AdminRecords"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminRecords language={language} />
}
