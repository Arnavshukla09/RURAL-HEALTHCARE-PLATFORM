"use client"
import { useState, useEffect } from "react"
import { MapPin, Search, Hospital, Pill, Stethoscope, Navigation } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

interface MapViewProps {
  language: string
  userLocation?: any
  camps?: any[]
}

const facilities = [
  { name: "Community Health Centre", type: "hospital", lat: 22.7196, lng: 75.8577, dist: "0.8 km", phone: "0731-2345678" },
  { name: "Primary Health Centre", type: "clinic", lat: 22.7250, lng: 75.8650, dist: "1.2 km", phone: "0731-2345679" },
  { name: "Jan Aushadhi Store", type: "pharmacy", lat: 22.7150, lng: 75.8500, dist: "0.5 km", phone: "0731-2345680" },
  { name: "District Hospital", type: "hospital", lat: 22.7300, lng: 75.8700, dist: "2.1 km", phone: "0731-2345681" },
  { name: "ASHA Health Post", type: "clinic", lat: 22.7100, lng: 75.8450, dist: "1.8 km", phone: "0731-2345682" },
  { name: "Rural Medical Centre", type: "hospital", lat: 22.7350, lng: 75.8750, dist: "3.2 km", phone: "0731-2345683" },
]

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string; labelHi: string }> = {
  hospital: { icon: Hospital, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Hospital", labelHi: "अस्पताल" },
  clinic:   { icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Clinic", labelHi: "क्लिनिक" },
  pharmacy: { icon: Pill, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Pharmacy", labelHi: "फार्मेसी" },
}

export function MapView({ language, userLocation, camps = [] }: MapViewProps) {
  const en = language === "en"
  const [filter, setFilter] = useState<"all" | "hospital" | "clinic" | "pharmacy">("all")
  const [search, setSearch] = useState("")
  const [mapLoaded, setMapLoaded] = useState(false)

  const filtered = facilities.filter(f =>
    (filter === "all" || f.type === filter) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  // Use OpenStreetMap embed — free, no API key
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=75.83,22.70,75.89,22.74&layer=mapnik&marker=22.7196,75.8577`

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 to-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{en ? "Nearby Health Facilities" : "निकटतम स्वास्थ्य सुविधाएं"}</h1>
          <p className="text-sm text-gray-500">{en ? "Hospitals, clinics and pharmacies near you" : "आपके पास अस्पताल, क्लिनिक और फार्मेसी"}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:border-teal-500 bg-white"
            placeholder={en ? "Search facilities..." : "सुविधाएं खोजें..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "hospital", "clinic", "pharmacy"] as const).map(type => (
            <button key={type} onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === type ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
              }`}>
              {type === "all" ? (en ? "All" : "सभी") :
               type === "hospital" ? (en ? "🏥 Hospitals" : "🏥 अस्पताल") :
               type === "clinic" ? (en ? "🩺 Clinics" : "🩺 क्लिनिक") :
               (en ? "💊 Pharmacies" : "💊 फार्मेसी")}
            </button>
          ))}
        </div>

        {/* OpenStreetMap embed */}
        <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
          <iframe
            src={mapSrc}
            width="100%"
            height="350"
            style={{ border: 0 }}
            title="Health Facilities Map"
            onLoad={() => setMapLoaded(true)}
          />
          <div className="px-3 py-1.5 text-xs text-gray-400 border-t">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a> contributors — Free & open source mapping
          </div>
        </div>

        {/* Facility cards */}
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((f, i) => {
            const cfg = typeConfig[f.type]
            const Icon = cfg.icon
            return (
              <Card key={i} className={`border hover-lift cursor-pointer ${cfg.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className={`h-5 w-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{f.name}</p>
                      <p className={`text-xs font-medium ${cfg.color}`}>{en ? cfg.label : cfg.labelHi}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Navigation className="h-3 w-3" />{f.dist}
                        </span>
                        <span className="text-xs text-gray-500">{f.phone}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-8 flex-shrink-0"
                      onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lng}&zoom=16`, "_blank")}>
                      {en ? "View" : "देखें"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{en ? "No facilities found" : "कोई सुविधा नहीं मिली"}</p>
          </div>
        )}

        <p className="text-xs text-center text-gray-400 pb-4">
          {en ? "Powered by OpenStreetMap — 100% free, no API key required" : "OpenStreetMap द्वारा संचालित — 100% निःशुल्क"}
        </p>
      </div>
    </div>
  )
}
