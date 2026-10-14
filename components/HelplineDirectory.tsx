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

interface HelplineDirectoryProps {
  language: string
  initialCoords?: { lat: number; lng: number }
}

const CATEGORY_CONFIG: Record<
  HelplineCategory,
  { en: string; hi: string; icon: any; color: string }
> = {
  all: { en: "All Services", hi: "सभी सेवाएं", icon: Filter, color: "bg-gray-100 text-gray-800" },
  medical: { en: "Medical & Health", hi: "चिकित्सा व एम्बुलेंस", icon: HeartPulse, color: "bg-red-100 text-red-800" },
  women_child: { en: "Women & Child", hi: "महिला एवं बाल सुरक्षा", icon: Users, color: "bg-purple-100 text-purple-800" },
  mental_health: { en: "Mental Health", hi: "मानसिक स्वास्थ्य", icon: Brain, color: "bg-emerald-100 text-emerald-800" },
  disaster: { en: "Disaster & Relief", hi: "आपदा एवं राहत", icon: AlertTriangle, color: "bg-amber-100 text-amber-800" },
  governance: { en: "CM & Governance", hi: "सीएम व जन शिकायत", icon: Building2, color: "bg-blue-100 text-blue-800" },
  police_fire: { en: "Police & Fire", hi: "पुलिस व अग्निशमन", icon: Flame, color: "bg-orange-100 text-orange-800" },
}

export function HelplineDirectory({ language, initialCoords }: HelplineDirectoryProps) {
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
    <Card className="border-red-200 bg-white shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-red-50/60 via-white to-teal-50/40">
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
                ? "Immediate 1-tap dial for ambulance, medical advice, disaster control and state CM helplines."
                : "एम्बुलेंस, स्वास्थ्य सलाह, आपदा प्रबंधन और राज्य सीएम हेल्पलाइन पर 1-टैप कॉल करें।"}
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
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100">
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
              className="text-xs bg-white border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1.5 h-8 flex-shrink-0"
            >
              <MapPin className={`h-3.5 w-3.5 ${isDetectingLocation ? "animate-spin" : ""}`} />
              <span>{isDetectingLocation ? (en ? "Detecting..." : "पहचान रहा है...") : (en ? "Detect My State" : "मेरा राज्य पहचानें")}</span>
            </Button>
          </div>
        )}

        {/* Search Input & Live Count */}
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

        {/* Category Pills */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(CATEGORY_CONFIG) as HelplineCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat]
            const Icon = config.icon
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${
                  isSelected
                    ? "bg-red-600 text-white border-red-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{en ? config.en : config.hi}</span>
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
              <span>— {stateSpecificCount} {en ? "State helplines" : "राज्य हेल्पलाइन"} + {NATIONAL_HELPLINES.length} {en ? "National helplines" : "राष्ट्रीय हेल्पलाइन"}</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              {filteredHelplines.length} {en ? "results" : "परिणाम"}
            </span>
          </div>
        )}

        {/* Helpline Cards Grid */}
        {filteredHelplines.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200 p-6">
            <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">
              {en ? "No helpline numbers match your query" : "कोई हेल्पलाइन नंबर नहीं मिला"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {en
                ? "Try searching for a different keyword or switch to All Services."
                : "कृपया दूसरा शब्द खोजें या 'सभी सेवाएं' चुनें।"}
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
              {en ? "Reset Filters" : "फ़िल्टर रीसेट करें"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredHelplines.map((item) => {
              const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.all
              const Icon = catConfig.icon
              const isCopied = copiedId === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    window.location.href = `tel:${item.number}`
                  }}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isNational ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 font-bold"
                          >
                            <Globe className="h-2.5 w-2.5 mr-1" />
                            {en ? "National" : "राष्ट्रीय"}
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
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${catConfig.color}`}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          <span>{en ? catConfig.en : catConfig.hi}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        {item.is24x7 && (
                          <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                            <Clock className="h-2.5 w-2.5" /> 24/7
                          </span>
                        )}
                        {item.isTollFree && (
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[9px] font-semibold">
                            Toll-Free
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Service Title */}
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
                      {en ? item.serviceEn : item.serviceHi}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {en ? item.descriptionEn : item.descriptionHi}
                    </p>
                  </div>

                  {/* Dial Action & Number Display */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-red-600 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-100 tracking-wider">
                        {item.number}
                      </span>
                      <button
                        onClick={(e) => handleCopy(item.id, item.number, e)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition"
                        title={en ? "Copy number" : "नंबर कॉपी करें"}
                        aria-label="Copy number"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 h-8 rounded-lg flex items-center gap-1.5 shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `tel:${item.number}`
                      }}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{en ? "Call Now" : "कॉल करें"}</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
