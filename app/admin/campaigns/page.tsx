"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminCampaignManager } from "@/components/AdminCampaignManager"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminCampaignManager language={language} />
}
