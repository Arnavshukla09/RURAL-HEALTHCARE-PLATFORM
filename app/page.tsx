"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LandingPage } from "@/components/LandingPage"
import { Authentication } from "@/components/Authentication"
import { Dashboard } from "@/components/Dashboard"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { SymptomChecker } from "@/components/SymptomChecker"
import { PatientRecords } from "@/components/PatientRecords"
import { EmergencyModule } from "@/components/EmergencyModule"
import { Directory } from "@/components/Directory"
import { CampLocations } from "@/components/CampLocations"
import { AccessibilityBar } from "@/components/AccessibilityBar"
import { HealthInfoHub } from "@/components/HealthInfoHub"
import { AppointmentManager } from "@/components/AppointmentManager"
import { ConsultationPortal } from "@/components/ConsultationPortal"
import { MapView } from "@/components/MapView"
import { JitsiMeeting } from "@/components/JitsiMeeting"
import { FloatingChat } from "@/components/FloatingChat"


// ── Mobile Bottom Tab Bar ──────────────────────────────────────
function BottomTabBar({ currentPage, setCurrentPage, language }: { currentPage: string; setCurrentPage: (p: string) => void; language: string }) {
  const en = language === "en"
  const tabs = [
    { key: "dashboard", icon: "🏠", label: en ? "Home" : "होम" },
    { key: "symptom-checker", icon: "🩺", label: en ? "Symptoms" : "लक्षण" },
    { key: "appointments", icon: "📅", label: en ? "Bookings" : "बुकिंग" },
    { key: "emergency", icon: "🆘", label: en ? "Emergency" : "आपातकाल" },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md:hidden safe-bottom">
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => setCurrentPage(tab.key)}
          className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
            currentPage === tab.key ? "text-teal-600 font-semibold" : "text-gray-500 hover:text-gray-700"
          }`}>
          <span className="text-xl leading-tight">{tab.icon}</span>
          <span className="mt-0.5">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function Page() {
  const [currentPage, setCurrentPage] = useState("home")
  const [user, setUser] = useState<any>(null)
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(true)
  const [jitsiRoom, setJitsiRoom] = useState<string | null>(null)
  // Symptom checker result — gates HealthInfoHub
  const [symptomCheckResult, setSymptomCheckResult] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchUserWithRole = async (sessionUser: any) => {
      // Call server-side API to ensure patient row exists (bypasses RLS)
      try {
        const res = await fetch("/api/auth/ensure-patient", { method: "POST" })
        if (res.ok) {
          const data = await res.json()
          return {
            id: sessionUser.id,
            name: data.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            email: sessionUser.email,
            role: data.role || "patient",
            phone: data.phone || "",
          }
        }
      } catch (err) {
        console.error("ensure-patient failed:", err)
      }

      // Fallback: try direct DB read (works if RLS allows SELECT)
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
        email: sessionUser.email,
        role: patient?.role || "patient",
        phone: patient?.phone || "",
      }
    }

const timeoutId = setTimeout(() => setLoading(false), 5000) // failsafe: never hang forever

supabase.auth.getSession()
  .then(({ data: { session } }) => {
    clearTimeout(timeoutId)
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] || "User",
        email: session.user.email,
        role: "patient",
      })
    }
    setLoading(false)
  })
  .catch((err) => {
    clearTimeout(timeoutId)
    console.error("Session error:", err)
    setLoading(false) // never hang on error
  })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData = await fetchUserWithRole(session.user)
        setUser(userData)
        // SIGN_IN event → navigate to dashboard
        if (_event === "SIGNED_IN") setCurrentPage("dashboard")
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading RuralHealth...</p>
        </div>
      </div>
    )
  }

  if (currentPage === "auth") {
    return <Authentication setUser={setUser} setCurrentPage={setCurrentPage} language={language} />
  }

  if (currentPage === "jitsi" && jitsiRoom) {
    return <JitsiMeeting roomName={jitsiRoom} displayName={user?.name || "Guest"} onLeave={() => { setJitsiRoom(null); setCurrentPage("dashboard") }} language={language} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <LandingPage setCurrentPage={setCurrentPage} language={language} />
      case "dashboard":
        return <Dashboard user={user || { name: "Guest", role: "patient" }} setCurrentPage={setCurrentPage} language={language} />
      case "symptom-checker":
        return (
          <SymptomChecker
            setCurrentPage={setCurrentPage}
            language={language}
            onComplete={(result: any) => {
              setSymptomCheckResult(result)
              setCurrentPage("health-info")
            }}
          />
        )
      case "consultation":
        return <ConsultationPortal user={user} language={language} setCurrentPage={setCurrentPage} />
      case "appointments":
        return <AppointmentManager user={user} language={language} setCurrentPage={setCurrentPage} setJitsiRoom={setJitsiRoom} />
      case "records":
        return <PatientRecords language={language} />
      case "emergency":
        return <EmergencyModule setCurrentPage={setCurrentPage} language={language} />
      case "locations":
        return <MapView language={language} userLocation={null} camps={[]} />
      case "directory":
        return <Directory setCurrentPage={setCurrentPage} language={language} />
      case "camps":
        return <CampLocations setCurrentPage={setCurrentPage} language={language} />

      case "health-info":
        return <HealthInfoHub language={language} symptomResult={symptomCheckResult} setCurrentPage={setCurrentPage} />
      default:
        return <Dashboard user={user || { name: "Guest", role: "patient" }} setCurrentPage={setCurrentPage} language={language} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AccessibilityBar language={language} setLanguage={setLanguage} />
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        setUser={setUser}
        language={language}
        setLanguage={setLanguage}
      />
      <main className="flex-1 pb-16 md:pb-0">
        {renderPage()}
      </main>
      <Footer setCurrentPage={setCurrentPage} language={language} />
      {/* Mobile bottom tab bar — only when logged in */}
      {user && <BottomTabBar currentPage={currentPage} setCurrentPage={setCurrentPage} language={language} />}
      {/* Gemini AI floating chat */}
      <FloatingChat language={language} setCurrentPage={setCurrentPage} />
    </div>
  )
}
