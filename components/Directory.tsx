"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
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
  ExternalLink,
  ArrowRight,
  ShieldCheck
} from "lucide-react"
import { REAL_DOCTORS, RealDoctor, calculateDistanceKm } from "@/lib/data/real-doctors"
import { getTranslation } from "@/lib/i18n/translations"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"

interface DirectoryProps {
  language: string
}

export function Directory({ language }: DirectoryProps) {
  const router = useRouter()
  const trans = getTranslation(language)
  const t = trans.directory

  // Search & Specialty Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')

  // Geo Proximity State — Strict radius filtering (default 50 km, NO "all" option)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedStateCode, setSelectedStateCode] = useState<string>('all')
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('all')
  const [selectedRadius, setSelectedRadius] = useState<number>(50) // 10, 25, 50, 100 km
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)

  // Available districts for chosen state
  const availableDistricts = useMemo(() => {
    if (selectedStateCode === 'all') return []
    const foundState = LGD_STATES.find(s => s.code === selectedStateCode)
    return foundState ? foundState.districts : []
  }, [selectedStateCode])

  // Get active reference coordinates for proximity calculation
  const referenceCoords = useMemo(() => {
    if (userCoords) return userCoords

    if (selectedDistrictName !== 'all' && selectedStateCode !== 'all') {
      const foundState = LGD_STATES.find(s => s.code === selectedStateCode)
      const foundDistrict = foundState?.districts.find(d => d.nameEn.toLowerCase() === selectedDistrictName.toLowerCase())
      if (foundDistrict?.center) return { lat: foundDistrict.center.lat, lng: foundDistrict.center.lng }
    }

    if (selectedStateCode !== 'all') {
      const foundState = LGD_STATES.find(s => s.code === selectedStateCode)
      if (foundState?.center) return { lat: foundState.center.lat, lng: foundState.center.lng }
    }

    return null
  }, [userCoords, selectedStateCode, selectedDistrictName])

  // Flag determining whether user has activated a location
  const hasActiveLocation = Boolean(referenceCoords)

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

  // Filter & Proximity Calculation: Strictly location-based and capped to Top 10 per specialist
  const processedDoctors = useMemo(() => {
    if (!referenceCoords) {
      return []
    }

    // 1. Calculate proximity distance for all doctors
    let list: RealDoctor[] = REAL_DOCTORS.map(doc => {
      const distance = calculateDistanceKm(referenceCoords.lat, referenceCoords.lng, doc.lat, doc.lon)
      return { ...doc, distance }
    })

    // 2. Strict distance radius filter (no "all" allowed)
    list = list.filter(doc => doc.distance !== undefined && doc.distance <= selectedRadius)

    // 3. Specialty filter if specified
    if (selectedSpecialty !== 'all') {
      list = list.filter(doc => doc.specialty === selectedSpecialty)
    }

    // 4. State filter if specified
    if (selectedStateCode !== 'all') {
      list = list.filter(doc => doc.stateCode === selectedStateCode)
    }

    // 5. District filter if specified
    if (selectedDistrictName !== 'all') {
      list = list.filter(doc => doc.districtName.toLowerCase().includes(selectedDistrictName.toLowerCase()))
    }

    // 6. Search Query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      list = list.filter(doc =>
        doc.name.toLowerCase().includes(q) ||
        doc.specialtyName.toLowerCase().includes(q) ||
        doc.hospitalAffiliation.toLowerCase().includes(q) ||
        doc.districtName.toLowerCase().includes(q) ||
        doc.stateName.toLowerCase().includes(q) ||
        doc.location.toLowerCase().includes(q) ||
        doc.regNo.toLowerCase().includes(q) ||
        doc.qualifications.toLowerCase().includes(q)
      )
    }

    // 7. Sort by nearest proximity first
    list.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      return b.rating - a.rating
    })

    // 8. Strict Capping to Top 10 for each specialist
    if (selectedSpecialty !== 'all') {
      return list.slice(0, 10)
    }

    // Group and cap at most 10 doctors per specialty
    const specialtyCounts: Record<string, number> = {}
    const capped: RealDoctor[] = []
    for (const doc of list) {
      const count = specialtyCounts[doc.specialty] || 0
      if (count < 10) {
        specialtyCounts[doc.specialty] = count + 1
        capped.push(doc)
      }
    }
    return capped
  }, [referenceCoords, selectedSpecialty, selectedStateCode, selectedDistrictName, selectedRadius, searchTerm])

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
    setSearchTerm('')
    setSelectedSpecialty('all')
    setSelectedStateCode('all')
    setSelectedDistrictName('all')
    setSelectedRadius(50)
    setUserCoords(null)
    setLocationStatus(null)
  }

  // Active location label for badge
  const locationLabel = useMemo(() => {
    if (userCoords) return "My Current GPS Location"
    if (selectedDistrictName !== 'all') {
      const st = LGD_STATES.find(s => s.code === selectedStateCode)
      return `${selectedDistrictName}, ${st?.nameEn || ''}`
    }
    if (selectedStateCode !== 'all') {
      const st = LGD_STATES.find(s => s.code === selectedStateCode)
      return st?.nameEn || "Selected State"
    }
    return null
  }, [userCoords, selectedDistrictName, selectedStateCode])

  return (
    <div className="min-h-screen bg-gray-50/70 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>NMC Verified • Proximity-Restricted Doctor Directory</span>
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

        {/* Location & Proximity Search Controls */}
        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Top Row: Search Input + GPS Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm bg-white border-gray-200 rounded-xl h-10"
                />
              </div>

              <Button
                variant={userCoords ? "default" : "outline"}
                onClick={handleDetectLocation}
                disabled={isLocating}
                className={`h-10 px-4 text-xs font-semibold rounded-xl flex items-center gap-2 shrink-0 ${
                  userCoords
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-blue-300 text-blue-700 hover:bg-blue-50"
                }`}
              >
                <Navigation className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
                <span>{isLocating ? t.detectingLocation : userCoords ? "GPS Active" : t.detectLocation}</span>
              </Button>
            </div>

            {/* Bottom Row: State Selector + District Selector + Radius Picker (Strictly 10k, 25k, 50k, 100k) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1 border-t border-gray-100">
              {/* State Dropdown */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  {t.stateFilter}
                </label>
                <select
                  value={selectedStateCode}
                  onChange={(e) => {
                    setSelectedStateCode(e.target.value)
                    setSelectedDistrictName('all')
                  }}
                  className="w-full text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">{t.allStates} (Select State)</option>
                  {LGD_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {language === "hi" ? s.nameHi : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  {t.districtFilter}
                </label>
                <select
                  value={selectedDistrictName}
                  onChange={(e) => setSelectedDistrictName(e.target.value)}
                  disabled={selectedStateCode === 'all'}
                  className="w-full text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                >
                  <option value="all">{t.allDistricts}</option>
                  {availableDistricts.map((d) => (
                    <option key={d.code} value={d.nameEn}>
                      {language === "hi" ? d.nameHi : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Radius Picker (NO 0/All option) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {t.radius}
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    {selectedRadius} km
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((rad) => (
                    <button
                      key={rad}
                      onClick={() => setSelectedRadius(rad)}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md border transition ${
                        selectedRadius === rad
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {rad} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Action */}
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllFilters}
                  className="w-full text-xs text-gray-600 hover:text-red-600 flex items-center justify-center gap-1.5 h-9"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t.resetFilters}</span>
                </Button>
              </div>
            </div>

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
                    : "Doctor listings are strictly proximity-filtered within your chosen radius (capping top 10 per specialist). Nationwide unfiltered browsing is disabled."}
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
          /* Active Directory Results (Capped to Top 10 per specialist) */
          <div className="space-y-4">
            {/* Results Filter & Count Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span>Verified Doctors ({processedDoctors.length})</span>
                </div>
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-semibold">
                  Top 10 Capped per Specialist
                </Badge>
                <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-bold">
                  📍 Within {selectedRadius} km
                </Badge>
              </div>

              {locationLabel && (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-gray-700">Near: {locationLabel}</span>
                </div>
              )}
            </div>

            {/* Doctor Cards */}
            {processedDoctors.length > 0 ? (
              <div className="space-y-4">
                {processedDoctors.map((doctor) => (
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

                              {/* Verified NMC Badge */}
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>{t.verified} • {doctor.regNo}</span>
                              </Badge>

                              {/* Distance Badge */}
                              {doctor.distance !== undefined && (
                                <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-bold">
                                  📍 {doctor.distance} {t.kmAway}
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
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-600 font-normal">{doctor.qualifications}</span>
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
                            <div className="text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-amber-200/60 font-medium">
                              <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                              <span>{t.opdTimings}: {doctor.opdTimings}</span>
                            </div>

                            {/* Rating, Reviews & Experience */}
                            <div className="flex items-center gap-2.5 text-xs text-gray-600 pt-1 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-gray-800">{doctor.rating}</span>
                                {doctor.reviewCount && (
                                  <span className="text-[11px] text-gray-400">({doctor.reviewCount} reviews)</span>
                                )}
                              </div>
                              {doctor.patientRecommendationPercent && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200/60">
                                    👍 {doctor.patientRecommendationPercent}% Recommended
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>{doctor.experience} {t.yearsExp}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="font-mono">{doctor.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Consultation Fees & Call to Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                          <div className="text-left lg:text-right">
                            <p className="text-xl font-black text-emerald-700">
                              {doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : t.free}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium">
                              {doctor.consultationFee > 0 ? "OPD Consultation" : "Govt Free OPD"}
                            </p>
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                              onClick={() => window.open(`tel:${doctor.phone}`)}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>{t.callNow}</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs h-8 px-3 font-semibold rounded-lg flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100"
                              onClick={() => router.push("/consultation")}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{t.bookAppointment}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-6 space-y-3">
                <Stethoscope className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">
                  No verified practitioners found within {selectedRadius} km of your location.
                </p>
                <p className="text-xs text-gray-400">
                  Try expanding your search radius to 50 km or 100 km, or select an adjacent district.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  {selectedRadius < 50 && (
                    <Button onClick={() => setSelectedRadius(50)} variant="outline" size="sm" className="text-xs font-semibold">
                      Expand to 50 km
                    </Button>
                  )}
                  {selectedRadius < 100 && (
                    <Button onClick={() => setSelectedRadius(100)} variant="outline" size="sm" className="text-xs font-semibold">
                      Expand to 100 km
                    </Button>
                  )}
                  <Button onClick={resetAllFilters} variant="ghost" size="sm" className="text-xs font-semibold">
                    {t.resetFilters}
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
