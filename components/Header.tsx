"use client"
import { Button } from "./ui/button"
import { Menu, X, Heart, BookOpen, Phone, Settings, LogOut, MapPin, Activity, AlertTriangle, LayoutDashboard, FileText } from "lucide-react"
import { useState } from "react"
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

  const navItems = [
    { key: "home",           label: language === "en" ? "Home"      : "होम",         icon: Heart },
    { key: "symptom-checker",label: language === "en" ? "Symptoms"  : "लक्षण",       icon: Activity },
    { key: "consultation",   label: language === "en" ? "Consult"   : "परामर्श",     icon: Phone },
    { key: "records",        label: language === "en" ? "Records"   : "रिकॉर्ड",    icon: FileText },
    { key: "emergency",      label: language === "en" ? "Emergency" : "आपातकाल",    icon: AlertTriangle },
    { key: "locations",      label: language === "en" ? "Hospitals" : "अस्पताल",    icon: MapPin },
    { key: "health-info",    label: language === "en" ? "Health Info": "जानकारी",   icon: BookOpen },
    { key: "dashboard",      label: language === "en" ? "Dashboard" : "डैशबोर्ड",  icon: LayoutDashboard },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setCurrentPage("home")
  }

  const navBtn = (key: string, label: string, Icon: any, mobile = false) => (
    <button key={key}
      onClick={() => { setCurrentPage(key); setMobileMenuOpen(false) }}
      className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors ${mobile ? "w-full" : ""} ${
        currentPage === key ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
      }`}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  )

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center cursor-pointer gap-2" onClick={() => setCurrentPage("home")}>
            <Heart className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{language === "en" ? "RuralHealth" : "ग्रामीण स्वास्थ्य"}</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => navBtn(item.key, item.label, item.icon))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "hi" : "en")} className="hidden sm:flex text-xs px-2">
              {language === "en" ? "हिं" : "EN"}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden md:block max-w-24 truncate">
                  {language === "en" ? `Hi, ${user.name}` : `नमस्ते, ${user.name}`}
                </span>
                {user.role === "admin" && (
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage("admin")} className="hidden sm:flex text-xs">
                    <Settings className="h-3 w-3 mr-1" />Admin
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex text-xs">
                  <LogOut className="h-3 w-3 mr-1" />{language === "en" ? "Logout" : "लॉगआउट"}
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setCurrentPage("auth")} className="hidden sm:flex text-xs">
                {language === "en" ? "Login / Register" : "लॉगिन"}
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-1">
            {navItems.map(item => navBtn(item.key, item.label, item.icon, true))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setLanguage(language === "en" ? "hi" : "en"); setMobileMenuOpen(false) }}>
                {language === "en" ? "Switch to Hindi (हिंदी)" : "Switch to English"}
              </Button>
              {user ? (
                <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />{language === "en" ? "Logout" : "लॉगआउट"}
                </Button>
              ) : (
                <Button size="sm" className="w-full" onClick={() => { setCurrentPage("auth"); setMobileMenuOpen(false) }}>
                  {language === "en" ? "Login / Register" : "लॉगिन / पंजीकरण"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
