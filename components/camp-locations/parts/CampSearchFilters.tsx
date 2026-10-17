"use client"

/**
 * components/camp-locations/parts/CampSearchFilters.tsx
 *
 * Location search input, geolocation detection, filter pills, and sorting controls.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Locate, Map } from "lucide-react"

interface CampSearchFiltersProps {
  language: string
  t: any
  userLocation: string
  setUserLocation: (loc: string) => void
  getCurrentLocation: () => void
  onShowMap: () => void
  selectedType: string
  setSelectedType: (type: string) => void
  sortBy: "distance" | "date"
  setSortBy: (sort: "distance" | "date") => void
}

export function CampSearchFilters({
  language,
  t,
  userLocation,
  setUserLocation,
  getCurrentLocation,
  onShowMap,
  selectedType,
  setSelectedType,
  sortBy,
  setSortBy,
}: CampSearchFiltersProps) {
  return (
    <>
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
              <Button onClick={onShowMap} variant="default">
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
              <span className="text-sm font-medium text-gray-700">
                {language === "en" ? "Filter:" : "फ़िल्टर:"}
              </span>
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
              <span className="text-sm font-medium text-gray-700">
                {language === "en" ? "Sort:" : "क्रमबद्ध:"}
              </span>
              <Button
                size="sm"
                variant={sortBy === "distance" ? "default" : "outline"}
                onClick={() => setSortBy("distance")}
              >
                {t.sortDistance}
              </Button>
              <Button
                size="sm"
                variant={sortBy === "date" ? "default" : "outline"}
                onClick={() => setSortBy("date")}
              >
                {t.sortDate}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
