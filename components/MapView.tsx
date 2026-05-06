"use client"

/**
 * MapView Component - Google Maps Integration for Camp Locations
 *
 * SECURITY NOTE: This component only makes API calls when explicitly triggered by user action.
 * - Google Maps script loads on mount (required for map display)
 * - Geocoding and Places API calls ONLY happen when user clicks "Search" button
 * - This prevents unwanted/dangerous automatic API calls
 * - User must enter a location and click Search to find nearby hospitals
 */

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { MapPin, Navigation, Phone, Building2, X, Search } from "lucide-react"

interface MapViewProps {
  userLocation: { lat: number; lng: number } | null
  camps: Array<{
    id: number
    name: string
    type: string
    address: string
    coordinates: { lat: number; lng: number }
    distance: number
    date: string
    time: string
    contact: string
  }>
  language: string
  searchLocation?: string
  onClose?: () => void
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function MapView({ userLocation, camps, language, searchLocation, onClose }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([])
  const [selectedPlace, setSelectedPlace] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchLocation || "")
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const content = {
    en: {
      title: "Map View",
      yourLocation: "Your Location",
      campLocation: "Camp Location",
      hospital: "Hospital",
      findHospitals: "Find Nearby Hospitals",
      getDirections: "Get Directions",
      call: "Call",
      close: "Close Map",
      loading: "Loading map...",
      apiKeyError: "Google Maps API key required",
      apiKeyInstructions: "To enable maps, add your Google Maps API key",
      distance: "Distance",
      kmAway: "km away",
      searchPlaceholder: "Enter location to search",
      searchButton: "Search",
      searching: "Searching...",
      locationNotFound: "Location not found. Please try again.",
      searchFirst: "Enter a location and click Search to find nearby camps and hospitals",
    },
    hi: {
      title: "मानचित्र दृश्य",
      yourLocation: "आपका स्थान",
      campLocation: "शिविर स्थान",
      hospital: "अस्पताल",
      findHospitals: "निकटवर्ती अस्पताल खोजें",
      getDirections: "दिशा निर्देश पाएं",
      call: "कॉल करें",
      close: "मानचित्र बंद करें",
      loading: "मानचित्र लोड हो रहा है...",
      apiKeyError: "Google मानचित्र API कुंजी आवश्यक है",
      apiKeyInstructions: "मानचित्र सक्षम करने के लिए, अपनी Google मानचित्र API कुंजी जोड़ें",
      distance: "दूरी",
      kmAway: "किमी दूर",
      searchPlaceholder: "खोजने के लिए स्थान दर्ज करें",
      searchButton: "खोजें",
      searching: "खोज रहे हैं...",
      locationNotFound: "स्थान नहीं मिला। कृपया पुनः प्रयास करें।",
      searchFirst: "निकटवर्ती शिविर और अस्पताल खोजने के लिए एक स्थान दर्ज करें और खोजें पर क्लिक करें",
    },
  }

  const t = content[language as keyof typeof content]

