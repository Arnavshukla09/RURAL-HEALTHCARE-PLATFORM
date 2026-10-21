"use client"

/**
 * components/header/parts/UserMenu.tsx
 *
 * User profile menu, language selector dropdown, mobile SOS button and menu trigger.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Header Subsystem
 */

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Globe,
  ChevronDown,
  Check,
  User,
  LogOut,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react"
import { NotificationBell } from "@/components/NotificationBell"
import { OfflineSyncBadge } from "@/components/OfflineSyncBadge"
import { SUPPORTED_LANGUAGES, getLanguageMetadata } from "@/lib/i18n/detect-language"
import type { RoleBadgeConfig } from "../types"
import type { UserProfile } from "@/types"

interface UserMenuProps {
  user: UserProfile | null
  role: string
  badge: RoleBadgeConfig
  language: string
  setLanguage: (lang: string) => void
  en: boolean
  langRef: React.RefObject<HTMLDivElement>
  langDropOpen: boolean
  setLangDropOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  userRef: React.RefObject<HTMLDivElement>
  userDropOpen: boolean
  setUserDropOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  onGo: (page: string) => void
  onLogout: (e?: React.MouseEvent) => void
}

export function UserMenu({
  user,
  role,
  badge,
  language,
  setLanguage,
  en,
  langRef,
  langDropOpen,
  setLangDropOpen,
  userRef,
  userDropOpen,
  setUserDropOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  onGo,
  onLogout,
}: UserMenuProps) {
  const currentLangMeta = getLanguageMetadata(language)

  return (
    <div className="flex items-center gap-1.5">
      {/* Offline sync queue badge */}
      <OfflineSyncBadge language={language} role={role} />

      {/* Multi-Language Dropdown */}
      <div ref={langRef} className="relative hidden sm:block">
        <button
          onClick={() => setLangDropOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors ${
            role !== "patient"
              ? "border-white/30 text-white hover:bg-white/10"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
          aria-label="Select language"
        >
          <Globe className="h-3.5 w-3.5 text-teal-600" />
          <span className="font-semibold">{currentLangMeta.shortLabel}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${
              langDropOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {langDropOpen && (
          <div className="absolute top-full right-0 mt-1 w-56 max-h-80 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-xl py-1.5 z-50">
            <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {en ? "Choose Language / भाषा चुनें" : "भाषा चुनें / Choose Language"}
            </div>
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code)
                  setLangDropOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors hover:bg-teal-50 hover:text-teal-700 ${
                  language === l.code
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-gray-700"
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-medium text-gray-900">{l.nativeName}</span>
                  <span className="text-[10px] text-gray-400">{l.name}</span>
                </div>
                {language === l.code && <Check className="h-3.5 w-3.5 text-teal-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification Bell */}
      <NotificationBell user={user} language={language} />

      {user ? (
        <div ref={userRef} className="relative hidden sm:block">
          <button
            onClick={() => setUserDropOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors max-w-36 ${
              role !== "patient"
                ? "border-white/30 text-white hover:bg-white/10"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <User
              className={`h-4 w-4 flex-shrink-0 ${
                role !== "patient" ? "text-white" : "text-teal-600"
              }`}
            />
            <span className="truncate">{user.name}</span>
            <ChevronDown
              className={`h-3 w-3 flex-shrink-0 transition-transform ${
                userDropOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {userDropOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-xl py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <span
                  className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full ${badge.color} text-white font-medium`}
                >
                  {badge.label}
                </span>
              </div>
              <button
                onClick={() => onGo("/dashboard")}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {en ? "Dashboard" : "डैशबोर्ड"}
              </button>
              {role === "doctor" && (
                <>
                  <button
                    onClick={() => onGo("/doctor/patients")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Patient Records" : "मरीज़ रिकॉर्ड"}
                  </button>
                  <button
                    onClick={() => onGo("/doctor/requests")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Appointment Requests" : "नई अनुरोध"}
                  </button>
                  <button
                    onClick={() => onGo("/appointments")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Appointments" : "अपॉइंटमेंट"}
                  </button>
                  <button
                    onClick={() => onGo("/directory")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Find Doctors" : "डॉक्टर खोजें"}
                  </button>
                  <button
                    onClick={() => onGo("/locations")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Hospitals" : "अस्पताल"}
                  </button>
                </>
              )}
              {role === "admin" && (
                <>
                  <button
                    onClick={() => onGo("/admin/users")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Manage Users" : "उपयोगकर्ता प्रबंधन"}
                  </button>
                  <button
                    onClick={() => onGo("/admin/campaigns")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Campaigns" : "अभियान"}
                  </button>
                  <button
                    onClick={() => onGo("/admin/appointments")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Appointments" : "अपॉइंटमेंट"}
                  </button>
                  <button
                    onClick={() => onGo("/admin/records")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Records" : "रिकॉर्ड"}
                  </button>
                  <button
                    onClick={() => onGo("/directory")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Find Doctors" : "डॉक्टर खोजें"}
                  </button>
                  <button
                    onClick={() => onGo("/locations")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Hospitals" : "अस्पताल"}
                  </button>
                  <button
                    onClick={() => onGo("/admin/notifications")}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {en ? "Send Notifications" : "सूचनाएं भेजें"}
                  </button>
                </>
              )}
              <div className="border-t border-gray-50 mt-1">
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {en ? "Logout" : "लॉगआउट"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className="hidden sm:inline-flex">
          <Button size="sm" className="gradient-primary text-white text-xs">
            {en ? "Login" : "लॉगिन"}
          </Button>
        </Link>
      )}

      {/* Mobile Direct 1-Tap SOS Button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onGo("/emergency")}
        className="md:hidden flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-sm"
        aria-label={en ? "Emergency SOS" : "आपातकालीन एसओएस"}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-white animate-pulse" />
        <span>SOS</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className={`md:hidden ${
          role !== "patient"
            ? "border-white/30 text-white bg-transparent hover:bg-white/10"
            : ""
        }`}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
    </div>
  )
}
