"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Clock, 
  Users, 
  Stethoscope,
  Heart,
  Building,
  Calendar,
  Video,
  MessageCircle,
  Navigation,
  CheckCircle2,
  Filter,
  Sparkles,
  RotateCcw
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
  const [showOnlyFRU, setShowOnlyFRU] = useState(false)

  // Geo Proximity State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedStateCode, setSelectedStateCode] = useState<string>('all')
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('all')
  const [selectedRadius, setSelectedRadius] = useState<number>(0) // 0 = all
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
      (err) => {
        setIsLocating(false)
        setLocationStatus("Could not detect location. Please pick State/District.")
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }

  // Real Hospitals Catalog
  const hospitals = [
    {
      id: 1,
      name: language === 'en' ? 'AIIMS Bhopal' : 'एम्स भोपाल',
      type: 'government',
      location: language === 'en' ? 'Saket Nagar, Bhopal' : 'साकेत नगर, भोपाल',
      phone: '+91 755-2672355',
      emergency: true,
      beds: 900,
      availableBeds: 78,
      rating: 4.7,
      services: ['Emergency', 'Surgery', 'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Trauma Centre'],
      image: ''
    },
    {
      id: 2,
      name: language === 'en' ? 'Hamidia Hospital (GMC)' : 'हमीदिया अस्पताल (जीएमसी)',
      type: 'government',
      isFRU: true,
      location: language === 'en' ? 'Royal Market, Bhopal' : 'रॉयल मार्केट, भोपाल',
      phone: '+91 755-2540222',
      emergency: true,
      beds: 1100,
      availableBeds: 120,
      rating: 4.2,
      services: ['Emergency', 'Obstetrics & Gynecology (FRU)', 'Surgery', 'Orthopedics', 'Blood Bank', 'ICU'],
      image: ''
    },
    {
      id: 3,
      name: language === 'en' ? 'Kamla Nehru Hospital' : 'कमला नेहरू अस्पताल',
      type: 'government',
      isFRU: true,
      location: language === 'en' ? 'Arera Hills, Bhopal' : 'अरेरा हिल्स, भोपाल',
      phone: '+91 755-2540570',
      emergency: true,
      beds: 350,
      availableBeds: 40,
      rating: 4.3,
      services: ['Maternity (FRU)', 'Pediatrics', 'Gynecology', 'Blood Bank', 'NICU', 'General Medicine'],
      image: ''
    },
    {
      id: 4,
      name: language === 'en' ? 'Bansal Hospital' : 'बंसल अस्पताल',
      type: 'private',
      location: language === 'en' ? 'C-Sector, Shahpura, Bhopal' : 'सी-सेक्टर, शाहपुरा, भोपाल',
      phone: '+91 755-4082222',
      emergency: true,
      beds: 300,
      availableBeds: 25,
      rating: 4.5,
      services: ['Cardiology', 'Neurosurgery', 'Orthopedics', 'Cancer Centre', 'ICU', 'Dialysis'],
      image: ''
    },
    {
      id: 5,
      name: language === 'en' ? 'Chirayu Medical College & Hospital' : 'चिरायु मेडिकल कॉलेज एवं अस्पताल',
      type: 'private',
      location: language === 'en' ? 'Bhopal-Indore Highway, Bhopal' : 'भोपाल-इंदौर हाईवे, भोपाल',
      phone: '+91 755-6679100',
      emergency: true,
      beds: 550,
      availableBeds: 45,
      rating: 4.4,
      services: ['Emergency', 'Surgery', 'Cardiology', 'Orthopedics', 'Radiology', 'Pathology'],
      image: ''
    },
    {
      id: 6,
      name: language === 'en' ? 'MY Hospital (Indore)' : 'एम.वाय. अस्पताल (इंदौर)',
      type: 'government',
      location: language === 'en' ? 'MY Hospital Road, Indore' : 'एम.वाय. अस्पताल रोड, इंदौर',
      phone: '+91 731-2527383',
      emergency: true,
      beds: 1000,
      availableBeds: 95,
      rating: 4.1,
      services: ['Emergency', 'General Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Trauma'],
      image: ''
    },
    {
      id: 7,
      name: language === 'en' ? 'Bombay Hospital, Indore' : 'बॉम्बे अस्पताल, इंदौर',
      type: 'private',
      location: language === 'en' ? 'Ring Road, Indore' : 'रिंग रोड, इंदौर',
      phone: '+91 731-2558866',
      emergency: true,
      beds: 500,
      availableBeds: 30,
      rating: 4.6,
      services: ['Cardiology', 'Oncology', 'Nephrology', 'Neurology', 'Joint Replacement', 'ICU'],
      image: ''
    },
    {
      id: 8,
      name: language === 'en' ? 'District Hospital, Sehore' : 'जिला अस्पताल, सीहोर',
      type: 'government',
      isFRU: true,
      location: language === 'en' ? 'Civil Lines, Sehore' : 'सिविल लाइन्स, सीहोर',
      phone: '+91 7562-224430',
      emergency: true,
      beds: 120,
      availableBeds: 18,
      rating: 3.8,
      services: ['Emergency', 'General Medicine', 'Maternity (FRU)', 'Blood Storage', 'Pharmacy'],
      image: ''
    },
  ]

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

  // Filter & Proximity Calculation for Real Doctors
  const processedDoctors = useMemo(() => {
    let list: RealDoctor[] = REAL_DOCTORS.map(doc => {
      let distance: number | undefined = undefined
      if (referenceCoords) {
        distance = calculateDistanceKm(referenceCoords.lat, referenceCoords.lng, doc.lat, doc.lon)
      }
      return { ...doc, distance }
    })

    // Filter by Specialty
    if (selectedSpecialty !== 'all') {
      list = list.filter(doc => doc.specialty === selectedSpecialty)
    }

    // Filter by State if chosen
    if (selectedStateCode !== 'all') {
      list = list.filter(doc => doc.stateCode === selectedStateCode)
    }

    // Filter by District if chosen
    if (selectedDistrictName !== 'all') {
      list = list.filter(doc => doc.districtName.toLowerCase().includes(selectedDistrictName.toLowerCase()))
    }

    // Filter by Radius (if distance available and radius > 0)
    if (selectedRadius > 0) {
      list = list.filter(doc => doc.distance !== undefined && doc.distance <= selectedRadius)
    }

    // Filter by Search Query
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

    // Sort by proximity distance if available, otherwise by rating
    list.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      return b.rating - a.rating
    })

    return list
  }, [referenceCoords, selectedSpecialty, selectedStateCode, selectedDistrictName, selectedRadius, searchTerm])

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hospital.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFRU = showOnlyFRU ? (hospital as any).isFRU === true : true
    return matchesSearch && matchesFRU
  })

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
    setSelectedRadius(0)
    setUserCoords(null)
    setLocationStatus(null)
  }

  return (
    <div className="min-h-screen bg-gray-50/70 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.verified} • Pan-India Proximity Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t.title}</h1>
          <p className="text-sm text-gray-600">{t.subtitle}</p>
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

            {/* Bottom Row: State Selector + District Selector + Radius Picker */}
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
                  <option value="all">{t.allStates} (36 States/UTs)</option>
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

              {/* Radius Picker */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  {t.radius}
                </label>
                <div className="flex items-center gap-1">
                  {[0, 10, 25, 50, 100].map((rad) => (
                    <button
                      key={rad}
                      onClick={() => setSelectedRadius(rad)}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md border transition ${
                        selectedRadius === rad
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {rad === 0 ? "All" : `${rad}k`}
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

        {/* Directory Content Tabs */}
        <Tabs defaultValue="doctors" className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 max-w-xs">
              <TabsTrigger value="doctors" className="flex items-center gap-1.5 text-xs font-semibold">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>{t.doctors} ({processedDoctors.length})</span>
              </TabsTrigger>
              <TabsTrigger value="hospitals" className="flex items-center gap-1.5 text-xs font-semibold">
                <Building className="h-3.5 w-3.5" />
                <span>{t.hospitals} ({filteredHospitals.length})</span>
              </TabsTrigger>
            </TabsList>

            {referenceCoords && (
              <div className="text-xs text-gray-500 flex items-center gap-1.5 self-center sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-gray-700">{t.nearestFirst}</span>
                <span>(sorted by proximity)</span>
              </div>
            )}
          </div>

          {/* DOCTORS TAB */}
          <TabsContent value="doctors" className="space-y-4">
            {processedDoctors.length > 0 ? (
              processedDoctors.map((doctor) => (
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
                            <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{doctor.hospitalAffiliation}</span>
                          </div>

                          {/* Location Address */}
                          <div className="text-xs text-gray-500 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>{doctor.location}</span>
                          </div>

                          {/* OPD Timings */}
                          <div className="text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-amber-200/60 font-medium">
                            <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                            <span>{t.opdTimings}: {doctor.opdTimings}</span>
                          </div>

                          {/* Rating & Experience */}
                          <div className="flex items-center gap-4 text-xs text-gray-600 pt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-gray-800">{doctor.rating}</span>
                            </div>
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
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-6">
                <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700">{t.noDoctorsFound}</p>
                <p className="text-xs text-gray-400 mt-1">Try widening your search radius or changing the specialty filter.</p>
                <Button
                  onClick={resetAllFilters}
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs font-semibold"
                >
                  {t.resetFilters}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* HOSPITALS TAB */}
          <TabsContent value="hospitals" className="space-y-4">
            <div className="flex justify-end mb-2">
              <Button 
                variant={showOnlyFRU ? "default" : "outline"}
                onClick={() => setShowOnlyFRU(!showOnlyFRU)}
                size="sm"
                className="flex items-center text-xs h-8"
              >
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                <span>Show Only FRUs (First Referral Units)</span>
              </Button>
            </div>

            {filteredHospitals.length > 0 ? (
              filteredHospitals.map((hospital) => (
                <Card key={hospital.id} className="hover:shadow-md transition-shadow border-gray-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row gap-5 justify-between">
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-lg font-bold text-gray-900">{hospital.name}</h3>
                            <Badge variant={hospital.type === 'government' ? 'secondary' : 'outline'} className="text-[10px]">
                              {hospital.type === 'government' ? t.government : t.private}
                            </Badge>
                            {hospital.emergency && (
                              <Badge className="bg-red-600 text-white text-[10px] font-semibold">
                                {t.emergency}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            <span>{hospital.location}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 gap-1.5 mb-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-mono">{hospital.phone}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-gray-800">{hospital.rating}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              <span>{hospital.availableBeds}/{hospital.beds} {t.beds}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">Services Available:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {hospital.services.map((service, index) => (
                              <Badge key={index} variant="outline" className="text-[10px] text-gray-700 bg-gray-50">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col justify-end gap-2 shrink-0 pt-2 md:pt-0">
                        <Button 
                          onClick={() => window.open(`tel:${hospital.phone}`)}
                          className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>{t.callNow}</span>
                        </Button>
                        {hospital.emergency && (
                          <Button 
                            variant="destructive"
                            onClick={() => window.open(`tel:${hospital.phone}`)}
                            className="h-8 text-xs font-bold"
                          >
                            {t.emergency}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                <Building className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No hospitals found matching your search.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
