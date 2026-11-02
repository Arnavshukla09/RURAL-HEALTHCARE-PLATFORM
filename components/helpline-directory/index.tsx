"use client"

/**
 * components/helpline-directory/index.tsx
 *
 * Modular Helpline Directory — Complete State & National Emergency Helpline Index.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Helpline Subsystem
 */

import React, { useState, useEffect, useMemo } from "react"
import { Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  NATIONAL_HELPLINES,
  getCombinedHelplines,
  getAllHelplines,
  type HelplineCategory,
} from "@/lib/emergency/helplines"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import { getLanguageFromCoordinates } from "@/lib/i18n/detect-language"
import { getTranslation } from "@/lib/i18n/translations"

import { CriticalFastDialBar } from "./parts/CriticalFastDialBar"
import { HelplineHeaderControls } from "./parts/HelplineHeaderControls"
import { HelplineCard } from "./parts/HelplineCard"
import type { HelplineDirectoryProps } from "./types"

export function HelplineDirectory({ language, initialCoords }: HelplineDirectoryProps) {
  const trans = getTranslation(language)
  const t = trans.helplines
  const en = language === "en"

  const [viewMode, setViewMode] = useState<"state" | "all">("state")
  const [selectedStateCode, setSelectedStateCode] = useState<string>("23") // Default: MP
  const [selectedCategory, setSelectedCategory] = useState<HelplineCategory>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false)

  // Find selected state object
  const currentStateObj = useMemo(() => {
    return (
      LGD_STATES.find((s: any) => s.code === selectedStateCode) || {
        code: "23",
        nameEn: "Madhya Pradesh",
        nameHi: "मध्य प्रदेश",
      }
    )
  }, [selectedStateCode])

  // Auto-detect user state if coordinates available
  useEffect(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      try {
        const { stateCode } = getLanguageFromCoordinates(initialCoords.lat, initialCoords.lng)
        if (stateCode && LGD_STATES.some((s: any) => s.code === stateCode)) {
          setSelectedStateCode(stateCode)
        }
      } catch {}
    }
  }, [initialCoords])

  // GPS auto-locate handler
  const handleDetectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    setIsDetectingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingLocation(false)
        const { stateCode } = getLanguageFromCoordinates(pos.coords.latitude, pos.coords.longitude)
        if (stateCode && LGD_STATES.some((s: any) => s.code === stateCode)) {
          setSelectedStateCode(stateCode)
          setViewMode("state")
        }
      },
      () => {
        setIsDetectingLocation(false)
      },
      { timeout: 5000, enableHighAccuracy: false }
    )
  }

  // Copy phone number to clipboard
  const handleCopy = (id: string, num: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  // Resolve raw list based on active view mode
  const rawHelplines = useMemo(() => {
    if (viewMode === "state") {
      return getCombinedHelplines(
        currentStateObj.code,
        currentStateObj.nameEn,
        currentStateObj.nameHi
      )
    }
    return getAllHelplines()
  }, [viewMode, currentStateObj])

  // Filter by category and search query
  const filteredHelplines = useMemo(() => {
    return rawHelplines.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle =
          item.serviceEn.toLowerCase().includes(q) ||
          item.serviceHi.toLowerCase().includes(q)
        const matchNumber = item.number.toLowerCase().includes(q)
        const matchDesc =
          item.descriptionEn.toLowerCase().includes(q) ||
          item.descriptionHi.toLowerCase().includes(q)
        const matchState =
          (item.stateNameEn && item.stateNameEn.toLowerCase().includes(q)) ||
          (item.stateNameHi && item.stateNameHi.toLowerCase().includes(q))

        return matchTitle || matchNumber || matchDesc || matchState
      }

      return true
    })
  }, [rawHelplines, selectedCategory, searchQuery])

  // Count metrics
  const stateSpecificCount = useMemo(() => {
    return rawHelplines.filter((h) => !h.isNational).length
  }, [rawHelplines])

  return (
    <div className="space-y-6">
      {/* 1-Tap Fast-Dial Priority Bar */}
      <CriticalFastDialBar en={en} t={t} />

      {/* Comprehensive Directory */}
      <Card className="border-gray-200 bg-white shadow-sm overflow-hidden">
        <HelplineHeaderControls
          en={en}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedStateCode={selectedStateCode}
          setSelectedStateCode={setSelectedStateCode}
          isDetectingLocation={isDetectingLocation}
          handleDetectLocation={handleDetectLocation}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <CardContent className="p-4 sm:p-5 space-y-3 bg-gray-50/50">
          {/* State Banner / Context Label */}
          {viewMode === "state" && (
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-gray-800">
                  {en ? currentStateObj.nameEn : currentStateObj.nameHi}
                </span>
                <span>
                  — {stateSpecificCount} {t.stateHelplines} + {NATIONAL_HELPLINES.length} {t.national}
                </span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                {filteredHelplines.length} results
              </span>
            </div>
          )}

          {/* Helpline Cards Grid */}
          {filteredHelplines.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200 p-6">
              <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">{t.noHelplinesFound}</p>
              <p className="text-xs text-gray-400 mt-1">
                {en
                  ? "Try searching for a different keyword or reset filters."
                  : "कृपया दूसरा शब्द खोजें या फ़िल्टर रीसेट करें।"}
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
              >
                {t.resetFilters}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredHelplines.map((item) => (
                <HelplineCard
                  key={item.id}
                  item={item}
                  en={en}
                  t={t}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HelplineDirectory
