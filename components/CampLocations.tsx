"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  Users,
  Phone,
  Search,
  Locate,
  Compass,
  Heart,
  Stethoscope,
  Activity,
  Map,
} from "lucide-react"
import { MapView } from "./MapView"

interface CampLocationsProps {
  setCurrentPage: (page: string) => void
  language: string
}

interface CampLocation {
  id: number
  name: string
  type: "blood-donation" | "checkup" | "vaccination"
  address: string
  landmark: string
  coordinates: { lat: number; lng: number }
  distance: number
  date: string
  time: string
  contact: string
  participants: number
  status: "active" | "upcoming" | "completed"
  description: string
}

export function CampLocations({ setCurrentPage, language }: CampLocationsProps) {
  const [userLocation, setUserLocation] = useState<string>("")
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"distance" | "date">("distance")
  const [showMap, setShowMap] = useState(false)

  const content = {
    en: {
      title: "Nearest Camp Locations",
      subtitle: "Find health camps and events near you",
      searchPlaceholder: "Enter your location or village name...",
      locateMe: "Use My Location",
      showMap: "Show on Map",
      filterAll: "All Camps",
      filterBlood: "Blood Donation",
      filterCheckup: "Health Checkup",
      filterVaccination: "Vaccination",
      sortDistance: "Nearest First",
      sortDate: "Upcoming First",
      getDirections: "Get Directions",
      callCamp: "Call Camp",
      registerNow: "Register Now",
      shareLocation: "Share Location",
      kmAway: "km away",
      today: "Today",
      tomorrow: "Tomorrow",
      active: "Active Now",
      upcoming: "Upcoming",
      completed: "Completed",
      participants: "participants",
      noLocation: "Please enter your location to find nearby camps",
      noCamps: "No camps found in your area",
      locationAccess: "Location access denied. Please enter manually.",
      bloodDonation: "Blood Donation Drive",
      healthCheckup: "Free Health Checkup",
      vaccination: "COVID Vaccination",
      viewOnMap: "View on Map",
      travelTime: "Travel Time",
      minutes: "mins",
    },
    hi: {
      title: "निकटतम शिविर स्थान",
      subtitle: "अपने नजदीकी स्वास्थ्य शिविर और कार्यक्रम खोजें",
      searchPlaceholder: "अपना स्थान या गांव का नाम दर्ज करें...",
      locateMe: "मेरा स्थान उपयोग करें",
      showMap: "मानचित्र पर दिखाएं",
      filterAll: "सभी शिविर",
      filterBlood: "रक्तदान",
      filterCheckup: "स्वास्थ्य जांच",
      filterVaccination: "टीकाकरण",
      sortDistance: "निकटतम पहले",
      sortDate: "आगामी पहले",
      getDirections: "दिशा निर्देश पाएं",
      callCamp: "शिविर पर कॉल करें",
      registerNow: "अभी पंजीकरण करें",
      shareLocation: "स्थान साझा करें",
      kmAway: "किमी दूर",
      today: "आज",
      tomorrow: "कल",
      active: "अभी सक्रिय",
      upcoming: "आगामी",
      completed: "पूर्ण",
      participants: "प्रतिभागी",
      noLocation: "निकटतम शिविर खोजने के लिए कृपया अपना स्थान दर्ज करें",
      noCamps: "आपके क्षेत्र में कोई शिविर नहीं मिला",
      locationAccess: "स्थान पहुंच अस्वीकृत। कृपया मैन्युअल रूप से दर्ज करें।",
      bloodDonation: "रक्तदान अभियान",
      healthCheckup: "मुफ्त स्वास्थ्य जांच",
      vaccination: "कोविड टीकाकरण",
      viewOnMap: "मानचित्र पर देखें",
      travelTime: "यात्रा समय",
      minutes: "मिनट",
    },
  }

  const t = content[language as keyof typeof content]

  // Mock camp locations data
  const campLocations: CampLocation[] = [
    {
      id: 1,
      name: t.bloodDonation,
      type: "blood-donation",
      address: language === "en" ? "Community Center, Main Road" : "सामुदायिक केंद्र, मुख्य सड़क",
      landmark: language === "en" ? "Near Post Office" : "डाकघर के पास",
      coordinates: { lat: 28.6139, lng: 77.209 },
      distance: 2.5,
      date: "2025-09-16",
      time: "09:00 AM",
      contact: "+91 9876543210",
      participants: 45,
      status: "upcoming",
      description: language === "en" ? "Help save lives by donating blood" : "रक्तदान करके जीवन बचाने में सहायता करें",
    },
    {
      id: 2,
      name: t.healthCheckup,
      type: "checkup",
      address: language === "en" ? "Village Health Center, Block-A" : "ग्राम स्वास्थ्य केंद्र, ब्लॉक-ए",
      landmark: language === "en" ? "Opposite Primary School" : "प्राथमिक विद्यालय के सामने",
      coordinates: { lat: 28.6289, lng: 77.2145 },
      distance: 1.2,
      date: "2025-09-18",
      time: "10:00 AM",
      contact: "+91 9876543211",
      participants: 23,
      status: "upcoming",
      description: language === "en" ? "Comprehensive health screening for all ages" : "सभी उम्र के लिए व्यापक स्वास्थ्य जांच",
    },
    {
      id: 3,
      name: t.vaccination,
      type: "vaccination",
      address: language === "en" ? "District Hospital, Emergency Wing" : "जिला अस्पताल, आपातकालीन विंग",
      landmark: language === "en" ? "Main Hospital Complex" : "मुख्य अस्पताल परिसर",
      coordinates: { lat: 28.6389, lng: 77.219 },
      distance: 4.8,
      date: "2025-09-20",
      time: "08:30 AM",
      contact: "+91 9876543212",
      participants: 67,
      status: "upcoming",
      description:
        language === "en" ? "Free COVID vaccination for eligible candidates" : "योग्य उम्मीदवारों के लिए मुफ्त कोविड टीकाकरण",
    },
    {
      id: 4,
      name: language === "en" ? "Eye Checkup Camp" : "आंख जांच शिविर",
      type: "checkup",
      address: language === "en" ? "Community Hall, Village Square" : "सामुदायिक हॉल, गांव चौक",
      landmark: language === "en" ? "Near Temple" : "मंदिर के पास",
      coordinates: { lat: 28.6189, lng: 77.205 },
      distance: 0.8,
      date: "2025-09-15",
      time: "11:00 AM",
      contact: "+91 9876543213",
      participants: 32,
      status: "active",
      description: language === "en" ? "Free eye examination and glasses distribution" : "मुफ्त आंख की जांच और चश्मा वितरण",
    },
    {
      id: 5,
      name: language === "en" ? "Maternal Health Camp" : "मातृ स्वास्थ्य शिविर",
      type: "checkup",
      address: language === "en" ? "Women's Health Center" : "महिला स्वास्थ्य केंद्र",
      landmark: language === "en" ? "Behind Market Area" : "बाजार क्षेत्र के पीछे",
      coordinates: { lat: 28.6089, lng: 77.199 },
      distance: 3.2,
      date: "2025-09-22",
      time: "09:30 AM",
      contact: "+91 9876543214",
      participants: 18,
      status: "upcoming",
      description:
        language === "en" ? "Prenatal and postnatal care for mothers" : "माताओं के लिए प्रसवपूर्व और प्रसवोत्तर देखभाल",
    },
  ]

  const filteredCamps = campLocations.filter((camp) => {
    if (selectedType === "all") return true
    return camp.type === selectedType
  })

  const sortedCamps = [...filteredCamps].sort((a, b) => {
    if (sortBy === "distance") {
      return a.distance - b.distance
    } else {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
  })

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(language === "en" ? "Current Location" : "वर्तमान स्थान")
          setUserCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          alert(t.locationAccess)
        },
      )
    } else {
      alert(language === "en" ? "Geolocation is not supported by this browser." : "इस ब्राउज़र में भू-स्थान समर्थित नहीं है।")
    }
  }

  const getDirections = (camp: CampLocation) => {
    // In a real app, this would open maps with directions
    alert(language === "en" ? `Opening directions to ${camp.name}...` : `${camp.name} के लिए दिशा निर्देश खोले जा रहे हैं...`)
  }

  const callCamp = (camp: CampLocation) => {
    window.open(`tel:${camp.contact}`)
  }

  const registerForCamp = (camp: CampLocation) => {
    alert(language === "en" ? `Registration for ${camp.name} initiated!` : `${camp.name} के लिए पंजीकरण शुरू किया गया!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "upcoming":
        return "bg-blue-500"
      case "completed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blood-donation":
        return <Heart className="h-5 w-5 text-red-500" />
      case "checkup":
        return <Activity className="h-5 w-5 text-blue-500" />
      case "vaccination":
        return <Stethoscope className="h-5 w-5 text-green-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getTravelTime = (distance: number) => {
    // Rough calculation: 30 km/h average speed in rural areas
    const timeInHours = distance / 30
    const timeInMinutes = Math.round(timeInHours * 60)
    return timeInMinutes
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return t.today
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t.tomorrow
    } else {
      return date.toLocaleDateString(language === "en" ? "en-US" : "hi-IN")
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

        {/* Location Search */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={getCurrentLocation} variant="outline">
                  <Locate className="h-4 w-4 mr-2" />
                  {t.locateMe}
                </Button>
                <Button onClick={() => setShowMap(true)} variant="default">
                  <Map className="h-4 w-4 mr-2" />
                  {t.showMap}
                </Button>
              </div>
              <p className="text-sm text-gray-500 px-1">
                {language === "en"
                  ? '💡 Enter your location (e.g., "Jaipur, Rajasthan") and click "Show on Map" to search for nearby camps and hospitals'
                  : '💡 अपना स्थान दर्ज करें (जैसे, "जयपुर, राजस्थान") और निकटवर्ती शिविर और अस्पताल खोजने के लिए "मानचित्र पर दिखाएं" पर क्लिक करें'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Sort */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">{language === "en" ? "Filter:" : "फ़िल्टर:"}</span>
                <Button
                  size="sm"
                  variant={selectedType === "all" ? "default" : "outline"}
                  onClick={() => setSelectedType("all")}
                >
                  {t.filterAll}
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === "blood-donation" ? "default" : "outline"}
                  onClick={() => setSelectedType("blood-donation")}
                >
                  {t.filterBlood}
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === "checkup" ? "default" : "outline"}
                  onClick={() => setSelectedType("checkup")}
                >
                  {t.filterCheckup}
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === "vaccination" ? "default" : "outline"}
                  onClick={() => setSelectedType("vaccination")}
                >
                  {t.filterVaccination}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{language === "en" ? "Sort:" : "क्रमबद्ध:"}</span>
                <Button
                  size="sm"
                  variant={sortBy === "distance" ? "default" : "outline"}
                  onClick={() => setSortBy("distance")}
                >
                  {t.sortDistance}
                </Button>
                <Button size="sm" variant={sortBy === "date" ? "default" : "outline"} onClick={() => setSortBy("date")}>
                  {t.sortDate}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camp Locations List */}
        {!userLocation ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t.noLocation}</p>
            </CardContent>
          </Card>
        ) : sortedCamps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t.noCamps}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedCamps.map((camp) => (
              <Card key={camp.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(camp.type)}
                          <div>
                            <h3 className="text-xl font-semibold">{camp.name}</h3>
                            <p className="text-gray-600 text-sm">{camp.description}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(camp.status)} text-white`}>
                          {camp.status === "active" && t.active}
                          {camp.status === "upcoming" && t.upcoming}
                          {camp.status === "completed" && t.completed}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{camp.address}</span>
                          </div>
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-2" />
                            <span>{camp.landmark}</span>
                          </div>
                          <div className="flex items-center">
                            <Compass className="h-4 w-4 mr-2" />
                            <span className="font-medium text-blue-600">
                              {camp.distance} {t.kmAway}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {formatDate(camp.date)} at {camp.time}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {t.travelTime}: ~{getTravelTime(camp.distance)} {t.minutes}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>
                              {camp.participants} {t.participants}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 space-y-2">
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        <Button onClick={() => getDirections(camp)} className="flex items-center justify-center">
                          <Navigation className="h-4 w-4 mr-1" />
                          {t.getDirections}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => callCamp(camp)}
                          className="flex items-center justify-center"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          {t.callCamp}
                        </Button>
                      </div>

                      {camp.status !== "completed" && (
                        <Button variant="secondary" onClick={() => registerForCamp(camp)} className="w-full">
                          {t.registerNow}
                        </Button>
                      )}

                      <Button variant="outline" onClick={() => setShowMap(true)} className="w-full">
                        <Map className="h-4 w-4 mr-1" />
                        {t.viewOnMap}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                onClick={() => setCurrentPage("campaigns")}
                className="h-16 flex flex-col items-center justify-center space-y-2"
              >
                <Calendar className="h-6 w-6" />
                <span>{language === "en" ? "All Campaigns" : "सभी अभियान"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage("directory")}
                className="h-16 flex flex-col items-center justify-center space-y-2"
              >
                <MapPin className="h-6 w-6" />
                <span>{language === "en" ? "Healthcare Directory" : "स्वास्थ्य निर्देशिका"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  alert(language === "en" ? "Emergency services contacted!" : "आपातकालीन सेवाओं से संपर्क किया गया!")
                }
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
        <h3 className="font-semibold">{language === "en" ? "Nearby Facilities" : "निकटतम सुविधाएं"}</h3>
        <button onClick={() => setShowMap(false)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">✕</button>
      </div>
      <MapView language={language} />
    </div>
  </div>
)}
    </div>
  )
}
