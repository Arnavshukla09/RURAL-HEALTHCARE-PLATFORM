"use client"

/**
 * components/camp-locations/index.tsx
 *
 * Pan-India Annual Healthcare Campaigns & Outreach Event Hub.
 * Features state & district hierarchical filtering, real verified recurring drives,
 * and seamless patient registration linked to medical records.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Building2,
  Phone,
  Sparkles,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"

import { CampCard } from "./parts/CampCard"
import { CampSearchFilters } from "./parts/CampSearchFilters"
import {
  getCampLocationsContent,
  campaignToCampLocation,
  type CampLocationsProps,
  type CampLocation,
} from "./types"
import {
  PAN_INDIA_ANNUAL_CAMPAIGNS,
  filterAnnualCampaigns,
} from "@/lib/data/annual-campaigns"

export function CampLocations({ language }: CampLocationsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const en = language === "en"
  const t = getCampLocationsContent(language)

  // Search & Filter State (Identical Pan-India LGD Hierarchy as Doctor Directory)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStateCode, setSelectedStateCode] = useState("all")
  const [selectedDistrictName, setSelectedDistrictName] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Registration State
  const [registering, setRegistering] = useState<number | string | null>(null)
  const [registeredCamps, setRegisteredCamps] = useState<Set<number | string>>(new Set())

  // Dynamic DB Campaigns State
  const [dbCamps, setDbCamps] = useState<CampLocation[]>([])

  // State & District Options from LGD Source of Truth
  const stateOptions = useMemo(() => {
    return LGD_STATES.map((s) => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi,
    }))
  }, [])

  const districtOptions = useMemo(() => {
    if (selectedStateCode === "all") return []
    const foundState = LGD_STATES.find((s) => s.code === selectedStateCode)
    if (!foundState) return []
    return foundState.districts.map((d) => ({
      code: d.nameEn,
      nameEn: d.nameEn,
      nameHi: d.nameHi,
    }))
  }, [selectedStateCode])

  // Fetch optional dynamic campaigns from Supabase database
  useEffect(() => {
    const fetchDBCamps = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("camps").select("*")
        if (error || !data) return

        const mapped: CampLocation[] = data.map((dbCamp: any) => ({
          id: dbCamp.id,
          name: dbCamp.title || "Health Camp",
          type: (dbCamp.category?.toLowerCase() || "checkup") as any,
          address: dbCamp.address || "",
          landmark: dbCamp.location || "",
          coordinates: { lat: 0, lng: 0 },
          date: dbCamp.start_date || "",
          time: dbCamp.start_time || "09:00 AM",
          contact: dbCamp.phone || "104",
          participants: dbCamp.participants || 100,
          status: (dbCamp.status || "upcoming") as any,
          description: dbCamp.description || "",
          scope: "state",
          cost: en ? "Free / Cashless" : "मुफ्त / कैशलेस",
          organizer: dbCamp.organizer || "Health Department",
        }))

        setDbCamps(mapped)
      } catch {
        // Fallback gracefully to curated national dataset
      }
    }
    fetchDBCamps()
  }, [en])

  // Process & Filter Campaigns
  const processedCamps = useMemo(() => {
    const filteredCurated = filterAnnualCampaigns({
      category: selectedCategory,
      stateCode: selectedStateCode,
      districtName: selectedDistrictName,
      searchQuery,
    }).map((c) => campaignToCampLocation(c, language))

    // Merge with DB camps if matching state/category
    const filteredDb = dbCamps.filter((c) => {
      if (selectedCategory !== "all" && c.type !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        )
      }
      return true
    })

    return [...filteredCurated, ...filteredDb]
  }, [selectedCategory, selectedStateCode, selectedDistrictName, searchQuery, language, dbCamps])

  // Active filters tracker
  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedStateCode !== "all" ||
    selectedDistrictName !== "all" ||
    searchQuery.trim().length > 0

  const resetAllFilters = () => {
    setSelectedCategory("all")
    setSelectedStateCode("all")
    setSelectedDistrictName("all")
    setSearchQuery("")
  }

  // Registration Handler
  const handleRegister = async (camp: CampLocation) => {
    setRegistering(camp.id)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: en ? "Login Required" : "लॉगिन आवश्यक है",
          description: en
            ? "Please sign in to register and save this camp to your medical records."
            : "कृपया पंजीकरण करने और इस शिविर को अपने मेडिकल रिकॉर्ड में सहेजने के लिए लॉगिन करें।",
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
          content: `[Annual Health Drive Registration] ${camp.name} | Timing: ${camp.time} | Recurrence: ${camp.recurrence || camp.date} | Venue: ${camp.address} | Organizer: ${camp.organizer || "NHM"}. Helpline: ${camp.contact}`,
        }),
      })

      if (res.ok) {
        setRegisteredCamps((prev) => new Set(prev).add(camp.id))
        toast({
          title: en ? "Registered Successfully! ✓" : "सफलतापूर्वक पंजीकृत! ✓",
          description: en
            ? "Saved in your Medical Records. You will receive SMS updates before the camp."
            : "आपके मेडिकल रिकॉर्ड में सहेजा गया। शिविर से पहले आपको सूचना भेजी जाएगी।",
        })
      } else {
        const err = await res.json()
        toast({
          title: en ? "Registration Failed" : "पंजीकरण विफल",
          description: err.error || (en ? "Please try again later." : "कृपया बाद में पुनः प्रयास करें।"),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: en ? "Network Error" : "नेटवर्क त्रुटि",
        description: en ? "Could not reach server. Please try again." : "सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।",
        variant: "destructive",
      })
    } finally {
      setRegistering(null)
    }
  }

  const handleCall = (camp: CampLocation) => {
    const raw = camp.contact.replace(/[^0-9+]/g, "")
    window.open(`tel:${raw}`, "_self")
  }

  const handleShare = async (camp: CampLocation) => {
    const text = `🏥 ${camp.name}\n📅 ${camp.recurrence || camp.date} (${camp.time})\n📍 ${camp.address}\n💰 ${camp.cost || "Free under NHM"}\n📞 ${camp.contact}`
    if (navigator.share) {
      try {
        await navigator.share({ title: camp.name, text })
      } catch {
        // User dismissed
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast({
        title: en ? "Details Copied!" : "विवरण कॉपी किया गया!",
        description: en ? "Paste anywhere to share with family or community." : "परिवार या ग्रामीणों के साथ साझा करने के लिए कहीं भी पेस्ट करें।",
      })
    }
  }

  const nationalCount = useMemo(() => {
    return PAN_INDIA_ANNUAL_CAMPAIGNS.filter((c) => c.scope === "national").length
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-600 text-white font-bold text-xs px-2.5 py-0.5">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            {en ? "Pan-India Outreach" : "अखिल भारतीय आउटरीच"}
          </Badge>
          <span className="text-xs text-gray-500 font-medium">
            {en ? "Verified MoHFW & NHM Recurring Programs" : "सत्यापित MoHFW एवं NHM वार्षिक कार्यक्रम"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl">
          {t.subtitle}
        </p>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs text-center">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{processedCamps.length}</div>
          <div className="text-[11px] text-gray-500 font-medium">{en ? "Active / Matching" : "सक्रिय / उपलब्ध"}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs text-center">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{nationalCount}</div>
          <div className="text-[11px] text-gray-500 font-medium">{en ? "National All-India Drives" : "राष्ट्रीय अभियान"}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs text-center">
          <div className="text-xl sm:text-2xl font-bold text-amber-600">100%</div>
          <div className="text-[11px] text-gray-500 font-medium">{en ? "Free Government Care" : "निःशुल्क सरकारी सेवा"}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs text-center">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">36</div>
          <div className="text-[11px] text-gray-500 font-medium">{en ? "States & UTs Covered" : "राज्य एवं केंद्र शासित"}</div>
        </div>
      </div>

      {/* Search & Hierarchical State/District Filters */}
      <CampSearchFilters
        language={language}
        t={t}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStateCode={selectedStateCode}
        setSelectedStateCode={setSelectedStateCode}
        selectedDistrictName={selectedDistrictName}
        setSelectedDistrictName={setSelectedDistrictName}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        stateOptions={stateOptions}
        districtOptions={districtOptions}
        resetAllFilters={resetAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Campaigns Listing */}
      {processedCamps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-3">
            <Info className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">{t.noCamps}</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {en
                ? "Try selecting 'All India' or clearing your search term to see nationwide campaigns."
                : "अखिल भारतीय अभियान देखने के लिए 'अखिल भारतीय' चुनें या खोज शब्द साफ़ करें।"}
            </p>
            <Button size="sm" variant="outline" onClick={resetAllFilters} className="mt-2 text-xs">
              {t.resetFilters}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {processedCamps.map((camp) => (
            <CampCard
              key={camp.id}
              camp={camp}
              language={language}
              t={t}
              registering={registering}
              registeredCamps={registeredCamps}
              onRegister={handleRegister}
              onCall={handleCall}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* Quick Navigation Footer */}
      <Card className="bg-gray-50/70 border-gray-200">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              {en ? "Looking for permanent clinicians or nearby hospitals?" : "नियमित डॉक्टरों या निकटतम अस्पतालों की तलाश है?"}
            </h4>
            <p className="text-xs text-gray-600">
              {en ? "Search our GPS-scoped clinician and facility directory." : "हमारी जीपीएस आधारित डॉक्टर व अस्पताल निर्देशिका खोजें।"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/directory")}
              className="text-xs h-9"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              <span>{en ? "Doctor Directory" : "चिकित्सक निर्देशिका"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/consultation")}
              className="text-xs h-9 bg-white"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span>{en ? "Teleconsultation" : "टेलीकंसल्टेशन"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
