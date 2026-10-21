"use client"

/**
 * components/directory/index.tsx
 *
 * Clinician & Facility Directory — radius-scoped and geographic hierarchy browser.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollableFilterRow } from "@/components/ui/scrollable-filter-row"
import {
  Search,
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { REAL_DOCTORS, RealDoctor, calculateDistanceKm } from "@/lib/data/real-doctors"
import { getTranslation } from "@/lib/i18n/translations"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import type { DirectoryProps } from "./types"
import { LocationGuardPrompt } from "./parts/LocationGuardPrompt"
import { LocationFiltersPanel } from "./parts/LocationFiltersPanel"
import { DirectoryHeader } from "./parts/DirectoryHeader"
import { DirectoryResults } from "./parts/DirectoryResults"

export function Directory({ language }: DirectoryProps) {
  const trans = getTranslation(language)
  const t = trans.directory

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")

  // Mutual Exclusivity: Live GPS vs State & District
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRadius, setSelectedRadius] = useState<number>(50)
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [, setLocationStatus] = useState<string | null>(null)

  const [selectedStateCode, setSelectedStateCode] = useState<string>("all")
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("all")
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false)

  const isGpsActive = userCoords !== null
  const isStateActive = selectedStateCode !== "all"

  const stateOptions = useMemo(() => {
    return LGD_STATES.map((s) => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi,
    }))
  }, [])

  const districtOptions = useMemo(() => {
    if (selectedStateCode === "all") return []
    const foundState = LGD_STATES.find((s) => s.code === selectedStateCode)
    if (!foundState) return []
    return foundState.districts.map((d) => ({
      code: d.nameEn,
      nameEn: d.nameEn,
      nameHi: d.nameHi,
    }))
  }, [selectedStateCode])

  const activeStateName = useMemo(() => {
    if (selectedStateCode === "all") return null
    const st = LGD_STATES.find((s) => s.code === selectedStateCode)
    return language === "hi" && st?.nameHi ? st.nameHi : st?.nameEn || null
  }, [selectedStateCode, language])

  const locationLabel = useMemo(() => {
    if (userCoords) return language === "hi" ? "वर्तमान GPS स्थान" : "My Current GPS Location"
    if (selectedDistrictName !== "all") {
      const st = LGD_STATES.find((s) => s.code === selectedStateCode)
      const stName = language === "hi" && st?.nameHi ? st.nameHi : st?.nameEn || ""
      return `${selectedDistrictName}, ${stName}`
    }
    if (selectedStateCode !== "all") {
      return activeStateName || "Selected State"
    }
    if (searchQuery.trim()) {
      return `"${searchQuery.trim()}"`
    }
    return null
  }, [userCoords, selectedDistrictName, selectedStateCode, activeStateName, searchQuery, language])

  const hasActiveLocation = Boolean(isGpsActive || isStateActive || searchQuery.trim())

  const handleDetectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    setLocationStatus(t.detectingLocation)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserCoords(coords)
        setSelectedStateCode("all")
        setSelectedDistrictName("all")
        setLocationStatus(`GPS: ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`)
      },
      () => {
        setIsLocating(false)
        setLocationStatus("Could not detect location. Please select State/District.")
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }

  const specialties = [
    { key: "all", label: t.allSpecialties },
    { key: "general", label: t.general },
    { key: "cardiology", label: t.cardiology },
    { key: "pediatrics", label: t.pediatrics },
    { key: "gynecology", label: t.gynecology },
    { key: "orthopedics", label: t.orthopedics },
    { key: "neurology", label: t.neurology },
    { key: "pulmonology", label: t.pulmonology },
    { key: "oncology", label: t.oncology },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  const getSearchRelevance = (doc: RealDoctor, q: string): number => {
    const cleanQ = q.toLowerCase().trim()
    if (!cleanQ) return 0
    let score = 0
    if (doc.name.toLowerCase().includes(cleanQ)) score += 100
    if (doc.specialtyName.toLowerCase().includes(cleanQ) || doc.specialty.toLowerCase().includes(cleanQ)) score += 80
    if (doc.hospitalAffiliation.toLowerCase().includes(cleanQ)) score += 60
    if (doc.districtName.toLowerCase().includes(cleanQ)) score += 50
    if (doc.stateName.toLowerCase().includes(cleanQ) || doc.location.toLowerCase().includes(cleanQ)) score += 40
    if (doc.qualifications && doc.qualifications.toLowerCase().includes(cleanQ)) score += 30
    if (doc.bio.toLowerCase().includes(cleanQ)) score += 20
    return score
  }

  const processedDoctors = useMemo(() => {
    if (!hasActiveLocation) return []

    let list: RealDoctor[] = REAL_DOCTORS.map((doc) => {
      if (userCoords) {
        const distance = calculateDistanceKm(userCoords.lat, userCoords.lng, doc.lat, doc.lon)
        return { ...doc, distance }
      }
      return { ...doc, distance: undefined }
    })

    if (userCoords) {
      list = list.filter((doc) => doc.distance !== undefined && doc.distance <= selectedRadius)
    }

    if (selectedSpecialty !== "all") {
      list = list.filter((doc) => doc.specialty === selectedSpecialty)
    }

    if (!userCoords && selectedStateCode !== "all") {
      list = list.filter((doc) => doc.stateCode === selectedStateCode)
    }

    if (!userCoords && selectedDistrictName !== "all") {
      list = list.filter((doc) => doc.districtName.toLowerCase().includes(selectedDistrictName.toLowerCase()))
    }

    if (searchQuery.trim()) {
      list = list.filter((doc) => getSearchRelevance(doc, searchQuery) > 0)
    }

    list.sort((a, b) => {
      if (searchQuery.trim()) {
        const relA = getSearchRelevance(a, searchQuery)
        const relB = getSearchRelevance(b, searchQuery)
        if (relA !== relB) return relB - relA
      }
      if (userCoords && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      return (b.rating ?? 0) - (a.rating ?? 0)
    })

    return list
  }, [hasActiveLocation, userCoords, selectedSpecialty, selectedStateCode, selectedDistrictName, selectedRadius, searchQuery])

  const totalPages = Math.max(1, Math.ceil(processedDoctors.length / PAGE_SIZE))
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return processedDoctors.slice(start, start + PAGE_SIZE)
  }, [processedDoctors, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedSpecialty, selectedStateCode, selectedDistrictName, selectedRadius, userCoords])

  const resetAllFilters = () => {
    setSearchQuery("")
    setSelectedSpecialty("all")
    setSelectedStateCode("all")
    setSelectedDistrictName("all")
    setSelectedRadius(50)
    setUserCoords(null)
    setLocationStatus(null)
  }

  return (
    <div className="min-h-screen bg-gray-50/70 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <DirectoryHeader language={language} title={t.title} />

        {/* Search Bar & Filters */}
        <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="relative flex items-center bg-white rounded-2xl border-2 border-blue-200 shadow-sm hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100/70 transition-all p-1.5 sm:p-2">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-1">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <Input
                  type="text"
                  placeholder={
                    language === "hi"
                      ? "डॉक्टर, विशेषता, अस्पताल, शहर या ज़िला खोजें (जैसे डॉ. शर्मा, हृदय रोग, एम्स, भोपाल)..."
                      : "Search doctor, specialty, hospital, city or district (e.g. Dr. Goenka, Cardiology, AIIMS, Bhopal)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 shadow-none text-xs sm:text-sm md:text-base font-medium px-3 h-10 sm:h-11 focus-visible:ring-0 placeholder:text-gray-400 text-gray-900 bg-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center shrink-0 mr-1"
                    title="Clear Search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
              <Button
                variant={isFilterMenuOpen ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                className={`h-9 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isFilterMenuOpen
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    : isGpsActive || isStateActive
                      ? "border-blue-300 bg-blue-50/80 text-blue-700 hover:bg-blue-100"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>
                  {language === "hi"
                    ? isFilterMenuOpen ? "स्थान फ़िल्टर छुपाएं" : "स्थान एवं निकटता फ़िल्टर"
                    : isFilterMenuOpen ? "Hide Location Filters" : "Location & Proximity Filters"}
                </span>
                {isGpsActive ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">
                    GPS: {selectedRadius}km
                  </Badge>
                ) : isStateActive ? (
                  <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-4 truncate max-w-[120px]">
                    {activeStateName}
                  </Badge>
                ) : null}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isFilterMenuOpen ? "rotate-180" : ""}`} />
              </Button>

              {(isGpsActive || isStateActive || selectedSpecialty !== "all" || searchQuery.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllFilters}
                  className="h-8 text-xs text-gray-500 hover:text-red-600 flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t.resetFilters}</span>
                </Button>
              )}
            </div>

            {isFilterMenuOpen && (
              <LocationFiltersPanel
                language={language}
                t={t}
                isGpsActive={isGpsActive}
                isStateActive={isStateActive}
                userCoords={userCoords}
                setUserCoords={setUserCoords}
                selectedRadius={selectedRadius}
                setSelectedRadius={setSelectedRadius}
                isLocating={isLocating}
                handleDetectLocation={handleDetectLocation}
                setLocationStatus={setLocationStatus}
                selectedStateCode={selectedStateCode}
                setSelectedStateCode={setSelectedStateCode}
                selectedDistrictName={selectedDistrictName}
                setSelectedDistrictName={setSelectedDistrictName}
                stateOptions={stateOptions}
                districtOptions={districtOptions}
              />
            )}

            {/* Specialty Filter Chips */}
            <ScrollableFilterRow contentClassName="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {specialties.map((specialty) => (
                <button
                  key={specialty.key}
                  onClick={() => setSelectedSpecialty(specialty.key)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
                    selectedSpecialty === specialty.key
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{specialty.label}</span>
                </button>
              ))}
            </ScrollableFilterRow>
          </CardContent>
        </Card>

        {/* Directory Results */}
        {!hasActiveLocation ? (
          <LocationGuardPrompt
            language={language}
            t={t}
            isLocating={isLocating}
            onDetectLocation={handleDetectLocation}
            onOpenFilterMenu={() => setIsFilterMenuOpen(true)}
            onSelectState={(code) => {
              setSelectedStateCode(code)
              setSelectedDistrictName("all")
              setUserCoords(null)
            }}
          />
        ) : (
          <DirectoryResults
            language={language}
            t={t}
            userCoords={userCoords}
            selectedRadius={selectedRadius}
            processedDoctors={processedDoctors}
            paginatedDoctors={paginatedDoctors}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            locationLabel={locationLabel}
            searchQuery={searchQuery}
            resetAllFilters={resetAllFilters}
          />
        )}
      </div>
    </div>
  )
}

export default Directory
