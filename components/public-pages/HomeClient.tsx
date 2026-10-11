"use client"

import { useApp } from "@/components/providers/AppProvider"
import { LandingPage } from "@/components/LandingPage"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function HomeClient() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") router.push("/admin/dashboard")
      else if (user.role === "doctor") router.push("/doctor/dashboard")
      else router.push("/dashboard")
    }
  }, [user, loading, router])

  return <LandingPage language={language} />
}
