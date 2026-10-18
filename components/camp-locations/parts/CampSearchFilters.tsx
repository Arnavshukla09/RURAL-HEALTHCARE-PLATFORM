"use client"

/**
 * components/camp-locations/parts/CampSearchFilters.tsx
 *
 * Pan-India state & district selector, live search, and scrollable category pills with arrow heads.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RotateCcw, MapPin, Building2, Heart, Activity, Stethoscope, Eye, ShieldAlert, Baby } from "lucide-react"
import { ScrollableFilterRow } from "@/components/ui/scrollable-filter-row"
import { CAMPAIGN_CATEGORIES } from "@/lib/data/annual-campaigns"

interface CampSearchFiltersProps {
  language: string
  t: any
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedStateCode: string
  setSelectedStateCode: (code: string) => void
  selectedDistrictName: string
  setSelectedDistrictName: (district: string) => void
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  stateOptions: { code: string; nameEn: string; nameHi: string }[]
  districtOptions: { code: string; nameEn: string; nameHi: string }[]
  resetAllFilters: () => void
  hasActiveFilters: boolean
}

export function CampSearchFilters({
  language,
  t,
  searchQuery,
  setSearchQuery,
  selectedStateCode,
  setSelectedStateCode,
  selectedDistrictName,
  setSelectedDistrictName,
  selectedCategory,
  setSelectedCategory,
  stateOptions,
  districtOptions,
  resetAllFilters,
  hasActiveFilters,
}: CampSearchFiltersProps) {
  const en = language === "en"

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case "checkup":
        return <Activity className="h-3.5 w-3.5" />
      case "maternal":
        return <Baby className="h-3.5 w-3.5" />
      case "vaccination":
        return <Stethoscope className="h-3.5 w-3.5" />
      case "blood-donation":
        return <Heart className="h-3.5 w-3.5 text-red-500" />
      case "eye-care":
        return <Eye className="h-3.5 w-3.5" />
      case "communicable-disease":
        return <ShieldAlert className="h-3.5 w-3.5" />
      default:
        return <Building2 className="h-3.5 w-3.5" />
    }
  }

  return (
    <Card className="border shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Search Input & Reset Button */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm bg-white border-gray-200 rounded-xl"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="h-10 text-xs text-gray-600 hover:text-red-600 border-gray-200 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>{t.resetFilters}</span>
            </Button>
          )}
        </div>

        {/* State and District Dropdown Selection (Matching Doctor Directory Filtration) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span>{t.selectState}</span>
            </label>
            <select
              value={selectedStateCode}
              onChange={(e) => {
                setSelectedStateCode(e.target.value)
                setSelectedDistrictName("all")
              }}
              className="w-full h-9.5 px-3 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.allStates}</option>
              {stateOptions.map((st) => (
                <option key={st.code} value={st.code}>
                  {en ? st.nameEn : st.nameHi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.selectDistrict}</span>
            </label>
            <select
              value={selectedDistrictName}
              onChange={(e) => setSelectedDistrictName(e.target.value)}
              disabled={selectedStateCode === "all" || districtOptions.length === 0}
              className="w-full h-9.5 px-3 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="all">{t.allDistricts}</option>
              {districtOptions.map((d) => (
                <option key={d.code} value={d.code}>
                  {en ? d.nameEn : d.nameHi}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Category Filter Pills with Visible Left/Right Arrow Heads */}
        <div className="pt-1">
          <div className="text-xs font-semibold text-gray-600 mb-1.5">
            {t.filterLabel}
          </div>
          <ScrollableFilterRow contentClassName="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CAMPAIGN_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {getCategoryIcon(cat.key)}
                  <span>{en ? cat.labelEn : cat.labelHi}</span>
                </button>
              )
            })}
          </ScrollableFilterRow>
        </div>
      </CardContent>
    </Card>
  )
}
