"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Navigation, Phone, Loader2, LocateFixed, Star, Search, ShieldCheck, Activity, ChevronDown, Check, Maximize2, Minimize2, MapPin, ChevronLeft, ChevronRight, Building2, Calendar, Stethoscope } from "lucide-react"
import { Input } from "./ui/input"
import { LGD_STATES, IPHS_TIER_CONFIG, IphsCapabilities, IphsFacilityTier } from "@/lib/geo/lgd-iphs"
import { REAL_DOCTORS, RealDoctor } from "@/lib/data/real-doctors"

// All react-leaflet components loaded client-side only
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false })
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false })
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false })
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false })
const Circle       = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false })
const Polyline     = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false })

interface Facility {
  id: string
  name: string
  type: "hospital" | "clinic" | "doctors" | "pharmacy" | "health_post" | "lab"
  address: string | null
  phone: string | null
  district: string | null
  distance_km: number
  lat: number
  lon: number
  tier?: IphsFacilityTier
  capabilities?: IphsCapabilities
  specialtyName?: string
  doctorQualifications?: string
  hospitalAffiliation?: string
  regNo?: string
  consultationFee?: number
  opdTimings?: string
}

interface MapViewProps {
  language: string
  userLocation?: any
  camps?: any[]
}

const TYPE_CONFIG: Record<string, { color: string; en: string; hi: string; icon: string; markerColor: string }> = {
  hospital:    { color: "#dc2626", en: "Hospital",       hi: "अस्पताल",         icon: "🏥", markerColor: "#dc2626" },
  clinic:      { color: "#1d4ed8", en: "Clinic",         hi: "क्लिनिक",         icon: "🩺", markerColor: "#1d4ed8" },
  doctors:     { color: "#7c3aed", en: "Doctor",         hi: "डॉक्टर",          icon: "👨‍⚕️", markerColor: "#7c3aed" },
  pharmacy:    { color: "#15803d", en: "Pharmacy",       hi: "फार्मेसी",        icon: "💊", markerColor: "#15803d" },
  health_post: { color: "#b45309", en: "Health Post/PHC",hi: "PHC/स्वास्थ्य केंद्र", icon: "⛑️", markerColor: "#b45309" },
  lab:         { color: "#0d9488", en: "Lab",            hi: "लैब",             icon: "🧪", markerColor: "#0d9488" },
}

const MP_CENTER = { lat: 23.2599, lng: 77.4126 }

// Leaflet wrapper that prevents "Map container is already initialized" in
// React 18 Strict Mode (dev double-mount issue). Uses requestAnimationFrame
// to delay first mount and an incrementing key to force fresh DOM on re-mount.
function LeafletMap({ children, center, zoom }: { children: ReactNode; center: [number, number]; zoom: number }) {
  const [ready, setReady] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) {
      // Second mount (Strict Mode remount) — increment key to get fresh DOM
      setMapKey(k => k + 1)
    } else {
      mountedRef.current = true
    }
    const id = requestAnimationFrame(() => setReady(true))
    return () => {
      cancelAnimationFrame(id)
      setReady(false)
    }
  }, [])

  if (!ready) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      key={`map-${mapKey}-${center[0].toFixed(4)}-${center[1].toFixed(4)}`}
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      {children}
    </MapContainer>
  )
}

