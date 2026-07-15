"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import {
  MapPin,
  Navigation,
  Calendar,
  Users,
  Phone,
  Search,
  Locate,
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
  id: number | string
  name: string
  type: "blood-donation" | "checkup" | "vaccination"
  address: string
  landmark: string
  coordinates: { lat: number; lng: number }
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
  const [registering, setRegistering] = useState<number | null>(null)
  const [registeredCamps, setRegisteredCamps] = useState<Set<number>>(new Set())

  const currentYear = new Date().getFullYear()

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
      sortDistance: "By Location",
      sortDate: "Upcoming First",
      getDirections: "Get Directions",
      callCamp: "Call Camp",
      registerNow: "Register Now",
      shareLocation: "Share Location",

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
      sortDistance: "स्थान अनुसार",
      sortDate: "आगामी पहले",
      getDirections: "दिशा निर्देश पाएं",
      callCamp: "शिविर पर कॉल करें",
      registerNow: "अभी पंजीकरण करें",
      shareLocation: "स्थान साझा करें",

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

    },
  }

  const t = content[language as keyof typeof content]

  // Real Madhya Pradesh government health programs & camps (Initial static fallback)
  const [campLocations, setCampLocations] = useState<CampLocation[]>([
    {
      id: 1,
      name: language === "en" ? "NHM Free Health Checkup Camp" : "NHM मुफ्त स्वास्थ्य जांच शिविर",
      type: "checkup",
      address: language === "en" ? "CHC Berasia, Bhopal District" : "CHC बैरसिया, भोपाल जिला",
      landmark: language === "en" ? "Near Berasia Bus Stand" : "बैरसिया बस स्टैंड के पास",
      coordinates: { lat: 23.6352, lng: 77.4325 },
      date: `${currentYear}-08-15`,
      time: "09:00 AM",
      contact: "+91 755-2770491",
      participants: 150,
      status: "upcoming",
      description: language === "en" ? "NHM Madhya Pradesh free screening: BP, diabetes, anemia, eye & dental checkup for all ages" : "NHM मध्य प्रदेश मुफ्त जांच: बीपी, मधुमेह, एनीमिया, आंख और दंत जांच",
    },
    {
      id: 2,
      name: language === "en" ? "Ayushman Arogya Mandir — Wellness Day" : "आयुष्मान आरोग्य मंदिर — वेलनेस दिवस",
      type: "checkup",
      address: language === "en" ? "PHC Sehore, Sehore District" : "PHC सीहोर, सीहोर जिला",
      landmark: language === "en" ? "Near District Collectorate" : "जिला कलेक्ट्रेट के पास",
      coordinates: { lat: 23.2050, lng: 77.0851 },
      date: `${currentYear}-08-01`,
      time: "08:00 AM",
      contact: "+91 7562-224430",
      participants: 200,
      status: "active",
      description: language === "en" ? "Monthly Wellness Day at AB-HWC: free NCD screening, yoga, TB and hypertension checks" : "AB-HWC मासिक वेलनेस दिवस: मुफ्त NCD जांच, योग, TB और उच्च रक्तचाप जांच",
    },
    {
      id: 3,
      name: language === "en" ? "RBSK School Health Screening" : "RBSK स्कूल स्वास्थ्य जांच",
      type: "checkup",
      address: language === "en" ? "Govt Higher Secondary School, Vidisha" : "राजकीय उच्चतर माध्यमिक विद्यालय, विदिशा",
      landmark: language === "en" ? "Vidisha Old City" : "विदिशा पुराना शहर",
      coordinates: { lat: 23.5252, lng: 77.8081 },
      date: `${currentYear}-08-20`,
      time: "10:00 AM",
      contact: "+91 7592-234567",
      participants: 300,
      status: "upcoming",
      description: language === "en" ? "Rashtriya Bal Swasthya Karyakram: free screening of children for birth defects, diseases, deficiencies & developmental delays" : "राष्ट्रीय बाल स्वास्थ्य कार्यक्रम: जन्म दोष, बीमारी, कमी और विकास में देरी की मुफ्त जांच",
    },
    {
      id: 4,
      name: language === "en" ? "Jan Aushadhi Camp & Medicine Distribution" : "जन औषधि शिविर और दवा वितरण",
      type: "checkup",
      address: language === "en" ? "Jan Aushadhi Kendra, Hoshangabad Rd, Bhopal" : "जन औषधि केंद्र, होशंगाबाद रोड, भोपाल",
      landmark: language === "en" ? "Near Habibganj Railway Station" : "हबीबगंज रेलवे स्टेशन के पास",
      coordinates: { lat: 23.2295, lng: 77.4382 },
      date: `${currentYear}-08-10`,
      time: "10:00 AM",
      contact: "+91 1800-180-8080",
      participants: 80,
      status: "upcoming",
      description: language === "en" ? "Free generic medicines at MRP + basic health checkup by AYUSH doctors" : "MRP पर मुफ्त जेनेरिक दवाइयां + AYUSH डॉक्टर द्वारा बुनियादी स्वास्थ्य जांच",
    },
    {
      id: 5,
      name: language === "en" ? "Indian Red Cross Blood Donation Drive" : "भारतीय रेड क्रॉस रक्तदान अभियान",
      type: "blood-donation",
      address: language === "en" ? "Red Cross Bhawan, TT Nagar, Bhopal" : "रेड क्रॉस भवन, टीटी नगर, भोपाल",
      landmark: language === "en" ? "Opposite TT Nagar Stadium" : "टीटी नगर स्टेडियम के सामने",
      coordinates: { lat: 23.2330, lng: 77.4020 },
      date: `${currentYear}-08-14`,
      time: "09:00 AM",
      contact: "+91 755-2661491",
      participants: 120,
      status: "upcoming",
      description: language === "en" ? "Voluntary blood donation drive by MP State Red Cross Society — all blood groups needed" : "MP राज्य रेड क्रॉस सोसाइटी द्वारा स्वैच्छिक रक्तदान अभियान — सभी ब्लड ग्रुप की जरूरत",
    },
    {
      id: 6,
      name: language === "en" ? "Pulse Polio Immunization Round" : "पल्स पोलियो टीकाकरण अभियान",
      type: "vaccination",
      address: language === "en" ? "Anganwadi Centre, Raisen District" : "आंगनवाड़ी केंद्र, रायसेन जिला",
      landmark: language === "en" ? "Near Raisen Fort Road" : "रायसेन किला रोड के पास",
      coordinates: { lat: 23.3315, lng: 77.7874 },
      date: `${currentYear}-08-25`,
      time: "08:00 AM",
      contact: "+91 7482-222333",
      participants: 250,
      status: "upcoming",
      description: language === "en" ? "National Immunization Day: OPV drops for children 0-5 years at all booths in Raisen" : "राष्ट्रीय टीकाकरण दिवस: रायसेन में सभी बूथों पर 0-5 वर्ष के बच्चों के लिए OPV ड्रॉप्स",
    },
    {
      id: 7,
      name: language === "en" ? "ASHA Maternal & Child Health Camp" : "ASHA मातृ एवं शिशु स्वास्थ्य शिविर",
      type: "checkup",
      address: language === "en" ? "Sub-Centre, Obedullaganj, Raisen" : "उप-केंद्र, ओबेदुल्लागंज, रायसेन",
      landmark: language === "en" ? "Near Govt School" : "सरकारी स्कूल के पास",
      coordinates: { lat: 23.4052, lng: 77.5903 },
      date: `${currentYear}-08-05`,
      time: "09:30 AM",
      contact: "+91 7480-255444",
      participants: 60,
      status: "active",
      description: language === "en" ? "ASHA-led prenatal checkups, iron-folic acid distribution, nutrition counseling for pregnant & lactating women" : "ASHA द्वारा प्रसवपूर्व जांच, आयरन-फोलिक एसिड वितरण, गर्भवती और स्तनपान कराने वाली महिलाओं के लिए पोषण परामर्श",
    },
    {
      id: 8,
      name: language === "en" ? "RNTCP TB Screening Camp" : "RNTCP TB जांच शिविर",
      type: "checkup",
      address: language === "en" ? "District TB Centre, Hamidia Hospital, Bhopal" : "जिला TB केंद्र, हमीदिया अस्पताल, भोपाल",
      landmark: language === "en" ? "Inside Hamidia Hospital Campus" : "हमीदिया अस्पताल परिसर के अंदर",
      coordinates: { lat: 23.2688, lng: 77.4126 },
      date: `${currentYear}-08-12`,
      time: "10:00 AM",
      contact: "+91 755-2540222",
      participants: 90,
      status: "upcoming",
      description: language === "en" ? "Free sputum test, chest X-ray, CBNAAT testing under Nikshay Poshan Yojana" : "निक्षय पोषण योजना के तहत मुफ्त बलगम जांच, छाती X-रे, CBNAAT परीक्षण",
    },
  ])

  useEffect(() => {
    const fetchDBCamps = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("camps").select("*")
      if (error || !data) return
      
      const mapped = data.map(dbCamp => ({
        id: dbCamp.id,
        name: dbCamp.title || "Health Camp",
        type: (dbCamp.category?.toLowerCase() || "checkup") as any,
        address: dbCamp.address || "",
        landmark: dbCamp.location || "",
        coordinates: { lat: 0, lng: 0 }, // DB camps don't have lat/lng yet
        date: dbCamp.start_date || "",
        time: dbCamp.start_time || "",
        contact: dbCamp.phone || "",
        participants: dbCamp.participants || 0,
        status: (dbCamp.status || "upcoming") as any,
        description: dbCamp.description || "",
      }))
      
      // Merge with initial hardcoded ones (prevent duplicates if seeded)
      setCampLocations(prev => {
        const existingNames = new Set(prev.map(c => c.name))
        const newCamps = mapped.filter(c => !existingNames.has(c.name))
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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filteredCamps = campLocations.filter((camp) => {
    const matchesType = selectedType === "all" || camp.type === selectedType
    const matchesLocation = !userLocation.trim() || 
      camp.address.toLowerCase().includes(userLocation.toLowerCase()) ||
      camp.landmark.toLowerCase().includes(userLocation.toLowerCase()) ||
      camp.name.toLowerCase().includes(userLocation.toLowerCase())
    return matchesType && matchesLocation
  })

  const sortedCamps = [...filteredCamps].sort((a, b) => {
    if (sortBy === "distance" && userCoordinates) {
      const distA = getDistance(userCoordinates.lat, userCoordinates.lng, a.coordinates?.lat, a.coordinates?.lng)
      const distB = getDistance(userCoordinates.lat, userCoordinates.lng, b.coordinates?.lat, b.coordinates?.lng)
      return distA - distB
    } else if (sortBy === "distance") {
      return a.address.localeCompare(b.address) // fallback if no GPS
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
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${camp.coordinates.lat},${camp.coordinates.lng}`, '_blank')
  }

  const callCamp = (camp: CampLocation) => {
    window.open(`tel:${camp.contact}`)
  }

  const registerForCamp = async (camp: CampLocation) => {
    setRegistering(camp.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert(language === "en" 
          ? "Please login first to register for this camp." 
          : "इस शिविर के लिए पंजीकरण करने हेतु पहले लॉगिन करें।")
        setRegistering(null)
        return
      }
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_type: 'other',
          content: `[Camp Registration] ${camp.name} — ${camp.address} on ${camp.date} at ${camp.time}. Contact: ${camp.contact}`,
        }),
      })
      if (res.ok) {
        setRegisteredCamps(prev => new Set(prev).add(camp.id))
        alert(language === "en"
          ? "Successfully registered! Check your Medical Records for details."
          : "सफलतापूर्वक पंजीकृत! विवरण के लिए अपने मेडिकल रिकॉर्ड देखें।")
      } else {
        const err = await res.json()
        alert(err.error || (language === "en" ? "Registration failed. Please try again." : "पंजीकरण विफल। कृपया पुनः प्रयास करें।"))
      }
    } catch {
      alert(language === "en" ? "Network error. Please try again." : "नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।")
    } finally {
      setRegistering(null)
    }
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
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {formatDate(camp.date)} at {camp.time}
                              <span className="text-xs text-amber-600 ml-1">
                                ({language === "en" ? "Tentative — Annual" : "अस्थायी — वार्षिक"})
                              </span>
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
                        <Button 
                          variant="secondary" 
                          onClick={() => registerForCamp(camp)} 
                          className="w-full"
                          disabled={registering === camp.id || registeredCamps.has(camp.id)}
                        >
                          {registering === camp.id 
                            ? (language === "en" ? "Registering..." : "पंजीकरण हो रहा है...")
                            : registeredCamps.has(camp.id)
                              ? (language === "en" ? "✓ Registered" : "✓ पंजीकृत")
                              : t.registerNow}
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
                onClick={() => window.open('tel:108')}
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
