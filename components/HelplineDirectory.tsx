"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Phone,
  Search,
  MapPin,
  Globe,
  Filter,
  Check,
  Copy,
  ExternalLink,
  Shield,
  HeartPulse,
  Users,
  Brain,
  AlertTriangle,
  Building2,
  Flame,
  Clock,
  Sparkles,
  Zap,
  PhoneCall,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import {
  HelplineItem,
  HelplineCategory,
  NATIONAL_HELPLINES,
  getCombinedHelplines,
  getAllHelplines,
} from "@/lib/emergency/helplines"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import { getLanguageFromCoordinates } from "@/lib/i18n/detect-language"
import { getTranslation } from "@/lib/i18n/translations"

interface HelplineDirectoryProps {
  language: string
  initialCoords?: { lat: number; lng: number }
}

// Visual category configurations: distinctive colors, visual figures, and accent borders
const CATEGORY_THEMES: Record<
  HelplineCategory,
  {
    en: string
    hi: string
    icon: any
    badgeBg: string
    badgeText: string
    iconBoxBg: string
    iconBoxColor: string
    cardBorder: string
    cardBg: string
    btnBg: string
  }
> = {
  all: {
    en: "All Services",
    hi: "सभी सेवाएं",
    icon: Filter,
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-800",
    iconBoxBg: "bg-gray-100",
    iconBoxColor: "text-gray-700",
    cardBorder: "border-l-4 border-l-gray-400",
    cardBg: "bg-white",
    btnBg: "bg-gray-800 hover:bg-gray-900",
  },
  medical: {
    en: "Medical & Ambulance",
    hi: "चिकित्सा व एम्बुलेंस",
    icon: HeartPulse,
    badgeBg: "bg-red-50",
    badgeText: "text-red-700 border border-red-200",
    iconBoxBg: "bg-red-100/80",
    iconBoxColor: "text-red-600",
    cardBorder: "border-l-4 border-l-red-500",
    cardBg: "bg-red-50/20",
    btnBg: "bg-red-600 hover:bg-red-700",
  },
  police_fire: {
    en: "Police & Fire Force",
    hi: "पुलिस व अग्निशमन",
    icon: Shield,
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700 border border-blue-200",
    iconBoxBg: "bg-blue-100/80",
    iconBoxColor: "text-blue-700",
    cardBorder: "border-l-4 border-l-blue-600",
    cardBg: "bg-blue-50/20",
    btnBg: "bg-blue-600 hover:bg-blue-700",
  },
  women_child: {
    en: "Women & Child Safety",
    hi: "महिला एवं बाल सुरक्षा",
    icon: Users,
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700 border border-purple-200",
    iconBoxBg: "bg-purple-100/80",
    iconBoxColor: "text-purple-700",
    cardBorder: "border-l-4 border-l-purple-500",
    cardBg: "bg-purple-50/20",
    btnBg: "bg-purple-600 hover:bg-purple-700",
  },
  mental_health: {
    en: "Mental Health Crisis",
    hi: "मानसिक स्वास्थ्य",
    icon: Brain,
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700 border border-emerald-200",
    iconBoxBg: "bg-emerald-100/80",
    iconBoxColor: "text-emerald-700",
    cardBorder: "border-l-4 border-l-emerald-500",
    cardBg: "bg-emerald-50/20",
    btnBg: "bg-emerald-600 hover:bg-emerald-700",
  },
  disaster: {
    en: "Disaster & Flood Relief",
    hi: "आपदा एवं राहत",
    icon: AlertTriangle,
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800 border border-amber-200",
    iconBoxBg: "bg-amber-100/80",
    iconBoxColor: "text-amber-700",
    cardBorder: "border-l-4 border-l-amber-500",
    cardBg: "bg-amber-50/20",
    btnBg: "bg-amber-600 hover:bg-amber-700",
  },
  governance: {
    en: "CM Helpline & Grievance",
    hi: "सीएम व जन शिकायत",
    icon: Building2,
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700 border border-sky-200",
    iconBoxBg: "bg-sky-100/80",
    iconBoxColor: "text-sky-700",
    cardBorder: "border-l-4 border-l-sky-500",
    cardBg: "bg-sky-50/20",
    btnBg: "bg-sky-600 hover:bg-sky-700",
  },
}

