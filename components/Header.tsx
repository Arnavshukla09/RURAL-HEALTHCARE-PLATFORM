"use client"
import { Button } from "./ui/button"
import { Menu, X, Heart, AlertTriangle, Activity, ChevronDown, LogOut, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface HeaderProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  user: any
  setUser: (user: any) => void
  language: string
  setLanguage: (lang: string) => void
}

export function Header({ currentPage, setCurrentPage, user, setUser, language, setLanguage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [careDropOpen, setCareDropOpen] = useState(false)
  const [userDropOpen, setUserDropOpen] = useState(false)
  const careRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const en = language === "en"

  // Close dropdowns when clicking outside
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
    setCurrentPage("home")
    setMobileMenuOpen(false)
    setUserDropOpen(false)
  }

  const go = (page: string) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
    setCareDropOpen(false)
    setUserDropOpen(false)
  }

  // Care dropdown items
  const careItems = [
    { key: "consultation", label: en ? "Book Consultation" : "परामर्श बुक करें" },
    { key: "appointments", label: en ? "My Appointments" : "मेरी अपॉइंटमेंट" },
    { key: "records", label: en ? "Medical Records" : "चिकित्सा रिकॉर्ड" },
    { key: "directory", label: en ? "Find Doctors" : "डॉक्टर खोजें" },
    { key: "locations", label: en ? "Find Hospitals" : "अस्पताल खोजें" },
  ]

  const isActive = (key: string) => currentPage === key

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center cursor-pointer gap-2 flex-shrink-0" onClick={() => go(user ? "dashboard" : "home")}>
            <Heart className="h-6 w-6 text-teal-600" />
            <span className="text-base font-bold text-teal-700 hidden sm:block">{en ? "RuralHealth" : "ग्रामीण स्वास्थ्य"}</span>
          </div>

          {/* Desktop Nav — primary items always visible */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Symptoms */}
            <button onClick={() => go("symptom-checker")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("symptom-checker") ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}>
              <Activity className="h-4 w-4" />
              {en ? "Symptoms" : "लक्षण"}
            </button>

            {/* My Care dropdown (only when logged in) */}
            {user && (
              <div ref={careRef} className="relative">
                <button
                  onClick={() => setCareDropOpen(!careDropOpen)}
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
            )}

            {/* Emergency — always visible */}
            <button onClick={() => go("emergency")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("emergency") ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"
              }`}>
              <AlertTriangle className="h-4 w-4" />
              {en ? "Emergency" : "आपातकाल"}
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(en ? "hi" : "en")}
              className="hidden sm:flex items-center px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              {en ? "हिं" : "EN"}
            </button>

            {user ? (
              /* User dropdown */
              <div ref={userRef} className="relative hidden sm:block">
                <button onClick={() => setUserDropOpen(!userDropOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors max-w-32">
                  <User className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span className="truncate text-gray-700">{user.name}</span>
                  <ChevronDown className={`h-3 w-3 text-gray-400 flex-shrink-0 transition-transform ${userDropOpen ? "rotate-180" : ""}`} />
                </button>
                {userDropOpen && (
                  <div className="absolute top-full right-0 mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => go("dashboard")}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {en ? "Dashboard" : "डैशबोर्ड"}
                    </button>
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                      <LogOut className="h-3.5 w-3.5" />
                      {en ? "Logout" : "लॉगआउट"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={() => go("auth")} className="hidden sm:flex gradient-primary text-white text-xs">
                {en ? "Login" : "लॉगिन"}
              </Button>
            )}

            {/* Mobile hamburger */}
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 bg-white">
            <button onClick={() => go("symptom-checker")}
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-colors ${isActive("symptom-checker") ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
              <Activity className="h-4 w-4" /> {en ? "Symptom Checker" : "लक्षण जांचकर्ता"}
            </button>
            <button onClick={() => go("emergency")}
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-colors ${isActive("emergency") ? "bg-red-50 text-red-700 font-medium" : "text-red-600 hover:bg-red-50"}`}>
              <AlertTriangle className="h-4 w-4" /> {en ? "Emergency" : "आपातकाल"}
            </button>
            {user && (
              <>
                <div className="px-4 pt-2 pb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{en ? "My Care" : "मेरी देखभाल"}</p>
                </div>
                {careItems.map(item => (
                  <button key={item.key} onClick={() => go(item.key)}
                    className={`w-full text-left px-6 py-2.5 text-sm rounded-lg transition-colors ${isActive(item.key) ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                    {item.label}
                  </button>
                ))}
              </>
            )}
            <div className="pt-2 border-t border-gray-100 space-y-2 px-2">
              <button onClick={() => { setLanguage(en ? "hi" : "en"); setMobileMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                {en ? "Switch to Hindi (हिंदी)" : "Switch to English"}
              </button>
              {user ? (
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> {en ? "Logout" : "लॉगआउट"}
                </button>
              ) : (
                <Button size="sm" className="w-full gradient-primary text-white" onClick={() => go("auth")}>
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
