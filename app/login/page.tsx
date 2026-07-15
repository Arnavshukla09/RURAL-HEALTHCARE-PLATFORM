"use client"
import { useApp } from "@/components/providers/AppProvider"
import { Authentication } from "@/components/Authentication"
import { useRouter } from "next/navigation"

export default function Page() {
  const { setUser, language } = useApp()
  const router = useRouter()
  return <Authentication setUser={setUser} setCurrentPage={(p) => router.push(p === "home" ? "/" : `/${p}`)} language={language} />
}
