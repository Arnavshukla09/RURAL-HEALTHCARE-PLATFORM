"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Navigation, Phone, Loader2, LocateFixed, Star, Search } from "lucide-react"
import { Input } from "./ui/input"

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
        html: `<div style="
          width:20px;height:20px;
          background:#1d4ed8;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 0 3px #1d4ed8,0 2px 8px rgba(0,0,0,0.4);
          animation:pulse 1.5s infinite;
        "></div>
        <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}</style>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
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

export function MapView({ language }: MapViewProps) {
  const en = language === "en"
  const [center, setCenter] = useState(MP_CENTER)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Facility["type"] | "all">("all")
  const [radiusKm, setRadiusKm] = useState(25)
  const [leafletReady, setLeafletReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [routeData, setRouteData] = useState<{ coords: [number, number][], distance: number, duration: number } | null>(null)
  const [routingLoading, setRoutingLoading] = useState(false)

  // Leaflet CSS is now imported globally in layout.tsx
  useEffect(() => {
    setLeafletReady(true)
  }, [])

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

  // Initial load — Bhopal as default center
  useEffect(() => {
    fetchFacilities(MP_CENTER.lat, MP_CENTER.lng)
  }, [])

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
    fetchFacilities(center.lat, center.lng, f !== "all" ? f : undefined, radiusKm)
  }

  const handleRadiusChange = (km: number) => {
    setRadiusKm(km)
    fetchFacilities(center.lat, center.lng, filter !== "all" ? filter : undefined, km)
  }

  // Sort by distance, top 10 are "nearest"
  const sorted = useMemo(() => {
    let filtered = [...facilities]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(f => f.name.toLowerCase().includes(q))
    }
    return filtered.sort((a, b) => a.distance_km - b.distance_km)
  }, [facilities, searchQuery])
  const top10Ids = useMemo(() => new Set(sorted.slice(0, 10).map(f => f.id)), [sorted])

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
    const c: Record<string, number> = { all: facilities.length }
    facilities.forEach(f => { c[f.type] = (c[f.type] || 0) + 1 })
    return c
  }, [facilities])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-1">
          {en ? "Nearby Health Facilities" : "निकटतम स्वास्थ्य सुविधाएं"}
        </h2>
        <p className="text-sm text-gray-500">
          {en
            ? "Hospitals, PHCs, clinics, pharmacies & labs across Madhya Pradesh — real OSM data"
            : "मध्य प्रदेश के अस्पताल, PHC, क्लिनिक, फार्मेसी और लैब — वास्तविक डेटा"}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder={en ? "Search hospital/clinic name..." : "अस्पताल/क्लिनिक का नाम खोजें..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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

      {/* Map */}
      <div className="rounded-xl overflow-hidden border shadow-sm relative" style={{ height: 440 }}>
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

            {/* All facility markers — top 10 are larger and outlined */}
            {sorted.map(f => {
              const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
              const isTop = top10Ids.has(f.id)
              return (
                <Marker
                  key={f.id}
                  position={[f.lat, f.lon]}
                  icon={makeIcon(cfg.markerColor, isTop) as any}
                  zIndexOffset={isTop ? 1000 : 0}
                >
                  <Popup minWidth={200}>
                    <div className="text-sm space-y-1">
                      <div className="flex items-start gap-1.5">
                        <span className="text-lg">{cfg.icon}</span>
                        <div>
                          <p className="font-semibold leading-tight">{f.name}</p>
                          <p className="text-xs" style={{ color: cfg.color }}>
                            {en ? cfg.en : cfg.hi}
                          </p>
                        </div>
                      </div>
                      {isTop && (
                        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {en ? "Top 10 Nearest" : "10 निकटतम में से"}
                        </p>
                      )}
                      {f.address && <p className="text-xs text-gray-500">{f.address}</p>}
                      {f.district && <p className="text-xs text-gray-400">{f.district}</p>}
                      {f.phone && (
                        <a href={`tel:${f.phone}`}
                          className="text-blue-600 underline text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3" />{f.phone}
                        </a>
                      )}
                      <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs" onClick={() => showRoute(f.lat, f.lon)} disabled={routingLoading}>
                        {routingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
                        {en ? "Show Route" : "मार्ग दिखाएं"}
                      </Button>
                      <a href={`https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lon}&zoom=17`}
                        target="_blank" rel="noreferrer"
                        className="text-gray-500 underline text-xs block mt-1 text-center">
                        {en ? "Open in OSM ↗" : "OSM में देखें ↗"}
                      </a>
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
          {en ? "Fetching facilities..." : "सुविधाएं खोजी जा रही हैं..."}
        </div>
      )}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Top 10 highlighted list */}
      {sorted.length > 0 && (
        <>
          <div>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {en ? "Top 10 Nearest Facilities" : "10 निकटतम सुविधाएं"}
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {sorted.slice(0, 10).map((f, idx) => {
                const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
                return (
                  <Card key={f.id}
                    className="border-2 hover:shadow-md transition-shadow"
                    style={{ borderColor: cfg.color + "40" }}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: cfg.color }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.name}</p>
                        <p className="text-xs" style={{ color: cfg.color }}>
                          {cfg.icon} {en ? cfg.en : cfg.hi}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          {f.phone && (
                            <a href={`tel:${f.phone}`} className="flex items-center gap-0.5 text-blue-600">
                              <Phone className="h-3 w-3" />{f.phone}
                            </a>
                          )}
                        </div>
                        {f.address && <p className="text-xs text-gray-400 truncate mt-0.5 mb-2">{f.address}</p>}
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-1" onClick={() => showRoute(f.lat, f.lon)} disabled={routingLoading}>
                          {routingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
                          {en ? "Show Route" : "मार्ग दिखाएं"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Rest of results */}
          {sorted.length > 10 && (
            <div>
              <h3 className="font-semibold text-base mb-2 text-gray-600">
                {en ? `Other ${sorted.length - 10} Facilities` : `अन्य ${sorted.length - 10} सुविधाएं`}
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {sorted.slice(10).map(f => {
                  const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
                  return (
                    <Card key={f.id} className="hover:shadow-sm transition-shadow border">
                      <CardContent className="p-3 flex items-center gap-3">
                        <span className="text-xl">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{f.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span style={{ color: cfg.color }}>{en ? cfg.en : cfg.hi}</span>
                            {f.phone && <><span>·</span><a href={`tel:${f.phone}`} className="text-blue-600">{f.phone}</a></>}
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 text-xs mt-1 -ml-2 text-blue-600" onClick={() => showRoute(f.lat, f.lon)} disabled={routingLoading}>
                            {en ? "Show Route" : "मार्ग दिखाएं"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </>
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
