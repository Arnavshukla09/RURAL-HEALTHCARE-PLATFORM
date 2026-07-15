"use client"
import { Button } from "./ui/button"
import { Menu, X, Heart, AlertTriangle, Activity, ChevronDown, LogOut, User, BookOpen, Users, Bell, Calendar, ClipboardList, MapPin, Megaphone } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "./NotificationBell"

import { usePathname, useRouter } from "next/navigation"
import { useApp } from "@/components/providers/AppProvider"

export function Header() {
  const { user, setUser, language, setLanguage } = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [careDropOpen, setCareDropOpen] = useState(false)
  const [userDropOpen, setUserDropOpen] = useState(false)
  const careRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const en = language === "en"

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (careRef.current && !careRef.current.contains(e.target as Node)) setCareDropOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
    setMobileMenuOpen(false)
    setUserDropOpen(false)
  }

  const go = (page: string) => {
    router.push(page)
    setMobileMenuOpen(false)
    setCareDropOpen(false)
    setUserDropOpen(false)
  }

  const isActive = (key: string) => pathname === key || pathname.startsWith(key + "/")
  const role = user?.role || "patient"

  const doctorItems = [
    { key: "/doctor/patients", label: en ? "Patients" : "मरीज़", icon: Users },
    { key: "/doctor/requests", label: en ? "Requests" : "अनुरोध", icon: Calendar },
    { key: "/appointments", label: en ? "Appointments" : "अपॉइंटमेंट", icon: ClipboardList },
    { key: "/locations", label: en ? "Hospitals" : "अस्पताल", icon: MapPin },
  ]

  const adminItems = [
    { key: "/admin/users", label: en ? "Users" : "उपयोगकर्ता", icon: Users },
    { key: "/admin/campaigns", label: en ? "Campaigns" : "अभियान", icon: Megaphone },
    { key: "/admin/appointments", label: en ? "Appointments" : "अपॉइंटमेंट", icon: Calendar },
    { key: "/admin/records", label: en ? "Records" : "रिकॉर्ड", icon: ClipboardList },
    { key: "/admin/notifications", label: en ? "Notify" : "सूचनाएं", icon: Bell },
  ]

  const careItems = [
    { key: "/consultation", label: en ? "Book Consultation" : "परामर्श बुक करें" },
    { key: "/appointments", label: en ? "My Appointments" : "मेरी अपॉइंटमेंट" },
    { key: "/records", label: en ? "Medical Records" : "चिकित्सा रिकॉर्ड" },
    { key: "/directory", label: en ? "Find Doctors" : "डॉक्टर खोजें" },
    { key: "/locations", label: en ? "Find Hospitals" : "अस्पताल खोजें" },
  ]

  const roleBadge: Record<string, { color: string; label: string }> = {
    doctor: { color: "bg-teal-500", label: "Doctor" },
    admin: { color: "bg-purple-500", label: "Admin" },
    patient: { color: "bg-blue-500", label: "Patient" },
  }
  const badge = roleBadge[role] || roleBadge.patient

  const headerBg =
    role === "doctor" ? "bg-teal-900 border-teal-800" :
    role === "admin"  ? "bg-purple-900 border-purple-800" :
    "bg-white border-gray-200"

  return (
    <header className={`border-b sticky top-0 z-40 shadow-sm ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center cursor-pointer gap-2 flex-shrink-0" onClick={() => go(user ? (role === "admin" ? "/admin/dashboard" : role === "doctor" ? "/doctor/dashboard" : "/dashboard") : "/")}>
            <Heart className={`h-6 w-6 ${role !== "patient" ? "text-white" : "text-teal-600"}`} />
            <div className="flex items-center gap-1.5">
              <span className={`text-base font-bold hidden sm:block ${role !== "patient" ? "text-white" : "text-teal-700"}`}>
                {en ? "RuralHealth" : "ग्रामीण स्वास्थ्य"}
              </span>
              {role !== "patient" && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color} text-white font-semibold`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">

            {/* DOCTOR */}
            {role === "doctor" && (
              <>
                {doctorItems.map(item => {
                  const Icon = item.icon
                  return (
                    <button key={item.key} onClick={() => go(item.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.key) ? "bg-white/20 text-white" : "text-teal-200 hover:bg-white/10 hover:text-white"
                      }`}>
                      <Icon className="h-4 w-4" />{item.label}
                    </button>
                  )
                })}
                <button onClick={() => go("/emergency")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors">
                  <AlertTriangle className="h-4 w-4" />{en ? "Emergency" : "आपातकाल"}
                </button>
              </>
            )}

            {/* ADMIN */}
            {role === "admin" && (
              <>
                {adminItems.map(item => {
                  const Icon = item.icon
                  return (
                    <button key={item.key} onClick={() => go(item.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.key) ? "bg-white/20 text-white" : "text-purple-200 hover:bg-white/10 hover:text-white"
                      }`}>
                      <Icon className="h-4 w-4" />{item.label}
                    </button>
                  )
                })}
              </>
            )}

            {/* PATIENT */}
            {role === "patient" && (
              <>
                <button onClick={() => go("/symptom-checker")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/symptom-checker") ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}>
                  <Activity className="h-4 w-4" />{en ? "Symptoms" : "लक्षण"}
                </button>
                <button onClick={() => go("/health-info")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/health-info") ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}>
                  <BookOpen className="h-4 w-4" />{en ? "Health Info" : "स्वास्थ्य जानकारी"}
                </button>
                <div ref={careRef} className="relative">
                  <button onClick={() => setCareDropOpen(!careDropOpen)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      careItems.some(i => isActive(i.key)) ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}>
                    {en ? "My Care" : "मेरी देखभाल"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${careDropOpen ? "rotate-180" : ""}`} />
                  </button>
                  {careDropOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-xl py-1 z-50">
                      {careItems.map(item => (
                        <button key={item.key} onClick={() => go(item.key)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-teal-50 hover:text-teal-700 ${
                            isActive(item.key) ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700"
                          }`}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => go("/emergency")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/emergency") ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"
                  }`}>
                  <AlertTriangle className="h-4 w-4" />{en ? "Emergency" : "आपातकाल"}
                </button>
              </>
            )}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <button onClick={() => setLanguage(en ? "hi" : "en")}
              className={`hidden sm:flex items-center px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors ${
                role !== "patient" ? "border-white/30 text-white hover:bg-white/10" : "border-gray-200 hover:bg-gray-50"
              }`}>
              {en ? "हिं" : "EN"}
            </button>

            {/* Notification Bell — for all logged-in users */}
            {user && <NotificationBell user={user} language={language} />}

            {user ? (
              <div ref={userRef} className="relative hidden sm:block">
                <button onClick={() => setUserDropOpen(!userDropOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors max-w-36 ${
                    role !== "patient" ? "border-white/30 text-white hover:bg-white/10" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                  <User className={`h-4 w-4 flex-shrink-0 ${role !== "patient" ? "text-white" : "text-teal-600"}`} />
                  <span className="truncate">{user.name}</span>
                  <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${userDropOpen ? "rotate-180" : ""}`} />
                </button>
                {userDropOpen && (
                  <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-xl py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full ${badge.color} text-white font-medium`}>{badge.label}</span>
                    </div>
                    <button onClick={() => go("/dashboard")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {en ? "Dashboard" : "डैशबोर्ड"}
                    </button>
                    {role === "doctor" && (
                      <>
                        <button onClick={() => go("/doctor/patients")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Patient Records" : "मरीज़ रिकॉर्ड"}</button>
                        <button onClick={() => go("/doctor/requests")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Appointment Requests" : "नई अनुरोध"}</button>
                        <button onClick={() => go("/appointments")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Appointments" : "अपॉइंटमेंट"}</button>
                        <button onClick={() => go("/locations")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Hospitals" : "अस्पताल"}</button>
                      </>
                    )}
                    {role === "admin" && (
                      <>
                        <button onClick={() => go("/admin/users")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Manage Users" : "उपयोगकर्ता प्रबंधन"}</button>
                        <button onClick={() => go("/admin/campaigns")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Campaigns" : "अभियान"}</button>
                        <button onClick={() => go("/admin/appointments")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Appointments" : "अपॉइंटमेंट"}</button>
                        <button onClick={() => go("/admin/records")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Records" : "रिकॉर्ड"}</button>
                        <button onClick={() => go("/admin/notifications")} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{en ? "Send Notifications" : "सूचनाएं भेजें"}</button>
                      </>
                    )}
                    <div className="border-t border-gray-50 mt-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                        <LogOut className="h-3.5 w-3.5" />{en ? "Logout" : "लॉगआउट"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={() => go("/login")} className="hidden sm:flex gradient-primary text-white text-xs">
                {en ? "Login" : "लॉगिन"}
              </Button>
            )}

            <Button variant="outline" size="sm"
              className={`md:hidden ${role !== "patient" ? "border-white/30 text-white bg-transparent hover:bg-white/10" : ""}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t py-3 space-y-1 ${role !== "patient" ? "border-white/20" : "border-gray-100 bg-white"}`}>
            {role === "doctor" && (
              <>
                {doctorItems.map(item => {
                  const Icon = item.icon
                  return (
                    <button key={item.key} onClick={() => go(item.key)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-teal-100 hover:bg-white/10 rounded-lg transition-colors">
                      <Icon className="h-4 w-4" />{item.label}
                    </button>
                  )
                })}
                <button onClick={() => go("/emergency")} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-300 hover:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />{en ? "Emergency" : "आपातकाल"}
                </button>
              </>
            )}
            {role === "admin" && adminItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.key} onClick={() => go(item.key)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-purple-100 hover:bg-white/10 rounded-lg transition-colors">
                  <Icon className="h-4 w-4" />{item.label}
                </button>
              )
            })}
            {role === "patient" && (
              <>
                <button onClick={() => go("/symptom-checker")} className={`w-full flex items-center gap-2 px-4 py-3 text-sm rounded-lg ${isActive("/symptom-checker") ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"}`}>
                  <Activity className="h-4 w-4" />{en ? "Symptom Checker" : "लक्षण जांचकर्ता"}
                </button>
                <button onClick={() => go("/health-info")} className={`w-full flex items-center gap-2 px-4 py-3 text-sm rounded-lg ${isActive("/health-info") ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"}`}>
                  <BookOpen className="h-4 w-4" />{en ? "Health Info" : "स्वास्थ्य जानकारी"}
                </button>
                {careItems.map(item => (
                  <button key={item.key} onClick={() => go(item.key)}
                    className={`w-full text-left px-6 py-2.5 text-sm rounded-lg ${isActive(item.key) ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                    {item.label}
                  </button>
                ))}
                <button onClick={() => go("/emergency")} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />{en ? "Emergency" : "आपातकाल"}
                </button>
              </>
            )}
            <div className="pt-2 border-t border-gray-100 space-y-1 px-2">
              <button onClick={() => { setLanguage(en ? "hi" : "en"); setMobileMenuOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-lg ${role !== "patient" ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-50"}`}>
                {en ? "Switch to Hindi (हिंदी)" : "Switch to English"}
              </button>
              {user ? (
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 rounded-lg flex items-center gap-2 hover:bg-red-900/20">
                  <LogOut className="h-4 w-4" />{en ? "Logout" : "लॉगआउट"}
                </button>
              ) : (
                <Button size="sm" className="w-full gradient-primary text-white" onClick={() => go("/login")}>
                  {en ? "Login / Register" : "लॉगिन / पंजीकरण"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

