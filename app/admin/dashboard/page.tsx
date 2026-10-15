"use client"
import { useEffect } from "react"
import { useApp } from "@/components/providers/AppProvider"
import { AdminDashboard } from "@/components/AdminDashboard"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.push("/dashboard")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (user?.role !== "admin") return null
  return <AdminDashboard language={language} user={user} />
}