// Creates a colored SVG circle marker for Leaflet using divIcon
function makeIcon(color: string, isTop10: boolean, isUser = false) {
  if (typeof window === "undefined") return undefined
  try {
    const L = require("leaflet")
    if (isUser) {
      return L.divIcon({
        className: "",
        html: `
          <div style="position:relative; width:36px; height:36px; display:flex; justify-content:center; align-items:flex-end; cursor: grab;">
            <div style="position:absolute; top:-22px; background:#1d4ed8; color:white; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:bold; white-space:nowrap; pointer-events:none; box-shadow:0 2px 4px rgba(0,0,0,0.3); border: 1.5px solid white; z-index:50;">
              ✋ Drag to Move
            </div>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="4" fill="white"></circle>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })
    }
    const size = isTop10 ? 14 : 10
    const border = isTop10 ? "2px solid white" : "1.5px solid white"
    const shadow = isTop10 ? "0 2px 6px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.3)"
    const zIndex = isTop10 ? 1000 : 500
    return L.divIcon({
      className: "",
      html: `<div style="
        width:${size}px;height:${size}px;
        background:${color};
        border:${border};
        border-radius:50%;
        box-shadow:${shadow};
        z-index:${zIndex};
        position:relative;
        ${isTop10 ? `outline:2px solid ${color};outline-offset:2px;` : ""}
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  } catch {
    return undefined
  }
}

interface SearchableDropdownProps {
  label: string
  placeholder: string
  searchPlaceholder: string
  selectedCode: string
  options: { code: string; nameEn: string; nameHi?: string }[]
  onSelect: (code: string) => void
  en: boolean
}

function SearchableDropdown({
  label,
  placeholder,
  searchPlaceholder,
  selectedCode,
  options,
  onSelect,
  en,
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
  const displayName = selectedItem
    ? en
      ? selectedItem.nameEn
      : selectedItem.nameHi || selectedItem.nameEn
    : placeholder

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
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-[11px] font-semibold text-blue-900 block mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-xs font-medium border border-blue-200 rounded-lg p-2 bg-white text-gray-800 flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
      >
        <span className="truncate pr-1 text-left">{displayName}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[210px] z-[1050] bg-white rounded-lg shadow-xl border border-blue-200 p-1.5">
          {/* Small search bar at top of dropdown */}
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          {/* Options list limited to 5 entries height so it never overlaps the UI */}
          <div className="max-h-[175px] overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="py-2.5 px-2 text-center text-xs text-gray-400">
                {en ? "No matches found" : "कोई परिणाम नहीं मिला"}
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
                    className={`w-full text-left py-2 px-2.5 text-xs rounded flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">
                      {en ? item.nameEn : item.nameHi || item.nameEn}
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

export function MapView({ language }: MapViewProps) {
  const en = language === "en"
  const [center, setCenter] = useState(MP_CENTER)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedState, setSelectedState] = useState<string>("23")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("2301")
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Facility["type"] | "all">("all")
  const [showOnlyFRU, setShowOnlyFRU] = useState(false)
  const [radiusKm, setRadiusKm] = useState(25)
  const [leafletReady, setLeafletReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [routeData, setRouteData] = useState<{ coords: [number, number][], distance: number, duration: number } | null>(null)
  const [routingLoading, setRoutingLoading] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  // Leaflet CSS is now imported globally in layout.tsx
  useEffect(() => {
    setLeafletReady(true)
  }, [])

  const fetchDistrictPack = async (distCode: string, stateCodeParam?: string) => {
    setLoading(true)
    setError(null)
    const currentStateCode = stateCodeParam || selectedState
    try {
      const res = await fetch(`/api/facilities/district/${distCode}`)
      if (res.ok) {
        const json = await res.json()
        if (json.facilities && json.facilities.length > 0) {
          const origin = userCoords || center
          const mapped: Facility[] = json.facilities.map((f: any) => {
            // Calculate approximate great-circle distance in km (Haversine formula approximation)
            const dLat = ((f.lat - origin.lat) * Math.PI) / 180
            const dLon = ((f.lon - origin.lng) * Math.PI) / 180
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((origin.lat * Math.PI) / 180) *
                Math.cos((f.lat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distKm = Math.round(6371 * c * 10) / 10

            return {
              id: f.id,
              name: en ? f.nameEn : f.nameHi,
              type:
                f.tier === "medical_college" || f.tier === "district_hospital"
                  ? "hospital"
                  : f.tier === "phc"
                  ? "health_post"
                  : "clinic",
              address: en ? f.addressEn : f.addressHi,
              phone: f.phone,
              district: f.blockName || distCode,
              distance_km: distKm,
              lat: f.lat,
              lon: f.lon,
              tier: f.tier,
              capabilities: f.capabilities,
            }
          })
          setFacilities(mapped)
          return
        }
      }
      // If pack not seeded or empty, fallback to nearby RPC for the district center
      const st = LGD_STATES.find(s => s.code === currentStateCode)
      const dist = st?.districts.find(d => d.code === distCode)
      if (dist) {
        fetchFacilities(dist.center.lat, dist.center.lng)
      }
    } catch {
      // Fallback to nearby RPC
      fetchFacilities(center.lat, center.lng)
    } finally {
      setLoading(false)
    }
  }

  const fetchFacilities = async (lat: number, lon: number, type?: string, km?: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        radius_km: String(km ?? radiusKm),
      })
      if (type && type !== "all") params.set("type", type)
      const res = await fetch(`/api/facilities/nearby?${params}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setFacilities(json.facilities ?? [])
    } catch (err: any) {
      setError(en
        ? "Could not load facilities. Please try again."
        : "सुविधाएं लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।")
    } finally {
      setLoading(false)
    }
  }

  // Initial load — load Bhopal district pack
  useEffect(() => {
    fetchDistrictPack("2301", "23")
  }, [])

  const handleDistrictChange = (distCode: string) => {
    setSelectedDistrict(distCode)
    const st = LGD_STATES.find(s => s.code === selectedState)
    const dist = st?.districts.find(d => d.code === distCode)
    if (dist) {
      setCenter(dist.center)
    }
    fetchDistrictPack(distCode, selectedState)
  }

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    const st = LGD_STATES.find(s => s.code === stateCode)
    if (st && st.districts.length > 0) {
      const firstDist = st.districts[0]
      setSelectedDistrict(firstDist.code)
      setCenter(firstDist.center)
      fetchDistrictPack(firstDist.code, stateCode)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: en ? "Geolocation not supported." : "स्थान सेवा समर्थित नहीं है।", variant: "destructive" })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserCoords(coords)
        setCenter(coords)
        fetchFacilities(coords.lat, coords.lng, filter !== "all" ? filter : undefined, radiusKm)
        setLocating(false)
      },
      () => {
        toast({ title: en ? "Location access denied." : "स्थान की अनुमति अस्वीकृत।", variant: "destructive" })
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f)
    if (f !== "doctors") {
      fetchFacilities(center.lat, center.lng, f !== "all" ? f : undefined, radiusKm)
    }
  }

  const handleRadiusChange = (km: number) => {
    setRadiusKm(km)
    fetchFacilities(center.lat, center.lng, filter !== "all" && filter !== "doctors" ? filter : undefined, km)
  }

  // Haversine distance calculator
  const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(6371 * c * 10) / 10
  }

  // Doctors mapped from 913 REAL_DOCTORS dataset
  const doctorFacilities = useMemo<Facility[]>(() => {
    const origin = userCoords || center
    let docs: RealDoctor[] = []

    if (userCoords) {
      docs = REAL_DOCTORS.filter(d => {
        const dKm = computeDistanceKm(userCoords.lat, userCoords.lng, d.lat, d.lon)
        return dKm <= radiusKm
      })
    } else {
      const distObj = LGD_STATES.find(s => s.code === selectedState)?.districts.find(d => d.code === selectedDistrict)
      const distName = (distObj?.nameEn || "").toLowerCase()

      const inDist = REAL_DOCTORS.filter(d =>
        d.stateCode === selectedState && (distName ? d.districtName.toLowerCase().includes(distName) : true)
      )
      const inState = REAL_DOCTORS.filter(d =>
        d.stateCode === selectedState && (!distName || !d.districtName.toLowerCase().includes(distName))
      )
      docs = [...inDist, ...inState]
    }

    return docs.map(d => ({
      id: d.id,
      name: d.name,
      type: "doctors" as const,
      address: `${d.location} (${d.hospitalAffiliation})`,
      phone: d.phone,
      district: d.districtName,
      distance_km: computeDistanceKm(origin.lat, origin.lng, d.lat, d.lon),
      lat: d.lat,
      lon: d.lon,
      specialtyName: d.specialtyName,
      doctorQualifications: d.qualifications,
      hospitalAffiliation: d.hospitalAffiliation,
      regNo: d.regNo,
      consultationFee: d.consultationFee,
      opdTimings: d.opdTimings,
    }))
  }, [userCoords, center, radiusKm, selectedState, selectedDistrict])

  // Combine facilities with doctors based on active filter
  const combinedFacilities = useMemo<Facility[]>(() => {
    if (filter === "doctors") {
      return doctorFacilities
    }
    if (filter === "all") {
      return [...facilities, ...doctorFacilities]
    }
    return facilities.filter(f => f.type === filter)
  }, [facilities, doctorFacilities, filter])

  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery, selectedDistrict, selectedState, userCoords])

  // Sort by distance (if GPS active) or by district name (if state/district mode)
  const sorted = useMemo(() => {
    let list = [...combinedFacilities]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.address && f.address.toLowerCase().includes(q)) ||
        (f.specialtyName && f.specialtyName.toLowerCase().includes(q)) ||
        (f.hospitalAffiliation && f.hospitalAffiliation.toLowerCase().includes(q)) ||
        (f.district && f.district.toLowerCase().includes(q))
      )
    }
    if (userCoords) {
      return list.sort((a, b) => a.distance_km - b.distance_km)
    }
    return list.sort((a, b) => {
      if (a.district === b.district) return a.name.localeCompare(b.name)
      return (a.district || "").localeCompare(b.district || "")
    })
  }, [combinedFacilities, searchQuery, userCoords])

  const top10Ids = useMemo(() => new Set(sorted.slice(0, 10).map(f => f.id)), [sorted])
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginatedFacilities = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, currentPage])

  const showRoute = async (destLat: number, destLon: number) => {
    const start = userCoords || center
    if (!start) return
    setRoutingLoading(true)
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destLon},${destLat}?overview=full&geometries=geojson`)
      const data = await res.json()
      if (data.code === "Ok" && data.routes.length > 0) {
        const route = data.routes[0]
        const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number])
        setRouteData({ coords, distance: route.distance, duration: route.duration })
      } else {
        toast({ title: en ? "Could not find route" : "मार्ग नहीं मिला", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: en ? "Error fetching route" : "मार्ग प्राप्त करने में त्रुटि", variant: "destructive" })
    } finally {
      setRoutingLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: facilities.length + doctorFacilities.length,
      doctors: doctorFacilities.length,
    }
    facilities.forEach(f => { c[f.type] = (c[f.type] || 0) + 1 })
    return c
  }, [facilities, doctorFacilities])

  const stateOptions = useMemo(() => {
    return LGD_STATES.map((s) => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi,
    }))
  }, [])

  const districtOptions = useMemo(() => {
    const st = LGD_STATES.find((s) => s.code === selectedState)
    return (st?.districts || []).map((d) => ({
      code: d.code,
      nameEn: d.nameEn,
      nameHi: d.nameHi,
    }))
  }, [selectedState])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-1">
          {en ? "National Healthcare Facility Discovery" : "राष्ट्रीय स्वास्थ्य सुविधा खोज"}
        </h2>
        <p className="text-sm text-gray-500">
          {en
            ? "Capability-aware facility locator indexed by Local Government Directory (LGD) and Indian Public Health Standards (IPHS)"
            : "स्थानीय निकाय निर्देशिका (LGD) एवं भारतीय लोक स्वास्थ्य मानक (IPHS) आधारित स्वास्थ्य केंद्र खोज"}
        </p>
      </div>

      {/* LGD Geographic Navigation & Search Row */}
      <div className="relative z-30 flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-blue-50/60 p-3 rounded-xl border border-blue-100">
        <div className="flex-1 flex gap-2">
          {/* LGD State Selector with Search Bar & Max 5 items visible */}
          <div className="w-1/2 md:w-52">
            <SearchableDropdown
              label={en ? "State (LGD)" : "राज्य (LGD)"}
              placeholder={en ? "Select State" : "राज्य चुनें"}
              searchPlaceholder={en ? "Search state..." : "राज्य खोजें..."}
              selectedCode={selectedState}
              options={stateOptions}
              onSelect={handleStateChange}
              en={en}
            />
          </div>

          {/* LGD District Selector with Search Bar & Max 5 items visible */}
          <div className="w-1/2 md:w-56">
            <SearchableDropdown
              label={en ? "District (LGD)" : "जिला (LGD)"}
              placeholder={en ? "Select District" : "जिला चुनें"}
              searchPlaceholder={en ? "Search district..." : "जिला खोजें..."}
              selectedCode={selectedDistrict}
              options={districtOptions}
              onSelect={handleDistrictChange}
              en={en}
            />
          </div>
        </div>

        {/* Search by facility name */}
        <div className="relative flex-1">
          <label className="text-[11px] font-semibold text-blue-900 block mb-1">
            {en ? "Search Facility" : "सुविधा खोजें"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder={en ? "Search hospital or CHC name..." : "अस्पताल या CHC का नाम खोजें..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white"
            />
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant="outline" onClick={useMyLocation}
          disabled={locating}
          className="gap-1.5 shrink-0">
          {locating
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <LocateFixed className="h-4 w-4" />}
          {en ? "Use My Location" : "मेरा स्थान"}
        </Button>

        {(["all", "hospital", "health_post", "clinic", "pharmacy", "lab", "doctors"] as const).map(t => (
          <button key={t} onClick={() => handleFilterChange(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === t
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}>
            {t === "all"
              ? (en ? `All (${counts.all ?? 0})` : `सभी (${counts.all ?? 0})`)
              : `${TYPE_CONFIG[t].icon} ${en ? TYPE_CONFIG[t].en : TYPE_CONFIG[t].hi}${counts[t] ? ` (${counts[t]})` : ""}`}
          </button>
        ))}

        <select value={radiusKm}
          onChange={e => handleRadiusChange(Number(e.target.value))}
          className="text-xs border rounded-full px-3 py-1.5 bg-white ml-auto">
          {[10, 25, 50, 100].map(km => (
            <option key={km} value={km}>{km} km</option>
          ))}
        </select>
        </div>
      </div>

      {/* Map Header with Compact / Expand Toggle */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-blue-600" />
          <span>{en ? "Facility Map" : "सुविधा मानचित्र"}</span>
          <span className="text-gray-400 font-normal">({sorted.length} {en ? "facilities plotted" : "सुविधाएं दर्शाई गई"})</span>
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsMapExpanded(prev => !prev)}
          className="h-7 text-xs gap-1.5 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-xs"
        >
          {isMapExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span>{isMapExpanded ? (en ? "Compact Map (260px)" : "छोटा नक्शा (260px)") : (en ? "Expand Map (460px)" : "बड़ा नक्शा (460px)")}</span>
        </Button>
      </div>

      {/* Map with isolated stacking context (prevents leaflet z-index leaks onto UI) */}
      <div 
        className="rounded-xl overflow-hidden border shadow-xs relative z-0 isolate transition-all duration-300" 
        style={{ height: isMapExpanded ? 460 : 260 }}
      >
        {routeData && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] border text-sm">
            <p className="font-bold text-blue-700">{en ? "Route Info" : "मार्ग की जानकारी"}</p>
            <p className="mt-1"><strong>{en ? "Distance:" : "दूरी:"}</strong> {(routeData.distance / 1000).toFixed(1)} km</p>
            <p><strong>{en ? "ETA:" : "अनुमानित समय:"}</strong> {Math.ceil(routeData.duration / 60)} {en ? "mins" : "मिनट"}</p>
            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={() => setRouteData(null)}>
              {en ? "Clear Route" : "मार्ग हटाएं"}
            </Button>
          </div>
        )}
        {leafletReady && (
          <LeafletMap center={[center.lat, center.lng]} zoom={userCoords ? 13 : 11}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={["a", "b", "c"]}
              maxZoom={19}
            />

            {/* User location pin with pulsing blue dot */}
            {userCoords && (
              <>
                <Marker
                  position={[userCoords.lat, userCoords.lng]}
                  icon={makeIcon("", false, true) as any}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target
                      const position = marker.getLatLng()
                      const newCoords = { lat: position.lat, lng: position.lng }
                      setUserCoords(newCoords)
                      setCenter(newCoords)
                      fetchFacilities(newCoords.lat, newCoords.lng, filter !== "all" ? filter : undefined, radiusKm)
                    }
                  }}
                >
                  <Popup>
                    <p className="font-semibold text-blue-700 mb-1">
                      📍 {en ? "Your Location" : "आपका स्थान"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {en ? "(Drag marker to change location)" : "(स्थान बदलने के लिए मार्कर खींचें)"}
                    </p>
                  </Popup>
                </Marker>
                <Circle
                  center={[userCoords.lat, userCoords.lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{ color: "#1d4ed8", fillOpacity: 0.04, dashArray: "6 4" }}
                />
              </>
            )}

            {routeData && (
              <Polyline positions={routeData.coords} color="#3b82f6" weight={5} opacity={0.7} />
            )}

            {/* All facility and doctor markers (showing up to 50 on map to avoid DOM overload) */}
            {sorted.slice(0, 50).map(f => {
              const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
              const isTop = top10Ids.has(f.id)
              const isDoc = f.type === "doctors"
              return (
                <Marker
                  key={f.id}
                  position={[f.lat, f.lon]}
                  icon={makeIcon(cfg.markerColor, isTop) as any}
                  zIndexOffset={isTop ? 1000 : 0}
                >
                  <Popup minWidth={220}>
                    <div className="text-sm space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-xl shrink-0">{cfg.icon}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 leading-tight">{f.name}</p>
                          <p className="text-xs font-medium" style={{ color: cfg.color }}>
                            {isDoc ? (f.specialtyName || (en ? "Specialist Doctor" : "विशेषज्ञ डॉक्टर")) : (en ? cfg.en : cfg.hi)}
                          </p>
                          {isDoc && f.doctorQualifications && (
                            <p className="text-[10px] text-gray-500 truncate">{f.doctorQualifications}</p>
                          )}
                        </div>
                      </div>

                      {isDoc && f.hospitalAffiliation && (
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-purple-600 shrink-0" />
                          <span className="truncate">{f.hospitalAffiliation}</span>
                        </p>
                      )}

                      {isDoc && f.regNo && (
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {f.regNo}
                          </span>
                        </div>
                      )}

                      {isTop && (
                        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {userCoords ? (en ? "Top 10 Nearest" : "10 निकटतम में से") : (en ? "Top Recommendation" : "शीर्ष अनुशंसित")}
                        </p>
                      )}

                      {f.address && (
                        <p className="text-[11px] text-gray-500 flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{f.address}</span>
                        </p>
                      )}

                      {/* Distance info only if user has active GPS */}
                      {userCoords ? (
                        <p className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                          📍 {f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)}m` : `${f.distance_km.toFixed(1)} km`} {en ? "away" : "दूर"}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded inline-block">
                          📍 {f.district || (en ? "District Center" : "जिला केंद्र")}
                        </p>
                      )}

                      {/* Contact Phone & Direct Dial */}
                      {f.phone ? (
                        <div className="pt-0.5">
                          <a
                            href={`tel:${f.phone}`}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center justify-between gap-1.5"
                          >
                            <span className="flex items-center gap-1 truncate">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span className="truncate">{f.phone}</span>
                            </span>
                            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-200/60 px-1 py-0.5 rounded shrink-0">
                              {en ? "Call" : "कॉल"}
                            </span>
                          </a>
                        </div>
                      ) : null}

                      {/* Action buttons */}
                      <div className="pt-1 flex flex-col gap-1">
                        {isDoc && (
                          <a
                            href="/consultation"
                            className="w-full text-center py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Stethoscope className="h-3.5 w-3.5" />
                            <span>{en ? "Book Consultation" : "परामर्श बुक करें"}</span>
                          </a>
                        )}
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => showRoute(f.lat, f.lon)} disabled={routingLoading}>
                          {routingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
                          {en ? "Show Route" : "मार्ग दिखाएं"}
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </LeafletMap>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          {en ? "Fetching healthcare facilities & doctors..." : "स्वास्थ्य सुविधाएं एवं डॉक्टर खोजे जा रहे हैं..."}
        </div>
      )}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Facilities & Doctors List (10 per page pagination to prevent lagging) */}
      {sorted.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-gray-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              <span>
                {filter === "doctors" 
                  ? (en ? "Verified Doctors Directory" : "सत्यापित डॉक्टर निर्देशिका")
                  : (en ? "Healthcare Facilities & Doctors" : "स्वास्थ्य केंद्र एवं डॉक्टर")}
              </span>
              <span className="text-xs font-normal text-gray-500">
                ({sorted.length} {en ? "found" : "मिले"})
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                {userCoords 
                  ? (en ? "📍 Sorted by Distance" : "📍 दूरी अनुसार क्रमबद्ध")
                  : (en ? "🏛️ LGD District View" : "🏛️ LGD जिला दृश्य")}
              </span>
              <span className="text-xs text-gray-500">
                {en ? `Page ${currentPage} of ${totalPages}` : `पृष्ठ ${currentPage} / ${totalPages}`}
              </span>
            </div>
          </div>

          {/* Paginated Grid: 10 items per page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {paginatedFacilities.map((f, idx) => {
              const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
              const itemIndex = (currentPage - 1) * PAGE_SIZE + idx + 1
              const isDoc = f.type === "doctors"

              return (
                <Card 
                  key={f.id}
                  className={`border hover:shadow-md transition-all hover:border-blue-300 bg-white ${isDoc ? "border-purple-200" : ""}`}
                >
                  <CardContent className="p-3 flex flex-col justify-between h-full gap-2">
                    <div>
                      {/* Header: Item Index + Name + Distance/District */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="h-5 w-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                            style={{ background: cfg.color }}
                          >
                            {itemIndex}
                          </span>
                          <h4 className="font-semibold text-xs sm:text-sm text-gray-900 truncate" title={f.name}>
                            {f.name}
                          </h4>
                        </div>
                        {/* Only show calculated km if GPS is active */}
                        {userCoords ? (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                            {f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)}m` : `${f.distance_km.toFixed(1)} km`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 truncate max-w-[100px]" title={f.district || ""}>
                            {f.district || (en ? "District" : "जिला")}
                          </span>
                        )}
                      </div>

                      {/* Doctor details or Facility Capabilities */}
                      {isDoc ? (
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                              <span>👨‍⚕️</span>
                              <span>{f.specialtyName}</span>
                            </span>
                            {f.regNo && (
                              <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1 py-0.5 rounded">
                                NMC Verified
                              </span>
                            )}
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded">
                              {f.consultationFee === 0 ? (en ? "Free OPD" : "निःशुल्क OPD") : `₹${f.consultationFee}`}
                            </span>
                          </div>
                          {f.hospitalAffiliation && (
                            <p className="text-[11px] text-gray-700 truncate flex items-center gap-1" title={f.hospitalAffiliation}>
                              <Building2 className="h-3 w-3 text-purple-600 shrink-0" />
                              <span className="truncate">{f.hospitalAffiliation}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: cfg.color }}>
                            <span>{cfg.icon}</span>
                            <span>{en ? cfg.en : cfg.hi}</span>
                          </span>
                          {f.tier && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${IPHS_TIER_CONFIG[f.tier]?.badgeColor || "bg-gray-100 text-gray-800"}`}>
                              {en ? IPHS_TIER_CONFIG[f.tier]?.en : IPHS_TIER_CONFIG[f.tier]?.hi}
                            </span>
                          )}
                          {f.capabilities?.isPmJayEmpaneled && (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded">
                              PM-JAY
                            </span>
                          )}
                          {f.capabilities?.isFRU && (
                            <span className="text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-1 py-0.5 rounded">
                              FRU
                            </span>
                          )}
                          {f.capabilities?.hasBloodBankOrStorage && (
                            <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 px-1 py-0.5 rounded">
                              Blood
                            </span>
                          )}
                        </div>
                      )}

                      {/* Address */}
                      {f.address && (
                        <p className="text-[11px] text-gray-500 truncate mt-1 flex items-center gap-1" title={f.address}>
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="truncate">{f.address}</span>
                        </p>
                      )}
                    </div>

                    {/* Action Footer (Call + Route + Book) */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-1">
                        {f.phone ? (
                          <a
                            href={`tel:${f.phone}`}
                            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title={f.phone}
                          >
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="text-[11px]">{en ? "Call" : "कॉल"}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-1 rounded font-medium">
                            {en ? "OPD" : "OPD"}
                          </span>
                        )}

                        {isDoc && (
                          <a
                            href="/consultation"
                            className="h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Stethoscope className="h-3 w-3 shrink-0" />
                            <span className="text-[11px]">{en ? "Book" : "बुक"}</span>
                          </a>
                        )}
                      </div>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs px-2 text-blue-700 hover:bg-blue-50 border-blue-200 flex items-center gap-1 shrink-0" 
                        onClick={() => showRoute(f.lat, f.lon)} 
                        disabled={routingLoading}
                      >
                        {routingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                        <span>{en ? "Route" : "मार्ग"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Clean Pagination Controls (10 items per page) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="gap-1 h-8 text-xs font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>{en ? "Previous" : "पिछला"}</span>
              </Button>

              <div className="text-xs text-gray-500">
                {en 
                  ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, sorted.length)} of ${sorted.length}`
                  : `${sorted.length} में से ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, sorted.length)} दर्शा रहे`}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="gap-1 h-8 text-xs font-medium"
              >
                <span>{en ? "Next" : "अगला"}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {!loading && facilities.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">
            {en
              ? "No facilities found. Try increasing the radius or use your GPS location."
              : "कोई सुविधा नहीं मिली। दूरी बढ़ाएं या GPS का उपयोग करें।"}
          </p>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 pb-2">
        {en
          ? "Data: OpenStreetMap contributors · 100% free, no API key"
          : "डेटा: OpenStreetMap योगदानकर्ता · 100% निःशुल्क"}
      </p>
    </div>
  )
}
