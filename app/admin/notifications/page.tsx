"use client"
import { useEffect } from "react"
import { useApp } from "@/components/providers/AppProvider"
import { AdminNotifications } from "@/components/AdminNotifications"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.push("/dashboard")
    }
  }, [loading, user, router])

  if (loading || user?.role !== "admin") return null
  return <AdminNotifications language={language} />
}
