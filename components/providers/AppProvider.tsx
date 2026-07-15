"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { UserProfile, SymptomResult } from "@/types"
import { useRouter, usePathname } from "next/navigation"

interface AppContextProps {
  user: UserProfile | null
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>
  language: string
  setLanguage: React.Dispatch<React.SetStateAction<string>>
  symptomCheckResult: SymptomResult | null
  setSymptomCheckResult: React.Dispatch<React.SetStateAction<SymptomResult | null>>
  loading: boolean
}

const AppContext = createContext<AppContextProps | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [language, setLanguage] = useState("en")
  const [symptomCheckResult, setSymptomCheckResult] = useState<SymptomResult | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    const fetchUserWithRole = async (sessionUser: any): Promise<UserProfile> => {
      try {
        const res = await fetch("/api/auth/ensure-patient", { method: "POST" })
        if (res.ok) {
          const data = await res.json()
          return {
            id: sessionUser.id,
            name: data.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            email: sessionUser.email || "",
            role: data.role || "patient",
            phone: data.phone || "",
          }
        }
      } catch (err) {
        console.error("ensure-patient failed:", err)
      }

      const { data: patient } = await supabase
        .from("patients")
        .select("role, first_name, last_name, phone")
        .eq("user_id", sessionUser.id)
        .single()

      return {
        id: sessionUser.id,
        name:
          patient?.first_name ||
          sessionUser.user_metadata?.full_name ||
          sessionUser.user_metadata?.first_name ||
          sessionUser.email?.split("@")[0] ||
          "User",
        email: sessionUser.email || "",
        role: patient?.role || "patient",
        phone: patient?.phone || "",
      }
    }

    const timeoutId = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(timeoutId)
        if (session?.user) {
          const userData = await fetchUserWithRole(session.user)
          setUser(userData)
        }
        setLoading(false)
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        console.error("Session error:", err)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData = await fetchUserWithRole(session.user)
        setUser(userData)
        if (_event === "SIGNED_IN") {
          if (userData.role === "admin") router.push("/admin/dashboard")
          else if (userData.role === "doctor") router.push("/doctor/dashboard")
          else router.push("/dashboard")
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        language,
        setLanguage,
        symptomCheckResult,
        setSymptomCheckResult,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
