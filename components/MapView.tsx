"use client"

/**
 * MapView — Free, no-API-key facility locator for Madhya Pradesh.
 *
 * Uses Leaflet + free OpenStreetMap tiles for rendering, and queries
 * /api/facilities/nearby (backed by PostGIS ST_DWithin) for real
 * hospital/clinic/pharmacy/lab data seeded from OSM.
 *
 * Requires: npm install leaflet react-leaflet
 * (leaflet's CSS is loaded via CDN link below — no build step needed)
 */

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MapPin, Navigation, Phone, Loader2, LocateFixed } from "lucide-react"

// react-leaflet must be loaded client-side only (it touches `window`)
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false })
const Circle = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false })

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
  userLocation?: { lat: number; lng: number } | null
  camps?: any[]
}

const TYPE_CONFIG: Record<Facility["type"], { color: string; en: string; hi: string; icon: string }> = {
  hospital:    { color: "#dc2626", en: "Hospital",        hi: "अस्पताल",        icon: "🏥" },
  clinic:      { color: "#1d4ed8", en: "Clinic",          hi: "क्लिनिक",        icon: "🩺" },
  doctors:     { color: "#7c3aed", en: "Doctor",          hi: "डॉक्टर",         icon: "👨‍⚕️" },
  pharmacy:    { color: "#15803d", en: "Pharmacy",        hi: "फार्मेसी",       icon: "💊" },
  health_post: { color: "#b45309", en: "Health Post",     hi: "स्वास्थ्य केंद्र", icon: "⛑️" },
  lab:         { color: "#0d9488", en: "Lab",             hi: "लैब",            icon: "🧪" },
}

// Default center: Bhopal, MP — used until we get real GPS / a search
const MP_CENTER = { lat: 23.2599, lng: 77.4126 }

export function MapView({ language, userLocation }: MapViewProps) {
  const en = language === "en"
  const [center, setCenter] = useState(userLocation ?? MP_CENTER)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Facility["type"] | "all">("all")
  const [radiusKm, setRadiusKm] = useState(25)
  const [leafletReady, setLeafletReady] = useState(false)

  // Load Leaflet's CSS once (avoids needing a CSS import pipeline change)
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }
    setLeafletReady(true)
  }, [])

  const fetchFacilities = async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        radius_km: String(radiusKm),
      })
      if (filter !== "all") params.set("type", filter)

      const res = await fetch(`/api/facilities/nearby?${params}`)
      if (!res.ok) throw new Error("Failed to load facilities")
      const json = await res.json()
      setFacilities(json.facilities ?? [])
    } catch (err: any) {
      setError(en ? "Could not load nearby facilities. Please try again." : "निकटतम सुविधाएं लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacilities(center.lat, center.lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, radiusKm])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert(en ? "Geolocation not supported by your browser." : "आपका ब्राउज़र स्थान सेवा समर्थित नहीं करता।")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(next)
        fetchFacilities(next.lat, next.lng)
      },
      () => alert(en ? "Location access denied." : "स्थान की अनुमति अस्वीकृत।")
    )
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: facilities.length }
    facilities.forEach(f => { c[f.type] = (c[f.type] || 0) + 1 })
    return c
  }, [facilities])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-1">{en ? "Nearby Health Facilities" : "निकटतम स्वास्थ्य सुविधाएं"}</h2>
        <p className="text-gray-500 text-sm">
          {en ? "Real hospitals, clinics, pharmacies & labs across Madhya Pradesh — free, open data" : "मध्य प्रदेश के वास्तविक अस्पताल, क्लिनिक, फार्मेसी और लैब — निःशुल्क खुला डेटा"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" variant="outline" onClick={useMyLocation} className="gap-1.5">
          <LocateFixed className="h-4 w-4" />
          {en ? "Use My Location" : "मेरा स्थान उपयोग करें"}
        </Button>
        {(["all", "hospital", "clinic", "doctors", "pharmacy", "lab", "health_post"] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}>
            {t === "all" ? (en ? "All" : "सभी") : `${TYPE_CONFIG[t].icon} ${en ? TYPE_CONFIG[t].en : TYPE_CONFIG[t].hi}`}
            {counts[t] ? ` (${counts[t]})` : ""}
          </button>
        ))}
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="text-xs border rounded-full px-3 py-1.5 bg-white"
        >
          {[10, 25, 50, 100].map(km => <option key={km} value={km}>{km} km</option>)}
        </select>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: 420 }}>
        {leafletReady && (
          <MapContainer center={[center.lat, center.lng]} zoom={11} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ color: "#1d4ed8", fillOpacity: 0.05 }} />
            {facilities.map(f => (
              <Marker key={f.id} position={[f.lat, f.lon]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{TYPE_CONFIG[f.type].icon} {f.name}</p>
                    <p className="text-gray-600">{en ? TYPE_CONFIG[f.type].en : TYPE_CONFIG[f.type].hi}</p>
                    {f.address && <p className="text-gray-500 mt-1">{f.address}</p>}
                    <p className="text-blue-700 font-medium mt-1">{f.distance_km} km {en ? "away" : "दूर"}</p>
                    {f.phone && <a href={`tel:${f.phone}`} className="text-blue-600 underline block mt-1">{f.phone}</a>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {en ? "Loading facilities..." : "सुविधाएं लोड हो रही हैं..."}
        </div>
      )}
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* Facility list */}
      <div className="grid md:grid-cols-2 gap-3">
        {facilities.map(f => (
          <Card key={f.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-xl">
                {TYPE_CONFIG[f.type].icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{f.name}</p>
                <p className="text-xs font-medium" style={{ color: TYPE_CONFIG[f.type].color }}>
                  {en ? TYPE_CONFIG[f.type].en : TYPE_CONFIG[f.type].hi}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{f.distance_km} km</span>
                  {f.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{f.phone}</span>}
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-8 flex-shrink-0"
                onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lon}&zoom=17`, "_blank")}>
                {en ? "View" : "देखें"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {!loading && facilities.length === 0 && !error && (
          <div className="col-span-2 text-center py-10 text-gray-400">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{en ? "No facilities found in this radius. Try increasing the search distance." : "इस दूरी में कोई सुविधा नहीं मिली। खोज दूरी बढ़ाने का प्रयास करें।"}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400 pb-2">
        {en ? "Data: OpenStreetMap contributors · Map tiles: OpenStreetMap · 100% free, no API key" : "डेटा: OpenStreetMap योगदानकर्ता · निःशुल्क"}
      </p>
    </div>
  )
}
