"use client"

/**
 * components/header/index.tsx
 *
 * Modularized Header component for Rural Healthcare Platform.
 * Supports Doctor, Admin, and Patient role views, role badges, multi-language switching,
 * offline synchronization status, and clean sign-out with cache purges.
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Header Subsystem
 */

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useApp } from "@/components/providers/AppProvider"
import { wipeClientCachesOnSignOut } from "@/lib/offline/cache-cleaner"
import { getNavConfigs } from "./types"
import { DesktopNav } from "./parts/DesktopNav"
import { UserMenu } from "./parts/UserMenu"
import { MobileMenu } from "./parts/MobileMenu"

export function Header() {
  const { user, setUser, language, setLanguage } = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [careDropOpen, setCareDropOpen] = useState(false)
  const [userDropOpen, setUserDropOpen] = useState(false)
  const [langDropOpen, setLangDropOpen] = useState(false)
  const careRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  const en = language === "en"
  const role = user?.role || "patient"
  const { doctorItems, adminItems, publicNavItems, userCareItems, roleBadge } =
    getNavConfigs(en)
  const badge = roleBadge[role] || roleBadge.patient

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (careRef.current && !careRef.current.contains(e.target as Node)) setCareDropOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangDropOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setUser(null)
    setUserDropOpen(false)
    setMobileMenuOpen(false)
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("rhcp_user_profile")
      } catch {}
    }

    wipeClientCachesOnSignOut().catch((err) =>
      console.warn("[Header] Cache clear warning:", err)
    )

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.warn("[Header] SignOut warning:", err)
    }

    window.location.href = "/"
  }

  const go = (page: string) => {
    setMobileMenuOpen(false)
    setCareDropOpen(false)
    setUserDropOpen(false)
    if (language !== "en") {
      window.location.href = page
      return
    }
    router.push(page)
  }

  const isActive = (key: string) => pathname === key || pathname.startsWith(key + "/")

  const headerBg =
    role === "doctor"
      ? "bg-teal-900 border-teal-800"
      : role === "admin"
      ? "bg-purple-900 border-purple-800"
      : "bg-white border-gray-200"

  const homeDestination = user
    ? role === "admin"
      ? "/admin/dashboard"
      : role === "doctor"
      ? "/doctor/dashboard"
      : "/dashboard"
    : "/"

  return (
    <header className={`border-b sticky top-0 z-40 shadow-sm ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer gap-2 flex-shrink-0"
            onClick={() => go(homeDestination)}
          >
            <Heart
              className={`h-6 w-6 ${role !== "patient" ? "text-white" : "text-teal-600"}`}
            />
            <div className="flex items-center gap-1.5">
              <span
                className={`text-base font-bold hidden sm:block ${
                  role !== "patient" ? "text-white" : "text-teal-700"
                }`}
              >
                {en ? "RuralHealth" : "ग्रामीण स्वास्थ्य"}
              </span>
              {role !== "patient" && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color} text-white font-semibold`}
                >
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Nav */}
          <DesktopNav
            role={role}
            user={user}
            en={en}
            doctorItems={doctorItems}
            adminItems={adminItems}
            publicNavItems={publicNavItems}
            userCareItems={userCareItems}
            careRef={careRef as any}
            careDropOpen={careDropOpen}
            setCareDropOpen={setCareDropOpen}
            isActive={isActive}
            onGo={go}
          />

          {/* Right Menu (User, Lang, SOS, Notifications) */}
          <UserMenu
            user={user}
            role={role}
            badge={badge}
            language={language}
            setLanguage={setLanguage}
            en={en}
            langRef={langRef as any}
            langDropOpen={langDropOpen}
            setLangDropOpen={setLangDropOpen}
            userRef={userRef as any}
            userDropOpen={userDropOpen}
            setUserDropOpen={setUserDropOpen}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            onGo={go}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <MobileMenu
            role={role}
            user={user}
            en={en}
            doctorItems={doctorItems}
            adminItems={adminItems}
            publicNavItems={publicNavItems}
            userCareItems={userCareItems}
            language={language}
            setLanguage={setLanguage}
            setMobileMenuOpen={setMobileMenuOpen}
            isActive={isActive}
            onGo={go}
            onLogout={handleLogout}
          />
        )}
      </div>
    </header>
  )
}

export default Header
