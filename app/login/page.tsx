"use client"
import { useApp } from "@/components/providers/AppProvider"
import { Authentication } from "@/components/Authentication"
import { useRouter } from "next/navigation"

export default function Page() {
  const { setUser, language } = useApp()
  return (
    <Authentication
      setUser={setUser}
      setCurrentPage={(p) => {
        const dest = p === "home" ? "/" : `/${p}`
        window.location.href = dest
      }}
      language={language}
    />
  )
}
