"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { UserProfile, SymptomResult } from "@/types"
import { useRouter } from "next/navigation"
import { triggerGoogleTranslate } from "@/lib/i18n/google-translate"

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
  // Restore user session synchronously from localStorage cache to prevent logout flicker on page reload
  const [user, setUserState] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("rhcp_user_profile")
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return null
  })

  const [language, setLanguageState] = useState("en")
  const [symptomCheckResult, setSymptomCheckResult] = useState<SymptomResult | null>(null)
  // Loading starts true until initial session validation finishes
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Sync user state with localStorage
  const setUser: React.Dispatch<React.SetStateAction<UserProfile | null>> = (action) => {
    setUserState((prev) => {
      const next = typeof action === "function" ? (action as (p: UserProfile | null) => UserProfile | null)(prev) : action
      if (typeof window !== "undefined") {
        try {
          if (next) {
            localStorage.setItem("rhcp_user_profile", JSON.stringify(next))
          } else {
            localStorage.removeItem("rhcp_user_profile")
          }
        } catch {}
      }
      return next
    })
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rhcp_language")
      if (saved) {
        setLanguageState(saved)
        document.documentElement.lang = saved
        if (saved !== "en") {
          triggerGoogleTranslate(saved, false)
        }
      }
    } catch {}
  }, [])

  const setLanguage: React.Dispatch<React.SetStateAction<string>> = (action) => {
    setLanguageState((prev) => {
      const next = typeof action === "function" ? (action as (p: string) => string)(prev) : action
      try {
        localStorage.setItem("rhcp_language", next)
        document.documentElement.lang = next
        window.dispatchEvent(new CustomEvent("rhcp-language-change", { detail: { language: next } }))
        triggerGoogleTranslate(next, true)
      } catch {}
      return next
    })
  }

  useEffect(() => {
    const supabase = createClient()

    // Query patient row first; invoke ensure-patient ONLY if no row exists
    const fetchUserWithRole = async (sessionUser: any): Promise<UserProfile> => {
      try {
        const { data: patient } = await supabase
          .from("patients")
          .select("role, first_name, last_name, phone")
          .eq("user_id", sessionUser.id)
          .single()

        if (patient) {
          return {
            id: sessionUser.id,
            name:
              patient.first_name ||
              sessionUser.user_metadata?.full_name ||
              sessionUser.user_metadata?.first_name ||
              sessionUser.email?.split("@")[0] ||
              "User",
            email: sessionUser.email || "",
            role: patient.role || "patient",
            phone: patient.phone || "",
          }
        }

        // Patient row missing (e.g. initial Google OAuth signup) -> bootstrap profile
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
        console.warn("[AppProvider] Profile resolution fallback:", err)
      }

      return {
        id: sessionUser.id,
        name:
          sessionUser.user_metadata?.full_name ||
          sessionUser.user_metadata?.first_name ||
          sessionUser.email?.split("@")[0] ||
          "User",
        email: sessionUser.email || "",
        role: "patient",
        phone: "",
      }
    }

    const timeoutId = setTimeout(() => setLoading(false), 4000)

    // Initial session verification
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(timeoutId)
        if (session?.user) {
          const userData = await fetchUserWithRole(session.user)
          setUser(userData)
        } else {
          // No active Supabase session -> clear user
          setUser(null)
        }
        setLoading(false)
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        console.error("Session error:", err)
        setLoading(false)
      })

    // Listen to real auth state changes (login / explicit logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = await fetchUserWithRole(session.user)
        setUser(userData)
        if (event === "SIGNED_IN") {
          if (userData.role === "admin") router.push("/admin/dashboard")
          else if (userData.role === "doctor") router.push("/doctor/dashboard")
          else router.push("/dashboard")
        }
      } else if (event === "SIGNED_OUT") {
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
