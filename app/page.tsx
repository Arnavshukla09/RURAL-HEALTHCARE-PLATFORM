"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LandingPage } from "@/components/LandingPage"
import { Authentication } from "@/components/Authentication"
import { Dashboard } from "@/components/Dashboard"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { AdminDashboard } from "@/components/AdminDashboard"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { SymptomChecker } from "@/components/SymptomChecker"
import { PatientRecords } from "@/components/PatientRecords"
import { EmergencyModule } from "@/components/EmergencyModule"
import { Directory } from "@/components/Directory"
import { CampLocations } from "@/components/CampLocations"
import { AccessibilityBar } from "@/components/AccessibilityBar"
import { AIConsultationChat } from "@/components/AIConsultationChat"
import { HealthInfoHub } from "@/components/HealthInfoHub"
import { AppointmentManager } from "@/components/AppointmentManager"
import { ConsultationPortal } from "@/components/ConsultationPortal"
import { MapView } from "@/components/MapView"
import { JitsiMeeting } from "@/components/JitsiMeeting"

// ── Donation (free, no Stripe) ─────────────────────────────────
function DonationSection({ language }: { language: string }) {
  const amounts = [100, 500, 1000, 2000, 5000]
  const [sel, setSel] = useState<number | null>(null)
  const [custom, setCustom] = useState("")
  const amount = custom ? Number(custom) : sel

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">❤️</div>
        <h2 className="text-2xl font-bold">{language === "hi" ? "दान पोर्टल" : "Donation Portal"}</h2>
        <p className="text-gray-500">{language === "hi" ? "ग्रामीण स्वास्थ्य सेवा का समर्थन करें" : "Support Rural Healthcare"}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {amounts.map(a => (
          <button key={a} onClick={() => { setSel(a); setCustom("") }}
            className={`border rounded-lg p-3 font-semibold transition-all hover-lift ${sel === a && !custom ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 hover:border-teal-300"}`}>
            ₹{a}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <label className="text-sm text-gray-600 mb-1 block">{language === "hi" ? "कस्टम राशि (₹)" : "Custom Amount (₹)"}</label>
        <input type="number" value={custom} onChange={e => { setCustom(e.target.value); setSel(null) }}
          className="w-full border rounded-lg p-3 focus:outline-none focus:border-teal-500" placeholder="Enter amount" />
      </div>
      {amount ? (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4 text-sm">
          <p className="font-semibold mb-2">{language === "hi" ? "बैंक विवरण:" : "Bank Transfer Details:"}</p>
          <p>Account: Rural Healthcare Foundation</p>
          <p>Account No: 1234567890 | IFSC: SBIN0001234</p>
          <p>UPI: ruralhealth@upi</p>
          <p className="mt-2 text-teal-700 font-bold text-base">Amount: ₹{amount}</p>
        </div>
      ) : null}
      <button disabled={!amount}
        onClick={() => alert(`Please transfer ₹${amount} using the bank details above. Thank you!`)}
        className="w-full gradient-primary text-white py-3 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        {language === "hi" ? `दान करें${amount ? ` ₹${amount}` : ""}` : `Donate${amount ? ` ₹${amount}` : ""}`}
      </button>
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

  useEffect(() => {
    const supabase = createClient()
    
    const fetchUserWithRole = async (sessionUser: any) => {
      // Always fetch role from the patients table in DB — never from user_metadata
      const { data: patient } = await supabase
        .from('patients')
        .select('role, first_name, last_name')
        .eq('user_id', sessionUser.id)
        .single()
      
      return {
        id: sessionUser.id,
        name: patient?.first_name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.first_name || sessionUser.email?.split("@")[0] || "User",
        email: sessionUser.email,
        role: patient?.role || "patient",
      }
    }
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await fetchUserWithRole(session.user)
        setUser(userData)
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData = await fetchUserWithRole(session.user)
        setUser(userData)
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
        if (user?.role === "doctor") return <DoctorDashboard user={user} setCurrentPage={setCurrentPage} language={language} setJitsiRoom={setJitsiRoom} />
        if (user?.role === "admin") return <AdminDashboard user={user} setCurrentPage={setCurrentPage} language={language} />
        return <Dashboard user={user || { name: "Guest", role: "patient" }} setCurrentPage={setCurrentPage} language={language} />
      case "symptom-checker":
        return <SymptomChecker setCurrentPage={setCurrentPage} language={language} />
      case "ai-chat":
        return <AIConsultationChat language={language} setCurrentPage={setCurrentPage} />
      case "consultation":
        return <ConsultationPortal language={language} />
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
      case "donation":
        return <DonationSection language={language} />
      case "health-info":
        return <HealthInfoHub language={language} />
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
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer setCurrentPage={setCurrentPage} language={language} />
    </div>
  )
}
