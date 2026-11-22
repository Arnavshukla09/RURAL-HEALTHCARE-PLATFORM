"use client"

/**
 * components/header/parts/MobileMenu.tsx
 *
 * Mobile dropdown navigation overlay for Doctor, Admin, and Patient/Public roles.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Header Subsystem
 */

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, LogOut } from "lucide-react"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/detect-language"
import type { NavItem, UserCareItem } from "../types"
import type { UserProfile } from "@/types"

interface MobileMenuProps {
  role: string
  user: UserProfile | null
  en: boolean
  doctorItems: NavItem[]
  adminItems: NavItem[]
  publicNavItems: NavItem[]
  userCareItems: UserCareItem[]
  language: string
  setLanguage: (lang: string) => void
  setMobileMenuOpen: (open: boolean) => void
  isActive: (key: string) => boolean
  onGo: (page: string) => void
  onLogout: (e?: React.MouseEvent) => void
}

export function MobileMenu({
  role,
  user,
  en,
  doctorItems,
  adminItems,
  publicNavItems,
  userCareItems,
  language,
  setLanguage,
  setMobileMenuOpen,
  isActive,
  onGo,
  onLogout,
}: MobileMenuProps) {
  return (
    <div
      className={`md:hidden border-t py-3 space-y-1 ${
        role !== "patient" ? "border-white/20" : "border-gray-100 bg-white"
      }`}
    >
      {/* DOCTOR */}
      {role === "doctor" && (
        <>
          {doctorItems.map((item) => {
            const Icon = item.icon
            return (
              <button data-voice-control="ui.56fb054a105d7f1b"
                key={item.key}
                onClick={() => onGo(item.key)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-teal-100 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
          <button data-voice-control="ui.bc0c7b4455f5572d"
            onClick={() => onGo("/emergency")}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-300 hover:bg-red-900/20 rounded-lg"
          >
            <AlertTriangle className="h-4 w-4" />
            {en ? "Emergency" : "आपातकाल"}
          </button>
        </>
      )}

      {/* ADMIN */}
      {role === "admin" &&
        adminItems.map((item) => {
          const Icon = item.icon
          return (
            <button data-voice-control="ui.0cbe5463fc60f759"
              key={item.key}
              onClick={() => onGo(item.key)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-purple-100 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}

      {/* PATIENT & PUBLIC */}
      {role === "patient" && (
        <>
          {publicNavItems.map((item) => {
            const Icon = item.icon
            return (
              <button data-voice-control="ui.c912ae6b42347bb1"
                key={item.key}
                onClick={() => onGo(item.key)}
                className={`w-full flex items-center gap-2 px-4 py-3 text-sm rounded-lg ${
                  isActive(item.key)
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}

          {/* My Care Section — ONLY displayed for logged-in users */}
          {user && (
            <div className="py-1 border-t border-b border-gray-100 my-1">
              <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {en ? "My Care" : "मेरी देखभाल"}
              </div>
              {userCareItems.map((item) => (
                <button data-voice-control="ui.ce0e7d4f08ede2d0"
                  key={item.key}
                  onClick={() => onGo(item.key)}
                  className={`w-full text-left px-6 py-2.5 text-sm rounded-lg ${
                    isActive(item.key)
                      ? "bg-teal-50 text-teal-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <button data-voice-control="ui.ca79dd067c0f02d9"
            onClick={() => onGo("/emergency")}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <AlertTriangle className="h-4 w-4" />
            {en ? "Emergency" : "आपातकाल"}
          </button>
        </>
      )}

      {/* Language selector & auth button */}
      <div className="pt-2 border-t border-gray-100 space-y-2 px-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">
          {en ? "Language / भाषा" : "भाषा / Language"}
        </div>
        <div className="flex flex-wrap gap-1 px-1">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button data-voice-control="ui.9bc49ff927622cfc"
              key={l.code}
              onClick={() => {
                setLanguage(l.code)
                setMobileMenuOpen(false)
              }}
              className={`px-2.5 py-1 text-xs rounded-md border font-medium transition ${
                language === l.code
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
        {user ? (
          <button data-voice-control="ui.b644278e54304d80"
            onClick={onLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 rounded-lg flex items-center gap-2 hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            {en ? "Logout" : "लॉगआउट"}
          </button>
        ) : (
          <Link data-voice-control="ui.4f0c1a9dc3b76beb"
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full"
          >
            <Button data-voice-control="ui.9e2b6c402ae34d33" size="sm" className="w-full gradient-primary text-white">
              {en ? "Login / Register" : "लॉगिन / पंजीकरण"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