  // Google Maps API Key - Replace with your actual key
  const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE"

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setMapLoaded(true)
      script.onerror = () => {
        console.error("Failed to load Google Maps")
        setMapLoaded(false)
      }
      document.head.appendChild(script)
    }

    loadGoogleMapsScript()
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return

    // Default center (Delhi, India)
    const defaultCenter = { lat: 28.6139, lng: 77.209 }
    const center = userLocation || defaultCenter

    // Initialize map
    const googleMap = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    })

    setMap(googleMap)

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: googleMap,
        title: t.yourLocation,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      })
    }

    // Add camp markers
    const campMarkers = camps.map((camp) => {
      const marker = new window.google.maps.Marker({
        position: camp.coordinates,
        map: googleMap,
        title: camp.name,
        icon: {
          url: getMarkerIcon(camp.type),
        },
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${camp.name}</h3>
            <p style="margin: 4px 0; font-size: 14px;">${camp.address}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>${t.distance}:</strong> ${camp.distance} ${t.kmAway}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>${language === "en" ? "Date" : "तारीख"}:</strong> ${camp.date} ${camp.time}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>${language === "en" ? "Contact" : "संपर्क"}:</strong> ${camp.contact}</p>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(googleMap, marker)
        setSelectedPlace({
          name: camp.name,
          address: camp.address,
          contact: camp.contact,
          coordinates: camp.coordinates,
        })
      })

      return marker
    })

    setMarkers(campMarkers)
  }, [mapLoaded, userLocation, camps])

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "blood-donation":
        return "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
      case "checkup":
        return "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      case "vaccination":
        return "http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
      default:
        return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
    }
  }

  const searchLocationAndFindNearby = () => {
    if (!map || !window.google || !searchQuery.trim()) {
      alert(t.searchFirst)
      return
    }

    setIsSearching(true)

    // Geocode the search query
    const geocoder = new window.google.maps.Geocoder()

    geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location
        const coordinates = {
          lat: location.lat(),
          lng: location.lng(),
        }

        setSearchedLocation(coordinates)

        // Center map on searched location
        map.setCenter(location)
        map.setZoom(13)

        // Add marker for searched location
        new window.google.maps.Marker({
          position: location,
          map,
          title: searchQuery,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
          },
          animation: window.google.maps.Animation.DROP,
        })

        // Now find nearby hospitals
        findNearbyHospitals(coordinates)

        setIsSearching(false)
      } else {
        alert(t.locationNotFound)
        setIsSearching(false)
      }
    })
  }

  const findNearbyHospitals = (center: { lat: number; lng: number }) => {
    if (!map || !window.google) return

    const service = new window.google.maps.places.PlacesService(map)

    const request = {
      location: center,
      radius: 5000, // 5km radius
      type: "hospital",
    }

    service.nearbySearch(request, (results: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Clear existing hospital markers
        nearbyHospitals.forEach((marker) => marker.setMap(null))

        // Add new hospital markers
        const hospitalMarkers = results.slice(0, 10).map((place: any) => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map,
            title: place.name,
            icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/hospitals.png",
            },
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${place.name}</h3>
                <p style="margin: 4px 0; font-size: 14px;">${place.vicinity}</p>
                ${place.rating ? `<p style="margin: 4px 0; font-size: 14px;"><strong>${language === "en" ? "Rating" : "रेटिंग"}:</strong> ${place.rating} ⭐</p>` : ""}
                ${place.opening_hours ? `<p style="margin: 4px 0; font-size: 14px;">${place.opening_hours.open_now ? "🟢 Open" : "🔴 Closed"}</p>` : ""}
              </div>
            `,
          })

          marker.addListener("click", () => {
            infoWindow.open(map, marker)
            setSelectedPlace({
              name: place.name,
              address: place.vicinity,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            })
          })

          return marker
        })

        setNearbyHospitals(hospitalMarkers)
      }
    })
  }

  const getDirections = () => {
    if (!selectedPlace) return
    const { lat, lng } = selectedPlace.coordinates
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank")
  }

  const callPlace = () => {
    if (!selectedPlace?.contact) return
    window.open(`tel:${selectedPlace.contact}`)
  }

  // Mock map for when API key is not configured
  if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center space-y-4">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto" />
            <h3 className="text-xl font-semibold">{t.apiKeyError}</h3>
            <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium">{t.apiKeyInstructions}:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600">
                <li>
                  {language === "en" ? "Go to Google Cloud Console: " : "Google Cloud Console पर जाएं: "}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    console.cloud.google.com
                  </a>
                </li>
                <li>
                  {language === "en" ? "Create a new project or select existing one" : "नया प्रोजेक्ट बनाएं या मौजूदा चुनें"}
                </li>
                <li>
                  {language === "en"
                    ? "Enable Maps JavaScript API and Places API"
                    : "Maps JavaScript API और Places API सक्षम करें"}
                </li>
                <li>{language === "en" ? "Create API credentials (API Key)" : "API क्रेडेंशियल्स बनाएं (API Key)"}</li>
                <li>
                  {language === "en"
                    ? "Replace YOUR_GOOGLE_MAPS_API_KEY_HERE in MapView.tsx"
                    : "MapView.tsx में YOUR_GOOGLE_MAPS_API_KEY_HERE बदलें"}
                </li>
              </ol>
            </div>

            {/* Mock Map Preview */}
            <div className="mt-6 bg-gray-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 opacity-50"></div>
              <div className="relative space-y-4">
                <MapPin className="h-12 w-12 text-blue-600 mx-auto animate-bounce" />
                <p className="text-gray-600">
                  {language === "en" ? "Interactive map will appear here" : "इंटरैक्टिव मानचित्र यहां दिखाई देगा"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-4">
              {onClose && (
                <Button onClick={onClose} variant="outline">
                  {t.close}
                </Button>
              )}
              <Button onClick={() => window.open("https://console.cloud.google.com/", "_blank")}>
                {language === "en" ? "Get API Key" : "API Key प्राप्त करें"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-6xl w-full h-[90vh] flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">{t.title}</h2>
            </div>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4 mr-1" />
                {t.close}
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchLocationAndFindNearby()}
              className="flex-1"
            />
            <Button onClick={searchLocationAndFindNearby} disabled={isSearching || !searchQuery.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? t.searching : t.searchButton}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Map */}
          <div className="flex-1 relative">
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">{t.loading}</p>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Selected Place Info or Instructions */}
          {selectedPlace ? (
            <div className="w-80 border-l p-4 space-y-4 overflow-y-auto">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedPlace.name}</h3>
                <p className="text-sm text-gray-600">{selectedPlace.address}</p>
              </div>

              <div className="space-y-2">
                <Button onClick={getDirections} className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  {t.getDirections}
                </Button>
                {selectedPlace.contact && (
                  <Button onClick={callPlace} variant="outline" className="w-full bg-transparent">
                    <Phone className="h-4 w-4 mr-2" />
                    {t.call}
                  </Button>
                )}
              </div>

              {/* Map Legend */}
              <div className="pt-4 border-t space-y-2">
                <p className="text-sm font-medium">{language === "en" ? "Map Legend" : "मानचित्र किंवदंती"}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>{t.yourLocation}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>{language === "en" ? "Blood Donation" : "रक्तदान"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>{language === "en" ? "Health Checkup" : "स्वास्थ्य जांच"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>{language === "en" ? "Vaccination" : "टीकाकरण"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3 h-3 text-pink-600" />
                    <span>{t.hospital}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-80 border-l p-4 space-y-4 overflow-y-auto bg-blue-50">
              <div className="text-center space-y-4 py-8">
                <Search className="h-12 w-12 text-blue-600 mx-auto" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-900">
                    {language === "en" ? "Search for a Location" : "स्थान खोजें"}
                  </h3>
                  <p className="text-sm text-blue-700">{t.searchFirst}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-left space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {language === "en" ? "How to use:" : "उपयोग कैसे करें:"}
                  </p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>{language === "en" ? "Enter a location name" : "स्थान का नाम दर्ज करें"}</li>
                    <li>{language === "en" ? "Click Search button" : "खोज बटन पर क्लिक करें"}</li>
                    <li>{language === "en" ? "View nearby camps & hospitals" : "निकटवर्ती शिविर और अस्पताल देखें"}</li>
                    <li>{language === "en" ? "Click markers for details" : "विवरण के लिए मार्कर पर क्लिक करें"}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