// Always-on-top Critical Emergency Fast-Dial numbers (National Lifelines)
const CRITICAL_FAST_DIAL = [
  {
    number: "112",
    serviceEn: "National Emergency (ERSS)",
    serviceHi: "एकीकृत आपातकालीन सेवा (ERSS)",
    category: "Unified Emergency (Police / Fire / Medical)",
    icon: Shield,
    color: "from-blue-600 to-indigo-700",
    pillBg: "bg-blue-600",
    lightBg: "bg-blue-50 border-blue-200 text-blue-900",
  },
  {
    number: "108",
    serviceEn: "Ambulance Emergency",
    serviceHi: "आपातकालीन एम्बुलेंस सेवा",
    category: "Free Emergency Medical Response",
    icon: HeartPulse,
    color: "from-red-600 to-rose-700",
    pillBg: "bg-red-600",
    lightBg: "bg-red-50 border-red-200 text-red-900",
  },
  {
    number: "102",
    serviceEn: "Maternity & Infant Ambulance",
    serviceHi: "मातृ एवं शिशु एम्बुलेंस",
    category: "Janani Shishu Suraksha",
    icon: Users,
    color: "from-rose-500 to-pink-600",
    pillBg: "bg-rose-600",
    lightBg: "bg-rose-50 border-rose-200 text-rose-900",
  },
  {
    number: "101",
    serviceEn: "Fire Brigade Emergency",
    serviceHi: "अग्निशमन सेवा (दमकल)",
    category: "Fire & Rescue Operations",
    icon: Flame,
    color: "from-amber-600 to-orange-700",
    pillBg: "bg-orange-600",
    lightBg: "bg-orange-50 border-orange-200 text-orange-900",
  },
  {
    number: "100",
    serviceEn: "Police Emergency",
    serviceHi: "पुलिस सहायता नियंत्रण",
    category: "State Police Control Room",
    icon: Shield,
    color: "from-indigo-600 to-blue-800",
    pillBg: "bg-indigo-600",
    lightBg: "bg-indigo-50 border-indigo-200 text-indigo-900",
  },
  {
    number: "14416",
    serviceEn: "Tele-MANAS Mental Crisis",
    serviceHi: "टेली-मानस मानसिक स्वास्थ्य",
    category: "24/7 Suicide Prevention Lifeline",
    icon: Brain,
    color: "from-emerald-600 to-teal-700",
    pillBg: "bg-emerald-600",
    lightBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
  {
    number: "1098",
    serviceEn: "Childline (Child in Distress)",
    serviceHi: "चाइल्डलाइन बाल सुरक्षा",
    category: "24/7 Protection & Rescue",
    icon: Users,
    color: "from-purple-600 to-violet-700",
    pillBg: "bg-purple-600",
    lightBg: "bg-purple-50 border-purple-200 text-purple-900",
  },
  {
    number: "181",
    serviceEn: "Women Helpline",
    serviceHi: "महिला सुरक्षा हेल्पलाइन",
    category: "Domestic Abuse & Emergency Aid",
    icon: Sparkles,
    color: "from-fuchsia-600 to-pink-700",
    pillBg: "bg-fuchsia-600",
    lightBg: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900",
  },
]

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
    return LGD_STATES.find((s) => s.code === selectedStateCode) || {
      code: "23",
      nameEn: "Madhya Pradesh",
      nameHi: "मध्य प्रदेश",
    }
  }, [selectedStateCode])

  // Auto-detect user state if coordinates available
  useEffect(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      try {
        const { stateCode } = getLanguageFromCoordinates(initialCoords.lat, initialCoords.lng)
        if (stateCode && LGD_STATES.some((s) => s.code === stateCode)) {
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
        if (stateCode && LGD_STATES.some((s) => s.code === stateCode)) {
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
      {/* =========================================================================
          CRITICAL EMERGENCY FAST-DIAL BAR (ALWAYS PINNED ON TOP)
          Allows zero-scroll 1-tap dialing for the 8 most essential emergency services
         ========================================================================= */}
      <Card className="border-red-300 bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white shadow-lg overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/20">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs flex items-center justify-center animate-pulse">
                <Zap className="h-5 w-5 text-yellow-300" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>{t.criticalEmergencyTitle}</span>
                  <Badge className="bg-yellow-400 text-gray-950 font-black text-[10px] px-2 py-0.5">
                    24/7 FREE
                  </Badge>
                </h2>
                <p className="text-xs text-white/90 font-medium">
                  {t.criticalEmergencySubtitle}
                </p>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-white/80 hidden md:block">
              1-Tap Instant Call • Zero Latency
            </div>
          </div>

          {/* 8-Card Priority Fast-Dial Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 pt-3">
            {CRITICAL_FAST_DIAL.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="group bg-white rounded-xl p-3 text-gray-900 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between border border-white/40 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1.5 rounded-lg text-white ${item.pillBg}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-mono text-xl sm:text-2xl font-black text-gray-950 tracking-wider">
                          {item.number}
                        </span>
                      </div>
                      <PhoneCall className="h-3.5 w-3.5 text-red-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-red-700 transition-colors">
                      {en ? item.serviceEn : item.serviceHi}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                      {item.category}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {t.tollFree}
                    </span>
                    <span className="text-xs font-bold text-red-600 group-hover:underline flex items-center gap-1">
                      <span>{t.callNow}</span>
                      <span>→</span>
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </Card>

      {/* =========================================================================
          COMPREHENSIVE NATIONAL & STATE HELPLINE DIRECTORY
         ========================================================================= */}
      <Card className="border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-gray-900">
                <Phone className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>
                  {en
                    ? "National & State Emergency Helpline Directory"
                    : "राष्ट्रीय एवं राज्य आपातकालीन हेल्पलाइन निर्देशिका"}
                </span>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {en
                  ? "Explore verified helpline contacts across all 36 States/UTs with distinct category color themes."
                  : "सभी 36 राज्यों व केंद्र शासित प्रदेशों के सत्यापित हेल्पलाइन नंबर खोजें।"}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto border border-gray-200">
              <button
                onClick={() => setViewMode("state")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "state"
                    ? "bg-white text-red-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-red-600" />
                <span>{en ? "State View" : "राज्य अनुसार"}</span>
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "all"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-teal-600" />
                <span>{en ? "All-India Directory" : "संपूर्ण देश"}</span>
              </button>
            </div>
          </div>

          {/* State Selector Bar (Active in State View) */}
          {viewMode === "state" && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                  {en ? "Select State / UT:" : "राज्य / केंद्र शासित प्रदेश चुनें:"}
                </span>
                <select
                  value={selectedStateCode}
                  onChange={(e) => setSelectedStateCode(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full py-1.5 px-2.5 font-medium shadow-sm"
                >
                  {LGD_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {en ? state.nameEn : state.nameHi} ({state.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                variant="outline"
                size="sm"
                className="text-xs bg-white border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1.5 h-8 flex-shrink-0 font-medium"
              >
                <MapPin className={`h-3.5 w-3.5 ${isDetectingLocation ? "animate-spin" : ""}`} />
                <span>
                  {isDetectingLocation
                    ? en ? "Detecting..." : "पहचान रहा है..."
                    : en ? "Detect My State" : "मेरा राज्य पहचानें"}
                </span>
              </Button>
            </div>
          )}

          {/* Search Input */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                en
                  ? "Search helplines by name, number (e.g. 108, 112, 104), or topic..."
                  : "नाम, नंबर (उदा. 108, 112, 104) या विषय से खोजें..."
              }
              className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border-gray-200 rounded-xl"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(Object.keys(CATEGORY_THEMES) as HelplineCategory[]).map((cat) => {
              const theme = CATEGORY_THEMES[cat]
              const Icon = theme.icon
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 border ${
                    isSelected
                      ? "bg-red-600 text-white border-red-600 shadow-xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{en ? theme.en : theme.hi}</span>
                </button>
              )
            })}
          </div>
        </CardHeader>

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
              {filteredHelplines.map((item) => {
                const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES.all
                const Icon = theme.icon
                const isCopied = copiedId === item.id

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      window.location.href = `tel:${item.number}`
                    }}
                    className={`group bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 cursor-pointer ${theme.cardBorder} ${theme.cardBg}`}
                  >
                    <div>
                      {/* Top Badges & 24/7 status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isNational ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 font-bold"
                            >
                              <Globe className="h-2.5 w-2.5 mr-1" />
                              {t.national}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-amber-50 text-amber-800 border-amber-200 font-bold"
                            >
                              <MapPin className="h-2.5 w-2.5 mr-1" />
                              {en ? item.stateNameEn : item.stateNameHi}
                            </Badge>
                          )}

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${theme.badgeBg} ${theme.badgeText}`}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            <span>{en ? theme.en : theme.hi}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          {item.is24x7 && (
                            <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                              <Clock className="h-2.5 w-2.5" /> 24/7
                            </span>
                          )}
                          {item.isTollFree && (
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[9px] font-semibold">
                              {t.tollFree}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Category Figure + Title & Description */}
                      <div className="flex items-start gap-3">
                        {/* Dedicated Visual Figure Box */}
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${theme.iconBoxBg} ${theme.iconBoxColor}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
                            {en ? item.serviceEn : item.serviceHi}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {en ? item.descriptionEn : item.descriptionHi}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dial Action & Number Display */}
                    <div className="pt-2.5 border-t border-gray-100/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-gray-900 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 tracking-wider shadow-2xs">
                          {item.number}
                        </span>
                        <button
                          onClick={(e) => handleCopy(item.id, item.number, e)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition"
                          title={t.copyNumber}
                          aria-label="Copy number"
                        >
                          {isCopied ? (
                            <span className="text-[10px] font-bold text-emerald-600">✓ {t.copied}</span>
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <Button
                        size="sm"
                        className={`${theme.btnBg} text-white font-bold text-xs px-3.5 h-8 rounded-lg flex items-center gap-1.5 shadow-xs`}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `tel:${item.number}`
                        }}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{t.callNow}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
