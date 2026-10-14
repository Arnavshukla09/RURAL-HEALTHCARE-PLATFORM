"use client"

import React, { useEffect, useState } from "react"
import { Globe, X, Check } from "lucide-react"
import { useApp } from "@/components/providers/AppProvider"
import {
  getDeviceLanguage,
  getLanguageFromCoordinates,
  getLanguageMetadata,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/detect-language"

export function LanguageSuggestionBanner() {
  const { language, setLanguage } = useApp()
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null)
  const [source, setSource] = useState<"device" | "location">("device")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if dismissed or already explicitly chosen
    if (typeof window === "undefined") return

    try {
      const dismissed = localStorage.getItem("rhcp_language_dismissed")
      const userChoice = localStorage.getItem("rhcp_language")
      if (dismissed || userChoice) {
        return
      }
    } catch {}

    // 1. Device language detection
    const deviceLang = getDeviceLanguage()
    if (deviceLang && deviceLang !== language && deviceLang !== "en") {
      setSuggestedCode(deviceLang)
      setSource("device")
      setVisible(true)
      return
    }

    // 2. Geolocation language suggestion (non-blocking)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            const dismissed = localStorage.getItem("rhcp_language_dismissed")
            if (dismissed) return

            const { languageCode } = getLanguageFromCoordinates(
              pos.coords.latitude,
              pos.coords.longitude
            )

            if (languageCode && languageCode !== language && languageCode !== "en") {
              setSuggestedCode(languageCode)
              setSource("location")
              setVisible(true)
            }
          } catch {}
        },
        () => {
          // Geolocation declined or unavailable — keep silent
        },
        { timeout: 5000, maximumAge: 3600000 }
      )
    }
  }, [language])

  if (!visible || !suggestedCode) return null

  const meta = getLanguageMetadata(suggestedCode)

  const handleAccept = () => {
    setLanguage(suggestedCode)
    try {
      localStorage.setItem("rhcp_language_dismissed", "true")
    } catch {}
    setVisible(false)
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem("rhcp_language_dismissed", "true")
    } catch {}
    setVisible(false)
  }

  return (
    <aside aria-label="Language preference suggestion" className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white shadow-md relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-white/10 rounded-lg flex-shrink-0">
            <Globe className="h-4 w-4 text-teal-200" />
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-white">
              {meta.nativeName} ({meta.name})
            </span>
            <span className="text-teal-100 ml-1.5 hidden sm:inline">
              {source === "location"
                ? `— Based on your region, would you prefer viewing the platform in ${meta.nativeName}?`
                : `— We noticed your device language is ${meta.name}. Switch to ${meta.nativeName}?`}
            </span>
            <span className="text-teal-100 ml-1 sm:hidden">
              — Switch to {meta.nativeName}?
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleAccept}
            className="flex items-center gap-1 px-3 py-1 bg-white text-teal-900 rounded-md text-xs font-semibold hover:bg-teal-50 transition shadow-sm"
          >
            <Check className="h-3.5 w-3.5 text-teal-700" />
            <span>Switch to {meta.nativeName}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-2.5 py-1 text-xs text-teal-200 hover:text-white transition"
          >
            Keep {language === "hi" ? "हिन्दी" : "English"}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-teal-300 hover:text-white rounded transition"
            aria-label="Dismiss language suggestion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
