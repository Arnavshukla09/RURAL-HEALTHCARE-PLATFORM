"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useApp } from "@/components/providers/AppProvider"
import {
  retranslateCurrentPage,
  hideGoogleTranslateBanner,
  installNavigationTranslationPreserver,
} from "@/lib/i18n/google-translate"

/**
 * TranslationRouteObserver
 *
 * Ensures that when a user selects an Indian regional language (Telugu, Marathi,
 * Bengali, Tamil, Gujarati, etc.), navigating between pages continuously maintains
 * the active translation across the entire application without falling back to English.
 */
export function TranslationRouteObserver() {
  const pathname = usePathname()
  const { language } = useApp()
  const isFirstMount = useRef(true)

  useEffect(() => {
    installNavigationTranslationPreserver()
  }, [])

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    if (language && language !== "en") {
      // Re-trigger translation on newly mounted SPA route elements
      const timer = setTimeout(() => {
        retranslateCurrentPage(language)
        hideGoogleTranslateBanner()
      }, 120)

      return () => clearTimeout(timer)
    }
  }, [pathname, language])

  return null
}
