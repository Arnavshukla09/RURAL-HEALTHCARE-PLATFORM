"use client"

/**
 * components/header/parts/DesktopNav.tsx
 *
 * Desktop navigation menu for Doctor, Admin, and Patient/Public roles.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Header Subsystem
 */

import type React from "react"
import { AlertTriangle, ChevronDown } from "lucide-react"
import type { NavItem, UserCareItem } from "../types"
import type { UserProfile } from "@/types"

interface DesktopNavProps {
  role: string
  user: UserProfile | null
  en: boolean
  doctorItems: NavItem[]
  adminItems: NavItem[]
  publicNavItems: NavItem[]
  userCareItems: UserCareItem[]
  careRef: React.RefObject<HTMLDivElement>
  careDropOpen: boolean
  setCareDropOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  isActive: (key: string) => boolean
  onGo: (page: string) => void
}

export function DesktopNav({
  role,
  user,
  en,
  doctorItems,
  adminItems,
  publicNavItems,
  userCareItems,
  careRef,
  careDropOpen,
  setCareDropOpen,
  isActive,
  onGo,
}: DesktopNavProps) {
  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {/* DOCTOR */}
      {role === "doctor" && (
        <>
          {doctorItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => onGo(item.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.key)
                    ? "bg-white/20 text-white"
                    : "text-teal-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
          <button
            onClick={() => onGo("/emergency")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            {en ? "Emergency" : "आपातकाल"}
          </button>
        </>
      )}

      {/* ADMIN */}
      {role === "admin" && (
        <>
          {adminItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => onGo(item.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.key)
                    ? "bg-white/20 text-white"
                    : "text-purple-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </>
      )}

      {/* PATIENT & PUBLIC VISITORS */}
      {role === "patient" && (
        <>
          {publicNavItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => onGo(item.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.key)
                    ? "bg-teal-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}

          {/* My Care Dropdown — ONLY displayed to logged-in users */}
          {user && (
            <div ref={careRef} className="relative">
              <button
                onClick={() => setCareDropOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  userCareItems.some((i) => isActive(i.key))
                    ? "bg-teal-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {en ? "My Care" : "मेरी देखभाल"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    careDropOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {careDropOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-xl py-1 z-50">
                  {userCareItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => onGo(item.key)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-teal-50 hover:text-teal-700 ${
                        isActive(item.key)
                          ? "bg-teal-50 text-teal-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => onGo("/emergency")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive("/emergency")
                ? "bg-red-600 text-white"
                : "text-red-600 hover:bg-red-50"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            {en ? "Emergency" : "आपातकाल"}
          </button>
        </>
      )}
    </nav>
  )
}
