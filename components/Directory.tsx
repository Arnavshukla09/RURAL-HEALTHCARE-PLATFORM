"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Clock, 
  Stethoscope,
  Calendar,
  Navigation,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  X,
  Check,
  Building2,
  Lock
} from "lucide-react"
import { REAL_DOCTORS, RealDoctor, calculateDistanceKm } from "@/lib/data/real-doctors"
import { getTranslation } from "@/lib/i18n/translations"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"

interface DirectoryProps {
  language: string
}

interface SearchableDropdownProps {
  label: string
  placeholder: string
  searchPlaceholder: string
  selectedCode: string
  options: { code: string; nameEn: string; nameHi?: string }[]
  onSelect: (code: string) => void
  disabled?: boolean
  disabledMessage?: string
  language: string
  allOptionLabel?: string
}

function SearchableDropdown({
  label,
  placeholder,
  searchPlaceholder,
  selectedCode,
  options,
  onSelect,
  disabled = false,
  disabledMessage,
  language,
  allOptionLabel
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40)
    } else {
      setSearchTerm("")
    }
  }, [isOpen])

  const selectedItem = options.find((o) => o.code === selectedCode)
  const displayName =
    selectedCode === 'all' || !selectedItem
      ? placeholder
      : language === 'hi' && selectedItem.nameHi
        ? selectedItem.nameHi
        : selectedItem.nameEn

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return options
    const q = searchTerm.toLowerCase().trim()
    return options.filter(
      (o) =>
        o.nameEn.toLowerCase().includes(q) ||
        (o.nameHi && o.nameHi.toLowerCase().includes(q))
    )
  }, [options, searchTerm])

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-700 block mb-1">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        title={disabled && disabledMessage ? disabledMessage : undefined}
        className={`w-full text-xs font-medium border rounded-xl px-3 py-2.5 bg-white text-gray-800 flex items-center justify-between transition-colors shadow-2xs ${
          disabled
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : isOpen
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-200 hover:border-blue-400"
        }`}
      >
        <span className={`truncate pr-1 text-left ${selectedCode !== 'all' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
          {displayName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[220px] z-50 bg-white rounded-xl shadow-xl border border-blue-200 p-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Small search box inside dropdown */}
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          {/* Options list limited to max-h-[190px] with smooth scrolling */}
          <div className="max-h-[190px] overflow-y-auto divide-y divide-gray-50 space-y-0.5">
            {allOptionLabel && (
              <button
                type="button"
                onClick={() => {
                  onSelect('all')
                  setIsOpen(false)
                }}
                className={`w-full text-left py-1.5 px-2.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                  selectedCode === 'all'
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-gray-600 hover:bg-gray-50 font-medium"
                }`}
              >
                <span>{allOptionLabel}</span>
                {selectedCode === 'all' && (
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" />
                )}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-gray-400">
                {language === "hi" ? "कोई परिणाम नहीं मिला" : "No matches found"}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.code === selectedCode
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onSelect(item.code)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left py-1.5 px-2.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">
                      {language === "hi" && item.nameHi ? item.nameHi : item.nameEn}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Directory({ language }: DirectoryProps) {
  const router = useRouter()
  const trans = getTranslation(language)
  const t = trans.directory

  // Pop-Out Hero Universal Search Bar (Searches clinician, specialty, hospital, city, or district)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')

  // Mutual Exclusivity:
  // Mode A: Live GPS & Proximity Radius
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRadius, setSelectedRadius] = useState<number>(50) // 10, 25, 50, 100 km
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)

  // Mode B: State & District Geographic Hierarchy
  const [selectedStateCode, setSelectedStateCode] = useState<string>('all')
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('all')

  // Collapsible Filter Menu state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false)

  // Mutually Exclusive flags: exactly one location filter active at a time
  const isGpsActive = userCoords !== null
  const isStateActive = selectedStateCode !== 'all'

  // Prepared state options for SearchableDropdown
  const stateOptions = useMemo(() => {
    return LGD_STATES.map((s) => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi,
    }))
  }, [])

  // Prepared district options for chosen state
  const districtOptions = useMemo(() => {
    if (selectedStateCode === 'all') return []
    const foundState = LGD_STATES.find(s => s.code === selectedStateCode)
    if (!foundState) return []
    return foundState.districts.map((d) => ({
      code: d.nameEn,
      nameEn: d.nameEn,
      nameHi: d.nameHi,
    }))
  }, [selectedStateCode])

  // Active state name for badge & labels
  const activeStateName = useMemo(() => {
    if (selectedStateCode === 'all') return null
    const st = LGD_STATES.find(s => s.code === selectedStateCode)
    return language === 'hi' && st?.nameHi ? st.nameHi : st?.nameEn || null
  }, [selectedStateCode, language])

  // Active location label for badge
  const locationLabel = useMemo(() => {
    if (userCoords) return language === "hi" ? "वर्तमान GPS स्थान" : "My Current GPS Location"
    if (selectedDistrictName !== 'all') {
      const st = LGD_STATES.find(s => s.code === selectedStateCode)
      const stName = language === 'hi' && st?.nameHi ? st.nameHi : st?.nameEn || ''
      return `${selectedDistrictName}, ${stName}`
    }
    if (selectedStateCode !== 'all') {
      return activeStateName || "Selected State"
    }
    if (searchQuery.trim()) {
      return `"${searchQuery.trim()}"`
    }
    return null
  }, [userCoords, selectedDistrictName, selectedStateCode, activeStateName, searchQuery, language])

  // Flag determining whether user has activated location or universal search
  const hasActiveLocation = Boolean(isGpsActive || isStateActive || searchQuery.trim())

  // GPS Auto-Detection Handler
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
        // Clear state/district selection to enforce mutual exclusivity
        setSelectedStateCode('all')
        setSelectedDistrictName('all')
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
    { key: 'all', label: t.allSpecialties },
    { key: 'general', label: t.general },
    { key: 'cardiology', label: t.cardiology },
    { key: 'pediatrics', label: t.pediatrics },
    { key: 'gynecology', label: t.gynecology },
    { key: 'orthopedics', label: t.orthopedics },
    { key: 'neurology', label: t.neurology },
    { key: 'pulmonology', label: t.pulmonology },
    { key: 'oncology', label: t.oncology },
  ]

  // Pagination State — 10 doctors per page for fast rendering & smooth browsing
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  // Universal Relevance Scoring: searches across clinician name, department, hospital, city, and district
  const getSearchRelevance = (doc: RealDoctor, q: string): number => {
    const cleanQ = q.toLowerCase().trim()
    if (!cleanQ) return 0
    let score = 0
    const name = doc.name.toLowerCase()
    const specName = doc.specialtyName.toLowerCase()
    const spec = doc.specialty.toLowerCase()
    const hosp = doc.hospitalAffiliation.toLowerCase()
    const qual = doc.qualifications ? doc.qualifications.toLowerCase() : ""
    const bio = doc.bio.toLowerCase()
    const dist = doc.districtName.toLowerCase()
    const st = doc.stateName.toLowerCase()
    const loc = doc.location.toLowerCase()

    if (name.includes(cleanQ)) score += 100
    if (specName.includes(cleanQ) || spec.includes(cleanQ)) score += 80
    if (hosp.includes(cleanQ)) score += 60
    if (dist.includes(cleanQ)) score += 50
    if (st.includes(cleanQ) || loc.includes(cleanQ)) score += 40
    if (qual.includes(cleanQ)) score += 30
    if (bio.includes(cleanQ)) score += 20
    return score
  }

  // Filter & Proximity Calculation:
  // Distance is ONLY calculated and filtered if user explicitly opts for GPS
  const processedDoctors = useMemo(() => {
    if (!hasActiveLocation) {
      return []
    }

    // 1. Calculate proximity distance ONLY if GPS is active
    let list: RealDoctor[] = REAL_DOCTORS.map(doc => {
      if (userCoords) {
        const distance = calculateDistanceKm(userCoords.lat, userCoords.lng, doc.lat, doc.lon)
        return { ...doc, distance }
      }
      return { ...doc, distance: undefined }
    })

    // 2. Strict distance radius filter ONLY if GPS is active
    if (userCoords) {
      list = list.filter(doc => doc.distance !== undefined && doc.distance <= selectedRadius)
    }

    // 3. Specialty filter if specified
    if (selectedSpecialty !== 'all') {
      list = list.filter(doc => doc.specialty === selectedSpecialty)
    }

    // 4. State filter if specified (when GPS is not active)
    if (!userCoords && selectedStateCode !== 'all') {
      list = list.filter(doc => doc.stateCode === selectedStateCode)
    }

    // 5. District filter if specified (when GPS is not active)
    if (!userCoords && selectedDistrictName !== 'all') {
      list = list.filter(doc => doc.districtName.toLowerCase().includes(selectedDistrictName.toLowerCase()))
    }

    // 6. Universal Pop-Out Search Bar query filter with relevance check
    if (searchQuery.trim()) {
      list = list.filter(doc => getSearchRelevance(doc, searchQuery) > 0)
    }

    // 7. Sorting:
    // - If searchQuery is active: rank by highest relevance score first!
    // - Then if GPS is active: sort by nearest distance
    // - Otherwise sort by rating & experience
    list.sort((a, b) => {
      if (searchQuery.trim()) {
        const relA = getSearchRelevance(a, searchQuery)
        const relB = getSearchRelevance(b, searchQuery)
        if (relA !== relB) {
          return relB - relA
        }
      }
      if (userCoords && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      return (b.rating ?? 0) - (a.rating ?? 0)
    })

    return list
  }, [hasActiveLocation, userCoords, selectedSpecialty, selectedStateCode, selectedDistrictName, selectedRadius, searchQuery])

  // Pagination Math & Slicing
  const totalPages = Math.max(1, Math.ceil(processedDoctors.length / PAGE_SIZE))
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return processedDoctors.slice(start, start + PAGE_SIZE)
  }, [processedDoctors, currentPage])

  // Reset pagination to page 1 whenever search terms or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedSpecialty, selectedStateCode, selectedDistrictName, selectedRadius, userCoords])

  const getInitials = (name: string) => {
    return name
      .replace(/^(Dr\.|Dr|Prof\.|Prof)\s+/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const resetAllFilters = () => {
    setSearchQuery('')
    setSelectedSpecialty('all')
    setSelectedStateCode('all')
    setSelectedDistrictName('all')
    setSelectedRadius(50)
    setUserCoords(null)
    setLocationStatus(null)
  }

  return (
    <div className="min-h-screen bg-gray-50/70 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{language === "hi" ? "सत्यापित चिकित्सक एवं स्वास्थ्य सुविधा निर्देशिका" : "Clinician & Facility Directory • Radius-Scoped"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t.title}</h1>
          <p className="text-sm text-gray-600">
            {language === "hi" 
              ? "आपके वर्तमान स्थान या चयनित जिले के 10-100 किमी के दायरे में प्रति विशेषज्ञता शीर्ष 10 डॉक्टर।" 
              : "Locate verified doctors strictly within your radius — capped to top 10 specialists per category."}
          </p>
        </div>

        {/* National Facility Map Banner (Directing hospitals to /locations) */}
        <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {language === "hi" ? "अस्पताल, PHC और CHC खोज रहे हैं?" : "Looking for Hospitals, PHCs, CHCs & 24/7 Trauma Centers?"}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {language === "hi" 
                  ? "सभी 1,36,000+ सरकारी स्वास्थ्य केंद्र, बिस्तर उपलब्धता और फोन नंबर हमारे सुविधा मानचित्र पर देखें।" 
                  : "All 136,000+ public hospitals with verified direct phone numbers are mapped on our interactive Facility Map."}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/locations")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>{language === "hi" ? "सुविधा मानचित्र खोलें" : "Open Facility Map"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Pop-Out Hero Universal Search Bar & Collapsible Location Filters */}
        <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* 1. POP-OUT HERO SEARCH BAR (Searches Everything: Doctor, Department, Hospital, City, District) */}
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
              <p className="text-[11px] text-gray-500 px-2">
                {language === "hi"
                  ? "✨ एकीकृत खोज: डॉक्टर का नाम, विभाग, अस्पताल या शहर/ज़िला एक ही जगह खोजें"
                  : "✨ Universal Search: Find by clinician name, medical specialty, hospital affiliation, city, or district"}
              </p>
            </div>

            {/* Filter Toggle Bar + Reset Action */}
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

              {/* Active Filters Clear / Reset */}
              {(isGpsActive || isStateActive || selectedSpecialty !== 'all' || searchQuery.trim()) && (
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

            {/* COLLAPSIBLE MUTUALLY-EXCLUSIVE FILTER MENU */}
            {isFilterMenuOpen && (
              <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OPTION A: Live GPS & Proximity */}
                  <div className={`p-4 rounded-xl border transition-all relative ${
                    isGpsActive
                      ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-100 shadow-xs"
                      : isStateActive
                        ? "bg-gray-100/70 border-gray-200 opacity-40 pointer-events-none select-none"
                        : "bg-white border-gray-200 shadow-2xs"
                  }`}>
                    {/* Banner if faded because State is active */}
                    {isStateActive && (
                      <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-[0.5px] rounded-xl z-10 flex flex-col items-center justify-center p-3 text-center pointer-events-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                          <Lock className="h-3.5 w-3.5 text-amber-600" />
                          <span>
                            {language === "hi"
                              ? "राज्य फ़िल्टर सक्रिय होने के कारण GPS बंद है"
                              : "GPS locked while State/District is chosen"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStateCode('all')
                            setSelectedDistrictName('all')
                          }}
                          className="h-7 text-xs font-bold text-blue-700 border-blue-300 bg-white hover:bg-blue-50 shadow-2xs"
                        >
                          {language === "hi" ? "राज्य फ़िल्टर हटाएं" : "Clear State to Use GPS"}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          isGpsActive ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          <Navigation className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {language === "hi" ? "विकल्प A: डिवाइस GPS एवं निकटता" : "Option A: Device GPS & Proximity"}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {language === "hi" ? "निकटतम डॉक्टरों के लिए GPS दूरी" : "Live distance radius from your coordinates"}
                          </p>
                        </div>
                      </div>
                      {isGpsActive && (
                        <button
                          onClick={() => {
                            setUserCoords(null)
                            setLocationStatus(null)
                          }}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          {language === "hi" ? "GPS हटाएं" : "Clear GPS"}
                        </button>
                      )}
                    </div>

                    {/* GPS Button */}
                    <div className="space-y-3">
                      <Button
                        variant={isGpsActive ? "default" : "outline"}
                        onClick={handleDetectLocation}
                        disabled={isLocating || isStateActive}
                        className={`w-full h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-2 ${
                          isGpsActive
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white"
                        }`}
                      >
                        <Navigation className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
                        <span>
                          {isLocating
                            ? (language === "hi" ? "स्थान खोज रहे हैं..." : "Detecting GPS...")
                            : isGpsActive
                              ? (language === "hi" ? "✓ GPS सक्रिय है (पुनः स्कैन करें)" : "✓ GPS Active (Click to re-scan)")
                              : (language === "hi" ? "मेरा GPS सक्रिय करें" : "Use My Live GPS")}
                        </span>
                      </Button>

                      {/* Radius Selector Pills */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                            {t.radius}
                          </label>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isGpsActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                          }`}>
                            {selectedRadius} km
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[10, 25, 50, 100].map((rad) => (
                            <button
                              key={rad}
                              disabled={!isGpsActive}
                              onClick={() => setSelectedRadius(rad)}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                                selectedRadius === rad && isGpsActive
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                              }`}
                            >
                              {rad} km
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OPTION B: Select State & District Hierarchy */}
                  <div className={`p-4 rounded-xl border transition-all relative ${
                    isStateActive
                      ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-100 shadow-xs"
                      : isGpsActive
                        ? "bg-gray-100/70 border-gray-200 opacity-40 pointer-events-none select-none"
                        : "bg-white border-gray-200 shadow-2xs"
                  }`}>
                    {/* Banner if faded because GPS is active */}
                    {isGpsActive && (
                      <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-[0.5px] rounded-xl z-10 flex flex-col items-center justify-center p-3 text-center pointer-events-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                          <Lock className="h-3.5 w-3.5 text-amber-600" />
                          <span>
                            {language === "hi"
                              ? "GPS चालू होने के कारण राज्य/जिला चयन बंद है"
                              : "State & District locked while GPS is active"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUserCoords(null)
                            setLocationStatus(null)
                          }}
                          className="h-7 text-xs font-bold text-emerald-700 border-emerald-300 bg-white hover:bg-emerald-50 shadow-2xs"
                        >
                          {language === "hi" ? "GPS बंद करें" : "Clear GPS to Select State"}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          isStateActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {language === "hi" ? "विकल्प B: राज्य एवं ज़िला चुनें" : "Option B: Select State & District"}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {language === "hi" ? "संपूर्ण राज्य/ज़िला डॉक्टर सूची देखें" : "Browse full verified doctors catalog"}
                          </p>
                        </div>
                      </div>
                      {isStateActive && (
                        <button
                          onClick={() => {
                            setSelectedStateCode('all')
                            setSelectedDistrictName('all')
                          }}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          {language === "hi" ? "हटाएं" : "Clear State"}
                        </button>
                      )}
                    </div>

                    {/* State & District Searchable Dropdowns with small search boxes */}
                    <div className="space-y-3">
                      <SearchableDropdown
                        label={t.stateFilter}
                        placeholder={language === "hi" ? "राज्य चुनें (सभी राज्य)" : "Select State (All States)"}
                        searchPlaceholder={language === "hi" ? "राज्य खोजें..." : "Type to search state..."}
                        selectedCode={selectedStateCode}
                        options={stateOptions}
                        onSelect={(code) => {
                          setSelectedStateCode(code)
                          setSelectedDistrictName('all')
                        }}
                        disabled={isGpsActive}
                        disabledMessage="Clear GPS first"
                        language={language}
                        allOptionLabel={t.allStates}
                      />

                      <SearchableDropdown
                        label={t.districtFilter}
                        placeholder={
                          selectedStateCode === 'all'
                            ? (language === "hi" ? "पहले राज्य चुनें" : "Select State first")
                            : (language === "hi" ? "ज़िला चुनें (सभी ज़िले)" : "Select District (All Districts)")
                        }
                        searchPlaceholder={language === "hi" ? "ज़िला खोजें..." : "Type to search district..."}
                        selectedCode={selectedDistrictName}
                        options={districtOptions}
                        onSelect={(nameEn) => setSelectedDistrictName(nameEn)}
                        disabled={isGpsActive || selectedStateCode === 'all'}
                        disabledMessage={isGpsActive ? "Clear GPS first" : "Select State first"}
                        language={language}
                        allOptionLabel={t.allDistricts}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specialty Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
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
            </div>
          </CardContent>
        </Card>

        {/* LOCATION GUARD OR DOCTOR DIRECTORY */}
        {!hasActiveLocation ? (
          /* Location Required Prompt Card */
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30 text-center py-12 px-4 rounded-2xl">
            <CardContent className="max-w-md mx-auto space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
                <Navigation className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {language === "hi" ? "पास के डॉक्टर खोजने हेतु स्थान निर्धारित करें" : "Set Your Location to Find Nearby Doctors"}
                </h3>
                <p className="text-xs text-gray-600">
                  {language === "hi"
                    ? "डॉक्टर खोज पूरी तरह से निकटता-आधारित है। सभी डॉक्टरों को एक साथ देखने का विकल्प उपलब्ध नहीं है; कृपया अपना GPS सक्रिय करें या राज्य और जिला चुनें।"
                    : "Doctor listings are strictly proximity-filtered within your chosen radius (capping top 10 per specialist). Search using universal search, activate GPS, or select your State."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Button
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 px-5 rounded-xl flex items-center justify-center gap-2"
                >
                  <Navigation className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
                  <span>{isLocating ? t.detectingLocation : "📍 Use My GPS Location"}</span>
                </Button>
                <Button
                  onClick={() => setIsFilterMenuOpen(true)}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Building2 className="h-4 w-4" />
                  <span>{language === "hi" ? "राज्य एवं ज़िला चुनें" : "Select State & District"}</span>
                </Button>
              </div>

              {/* Quick State Selection Pills */}
              <div className="pt-4 border-t border-blue-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {language === "hi" ? "या लोकप्रिय राज्य चुनें:" : "Or select popular state:"}
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    { code: "23", name: "Madhya Pradesh" },
                    { code: "07", name: "Delhi" },
                    { code: "09", name: "Uttar Pradesh" },
                    { code: "27", name: "Maharashtra" },
                    { code: "08", name: "Rajasthan" },
                    { code: "29", name: "Karnataka" },
                  ].map(s => (
                    <button
                      key={s.code}
                      onClick={() => {
                        setSelectedStateCode(s.code)
                        setSelectedDistrictName('all')
                        setUserCoords(null)
                      }}
                      className="px-2.5 py-1 text-xs bg-white text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium transition"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Active Directory Results (Paginated to 10 doctors per page) */
          <div className="space-y-4">
            {/* Results Filter & Count Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span>{language === "hi" ? "सत्यापित चिकित्सक एवं नोडल संपर्क" : "Clinicians & Verified Contacts"} ({processedDoctors.length})</span>
                </div>
                {userCoords ? (
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-bold">
                    📍 Within {selectedRadius} km (GPS Active)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-semibold">
                    📚 Full Directory ({processedDoctors.length} available)
                  </Badge>
                )}
                {totalPages > 1 && (
                  <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200 text-[10px] font-semibold">
                    Page {currentPage} of {totalPages}
                  </Badge>
                )}
              </div>

              {locationLabel && (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${userCoords ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
                  <span className="font-medium text-gray-700">Near: {locationLabel}</span>
                </div>
              )}
            </div>

            {/* Doctor Cards (10 per page) */}
            {paginatedDoctors.length > 0 ? (
              <div className="space-y-4">
                {paginatedDoctors.map((doctor) => (
                  <Card key={doctor.id} className="hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row gap-5 items-start justify-between">
                        {/* Left: Avatar + Details */}
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-16 w-16 border-2 border-blue-100 shrink-0">
                            <AvatarFallback className="bg-blue-600 text-white font-bold text-base">
                              {getInitials(doctor.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Name + Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>

                              {/* Truthful Verification Badge */}
                              {doctor.recordType === 'facility_nodal_contact' ? (
                                <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-semibold gap-1">
                                  <Building2 className="h-3 w-3 text-blue-600" />
                                  <span>{language === "hi" ? "पीएम-जय सुविधा संपर्क" : "PM-JAY Facility Contact"}</span>
                                </Badge>
                              ) : doctor.verificationStatus === 'independently_verified' && doctor.regNo ? (
                                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>{t.verified} • {doctor.regNo}</span>
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>{t.verified}</span>
                                </Badge>
                              )}

                              {/* Distance Badge — ONLY shown when user explicitly uses GPS */}
                              {userCoords && doctor.distance !== undefined && (
                                <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-bold">
                                  📍 {doctor.distance} {t.kmAway}
                                </Badge>
                              )}

                              {/* Location tag when GPS is NOT active */}
                              {!userCoords && (
                                <Badge variant="outline" className="text-gray-700 bg-gray-50 border-gray-200 text-[10px] font-medium">
                                  📍 {doctor.districtName}, {doctor.stateName}
                                </Badge>
                              )}

                              {doctor.available && (
                                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                                  <Clock className="h-2.5 w-2.5 mr-1" />
                                  {t.available}
                                </Badge>
                              )}
                            </div>

                            {/* Qualifications & Specialty */}
                            <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 flex-wrap">
                              <span>{doctor.specialtyName}</span>
                              {doctor.qualifications && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-gray-600 font-normal">{doctor.qualifications}</span>
                                </>
                              )}
                            </div>

                            {/* Hospital Affiliation */}
                            <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{doctor.hospitalAffiliation}</span>
                            </div>

                            {/* Location Address */}
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                              <span className="truncate">{doctor.location}</span>
                            </div>

                            {/* OPD Timings */}
                            {doctor.opdTimings ? (
                              <div className="text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-amber-200/60 font-medium">
                                <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                                <span>{t.opdTimings}: {doctor.opdTimings}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-gray-200/80 font-medium">
                                <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                                <span>{language === "hi" ? "समय: पुष्टि के लिए कॉल करें" : "Timings: Call to confirm"}</span>
                              </div>
                            )}

                            {/* Rating, Reviews & Experience */}
                            <div className="flex items-center gap-2.5 text-xs text-gray-600 pt-1 flex-wrap">
                              {doctor.rating !== undefined && doctor.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                  <span className="font-bold text-gray-800">{doctor.rating}</span>
                                  {doctor.reviewCount && (
                                    <span className="text-[11px] text-gray-400">({doctor.reviewCount} reviews)</span>
                                  )}
                                </div>
                              )}
                              {doctor.patientRecommendationPercent && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200/60">
                                    👍 {doctor.patientRecommendationPercent}% Recommended
                                  </span>
                                </>
                              )}
                              {doctor.experience !== undefined && doctor.experience > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{doctor.experience} {t.yearsExp}</span>
                                </>
                              )}
                              {doctor.phone ? (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span className="font-mono">{doctor.phone}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span className="text-[11px] italic">
                                      {language === "hi" ? "फोन असूचीबद्ध (ओपीडी)" : "Phone unlisted (OPD)"}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Consultation Fees & Call to Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                          <div className="text-left lg:text-right">
                            {doctor.consultationFee !== undefined && doctor.consultationFee !== null ? (
                              <>
                                <p className="text-xl font-black text-emerald-700">
                                  {doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : t.free}
                                </p>
                                <p className="text-[11px] text-gray-400 font-medium">
                                  {doctor.consultationFee > 0 ? "OPD Consultation" : "Govt Free OPD"}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-gray-700">
                                  {language === "hi" ? "शुल्क: सूचीबद्ध नहीं" : "Fee: Not listed"}
                                </p>
                                <p className="text-[11px] text-gray-400 font-medium">
                                  {language === "hi" ? "अस्पताल संपर्क" : "Hospital contact"}
                                </p>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2">
                            {doctor.phone ? (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                                onClick={() => window.open(`tel:${doctor.phone}`)}
                              >
                                <Phone className="h-3.5 w-3.5" />
                                <span>{t.callNow}</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="text-gray-400 font-medium text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 cursor-not-allowed bg-gray-50 border-gray-200"
                              >
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                <span>{language === "hi" ? "असूचीबद्ध" : "Unlisted"}</span>
                              </Button>
                            )}

                            {doctor.recordType === 'clinician' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-xs h-8 px-3 font-semibold rounded-lg flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                onClick={() => router.push("/consultation")}
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{t.bookAppointment}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination Controls Bar */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs mt-4">
                    <p className="text-xs text-gray-600 font-medium">
                      {language === "hi"
                        ? `कुल ${processedDoctors.length} में से ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, processedDoctors.length)} डॉक्टर (पृष्ठ ${currentPage} / ${totalPages})`
                        : `Showing ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, processedDoctors.length)} of ${processedDoctors.length} doctors (Page ${currentPage} of ${totalPages})`}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(p => Math.max(1, p - 1))
                          window.scrollTo({ top: 300, behavior: 'smooth' })
                        }}
                        disabled={currentPage === 1}
                        className="h-8 text-xs gap-1 px-2.5"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>{language === "hi" ? "पिछला" : "Previous"}</span>
                      </Button>

                      {/* Page number buttons */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let p = i + 1
                          if (totalPages > 5 && currentPage > 3) {
                            p = Math.min(currentPage - 2 + i, totalPages - 4 + i)
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => {
                                setCurrentPage(p)
                                window.scrollTo({ top: 300, behavior: 'smooth' })
                              }}
                              className={`h-8 w-8 text-xs font-semibold rounded-lg transition-colors ${
                                currentPage === p
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                              }`}
                            >
                              {p}
                            </button>
                          )
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(p => Math.min(totalPages, p + 1))
                          window.scrollTo({ top: 300, behavior: 'smooth' })
                        }}
                        disabled={currentPage === totalPages}
                        className="h-8 text-xs gap-1 px-2.5"
                      >
                        <span>{language === "hi" ? "अगला" : "Next"}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-6 space-y-3">
                <Stethoscope className="h-12 w-12 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-800">
                  {language === "hi" ? "कोई डॉक्टर नहीं मिला" : "No Verified Doctors Found"}
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  {searchQuery
                    ? (language === "hi"
                        ? `'${searchQuery}' के लिए कोई डॉक्टर नहीं मिला। कृपया वर्तनी जांचें या 'सभी विशेषताएं' चुनें।`
                        : `No doctors found matching '${searchQuery}'. Try checking spelling or choosing 'All Specialties'.`)
                    : userCoords
                      ? `No verified practitioners found within ${selectedRadius} km of your GPS location. Try expanding the radius to 50 km or 100 km.`
                      : "No verified practitioners match the selected state/district filters. Try expanding your search."}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button onClick={resetAllFilters} variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
                    <RotateCcw className="h-3 w-3" />
                    <span>{t.resetFilters}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
