"use client"

/**
 * components/camp-locations/index.tsx
 *
 * Modular Healthcare Camp Locations & Outreach Event Finder.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MapPin,
  Calendar,
  Phone,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"

import { CampCard } from "./parts/CampCard"
import { CampSearchFilters } from "./parts/CampSearchFilters"
import {
  getInitialCamps,
  getCampLocationsContent,
  type CampLocationsProps,
  type CampLocation,
} from "./types"

const MapView = dynamic(() => import("@/components/MapView").then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
      <span>Loading map...</span>
    </div>
  )
})

export function CampLocations({ language }: CampLocationsProps) {
  const router = useRouter()
  const [userLocation, setUserLocation] = useState<string>("")
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"distance" | "date">("distance")
  const [showMap, setShowMap] = useState(false)
  const [registering, setRegistering] = useState<number | string | null>(null)
  const [registeredCamps, setRegisteredCamps] = useState<Set<number | string>>(new Set())
  const { toast } = useToast()

  const currentYear = new Date().getFullYear()
  const t = getCampLocationsContent(language)

  const [campLocations, setCampLocations] = useState<CampLocation[]>(() =>
    getInitialCamps(language, currentYear)
  )

  useEffect(() => {
    const fetchDBCamps = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("camps").select("*")
      if (error || !data) return

      const mapped = data.map((dbCamp: any) => ({
        id: dbCamp.id,
        name: dbCamp.title || "Health Camp",
        type: (dbCamp.category?.toLowerCase() || "checkup") as any,
        address: dbCamp.address || "",
        landmark: dbCamp.location || "",
        coordinates: { lat: 0, lng: 0 },
        date: dbCamp.start_date || "",
        time: dbCamp.start_time || "",
        contact: dbCamp.phone || "",
        participants: dbCamp.participants || 0,
        status: (dbCamp.status || "upcoming") as any,
        description: dbCamp.description || "",
      }))

      setCampLocations((prev) => {
        const existingNames = new Set(prev.map((c) => c.name))
        const newCamps = mapped.filter((c: any) => !existingNames.has(c.name))
        return [...prev, ...newCamps]
      })
    }
    fetchDBCamps()
  }, [])

  // Haversine distance formula (in km)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity
    const R = 6371
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filteredCamps = campLocations.filter((camp) => {
    const matchesType = selectedType === "all" || camp.type === selectedType
    const matchesLocation =
      !userLocation.trim() ||
      camp.address.toLowerCase().includes(userLocation.toLowerCase()) ||
      camp.landmark.toLowerCase().includes(userLocation.toLowerCase()) ||
      camp.name.toLowerCase().includes(userLocation.toLowerCase())
    return matchesType && matchesLocation
  })

  const sortedCamps = [...filteredCamps].sort((a, b) => {
    if (sortBy === "distance" && userCoordinates) {
      const distA = getDistance(
        userCoordinates.lat,
        userCoordinates.lng,
        a.coordinates?.lat,
        a.coordinates?.lng
      )
      const distB = getDistance(
        userCoordinates.lat,
        userCoordinates.lng,
        b.coordinates?.lat,
        b.coordinates?.lng
      )
      return distA - distB
    } else if (sortBy === "distance") {
      return a.address.localeCompare(b.address)
    } else {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
  })

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            )
            const data = await res.json()
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              (language === "en" ? "Current Location" : "वर्तमान स्थान")
            setUserLocation(city)
          } catch {
            setUserLocation(language === "en" ? "Current Location" : "वर्तमान स्थान")
          }
          setUserCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          toast({ title: t.locationAccess, variant: "destructive" })
        }
      )
    } else {
      toast({
        title:
          language === "en"
            ? "Geolocation is not supported by this browser."
            : "इस ब्राउज़र में भू-स्थान समर्थित नहीं है।",
        variant: "destructive",
      })
    }
  }

  const getDirections = (camp: CampLocation) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${camp.coordinates.lat},${camp.coordinates.lng}`,
      "_blank"
    )
  }

  const callCamp = (camp: CampLocation) => {
    window.open(`tel:${camp.contact}`)
  }

  const registerForCamp = async (camp: CampLocation) => {
    setRegistering(camp.id)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title:
            language === "en"
              ? "Please login first to register for this camp."
              : "इस शिविर के लिए पंजीकरण करने हेतु पहले लॉगिन करें।",
          variant: "destructive",
        })
        setRegistering(null)
        return
      }
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type: "other",
          content: `[Camp Registration] ${camp.name} — ${camp.address} on ${camp.date} at ${camp.time}. Contact: ${camp.contact}`,
        }),
      })
      if (res.ok) {
        setRegisteredCamps((prev) => new Set(prev).add(camp.id))
        toast({
          title:
            language === "en"
              ? "Successfully registered! Check your Medical Records for details."
              : "सफलतापूर्वक पंजीकृत! विवरण के लिए अपने मेडिकल रिकॉर्ड देखें।",
        })
      } else {
        const err = await res.json()
        toast({
          title:
            err.error ||
            (language === "en"
              ? "Registration failed. Please try again."
              : "पंजीकरण विफल। कृपया पुनः प्रयास करें।"),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title:
          language === "en"
            ? "Network error. Please try again."
            : "नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।",
        variant: "destructive",
      })
    } finally {
      setRegistering(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Search & Filters */}
        <CampSearchFilters
          language={language}
          t={t}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          getCurrentLocation={getCurrentLocation}
          onShowMap={() => setShowMap(true)}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* Camp Locations List */}
        {sortedCamps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{userLocation.trim() ? t.noCamps : t.noLocation}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedCamps.map((camp) => (
              <CampCard
                key={camp.id}
                camp={camp}
                language={language}
                t={t}
                registering={registering}
                registeredCamps={registeredCamps}
                onRegister={registerForCamp}
                onDirections={getDirections}
                onCall={callCamp}
                onViewOnMap={() => setShowMap(true)}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "en" ? "Quick Actions" : "त्वरित कार्य"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/campaigns")}
                className="h-16 flex flex-col items-center justify-center space-y-2"
              >
                <Calendar className="h-6 w-6" />
                <span>{language === "en" ? "All Campaigns" : "सभी अभियान"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/directory")}
                className="h-16 flex flex-col items-center justify-center space-y-2"
              >
                <MapPin className="h-6 w-6" />
                <span>{language === "en" ? "Healthcare Directory" : "स्वास्थ्य निर्देशिका"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("tel:108")}
                className="h-16 flex flex-col items-center justify-center space-y-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Phone className="h-6 w-6" />
                <span>{language === "en" ? "Emergency: 108" : "आपातकाल: 108"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">
                {language === "en" ? "Nearby Facilities" : "निकटतम सुविधाएं"}
              </h3>
              <button
                onClick={() => setShowMap(false)}
                aria-label={language === "en" ? "Close map" : "मानचित्र बंद करें"}
                className="text-gray-500 hover:text-gray-800 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <MapView language={language} />
          </div>
        </div>
      )}
    </div>
  )
}

export default CampLocations
