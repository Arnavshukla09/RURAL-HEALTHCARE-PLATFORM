"use client"

/**
 * components/map-view/parts/FacilityMapControls.tsx
 *
 * Search inputs, category filters, radius chips, and LGD state/district dropdowns.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, LocateFixed, MapPin, Minimize2, Maximize2, Navigation } from "lucide-react"
import { SearchableDropdown } from "./SearchableDropdown"
import type { Facility } from "../types"
import { TYPE_CONFIG } from "../types"

interface FacilityMapControlsProps {
  en: boolean
  selectedState: string
  selectedDistrict: string
  stateOptions: { code: string; nameEn: string; nameHi?: string }[]
  districtOptions: { code: string; nameEn: string; nameHi?: string }[]
  onStateChange: (code: string) => void
  onDistrictChange: (code: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onUseMyLocation: () => void
  locating: boolean
  filter: Facility["type"] | "all"
  onFilterChange: (filter: Facility["type"] | "all") => void
  counts: Record<string, number>
  radiusKm: number
  onRadiusChange: (km: number) => void
  facilitiesCount: number
  isMapExpanded: boolean
  setIsMapExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void
  onNearest: () => void
  nearestLabel: string
  nearestDisabled: boolean
  nearestName?: string
}

export function FacilityMapControls({
  en,
  selectedState,
  selectedDistrict,
  stateOptions,
  districtOptions,
  onStateChange,
  onDistrictChange,
  searchQuery,
  setSearchQuery,
  onUseMyLocation,
  locating,
  filter,
  onFilterChange,
  counts,
  radiusKm,
  onRadiusChange,
  facilitiesCount,
  isMapExpanded,
  setIsMapExpanded,
  onNearest,
  nearestLabel,
  nearestDisabled,
  nearestName,
}: FacilityMapControlsProps) {
  return (
    <div className="space-y-4" data-testid="facility-search-controls">
      <div>
        <h2 className="text-2xl font-bold mb-1">
          {en ? "Find healthcare nearby" : "आस-पास स्वास्थ्य सुविधाएं खोजें"}
        </h2>
        <p className="text-sm text-gray-500">
          {en
            ? "Choose a location and service, then find the nearest result."
            : "स्थान और सेवा चुनें, फिर सबसे नज़दीकी परिणाम खोजें।"}
        </p>
      </div>

      {/* LGD Geographic Navigation & Search Row */}
      <div className="relative z-30 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end" data-testid="facility-location-search">
        <div className="flex-1 flex gap-2">
          <div className="w-1/2 md:w-52">
            <SearchableDropdown data-voice-control="ui.c409f2cc5d0d8184"
              label={en ? "State" : "राज्य"}
              placeholder={en ? "Select State" : "राज्य चुनें"}
              searchPlaceholder={en ? "Search state..." : "राज्य खोजें..."}
              selectedCode={selectedState}
              options={stateOptions}
              onSelect={onStateChange}
              en={en}
            />
          </div>

          <div className="w-1/2 md:w-56">
            <SearchableDropdown data-voice-control="ui.078e0bff4c22ae48"
              label={en ? "District" : "जिला"}
              placeholder={en ? "Select District" : "जिला चुनें"}
              searchPlaceholder={en ? "Search district..." : "जिला खोजें..."}
              selectedCode={selectedDistrict}
              options={districtOptions}
              onSelect={onDistrictChange}
              en={en}
            />
          </div>
        </div>

        <div className="relative flex-1">
          <label className="text-[11px] font-semibold text-blue-900 block mb-1">
            {en ? "Search Facility" : "सुविधा खोजें"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input data-voice-control="ui.aacb7b5278886778"
              placeholder={en ? "Search hospital or CHC name..." : "अस्पताल या CHC का नाम खोजें..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 text-sm bg-white" aria-label={[en ? "Search Facility" : "सुविधा खोजें"].join(' ')}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-3" data-testid="facility-service-filters">
        <p className="text-xs font-semibold text-gray-600">{en ? "Services" : "सेवाएं"}</p>
        <div className="flex flex-wrap gap-2">
          {(["all", "hospital", "health_post", "clinic", "pharmacy", "lab", "doctors"] as const).map((t) => (
            <button data-voice-control="ui.0032e5c70cf0d313"
              key={t}
              type="button"
              aria-pressed={filter === t}
              onClick={() => onFilterChange(t)}
              className={`min-h-11 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {t === "all"
                ? en ? `All (${counts.all ?? 0})` : `सभी (${counts.all ?? 0})`
                : `${TYPE_CONFIG[t].icon} ${en ? TYPE_CONFIG[t].en : TYPE_CONFIG[t].hi}${
                    counts[t] ? ` (${counts[t]})` : ""
                  }`}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-3 border-t border-gray-100 pt-3 sm:flex sm:justify-between" data-testid="facility-location-actions">
          <Button data-voice-control="ui.32ff11f9a954ab08" type="button" variant="outline" onClick={onUseMyLocation} disabled={locating} className="min-h-11 gap-2">
            {locating ? <Loader2 className="h-4 w-4 animate-spin"/> : <LocateFixed className="h-4 w-4"/>}{en ? "Use My Location" : "मेरा स्थान"}
          </Button>
        <label className="grid gap-1 text-xs font-semibold text-gray-600">{en ? "Search radius" : "खोज का दायरा"}
          <select data-voice-control="ui.d000cf7f1414a10b"
            value={radiusKm}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="min-h-11 min-w-28 rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900" aria-label={[en ? "Search radius" : "खोज का दायरा"].join(' ')}
          >
            {[10, 25, 50, 100].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </label>
        <Button data-voice-control="ui.460c306d2393970b" type="button" onClick={onNearest} disabled={nearestDisabled} className="col-span-2 min-h-11 gap-2 bg-blue-700 text-white hover:bg-blue-800"><Navigation className="h-4 w-4"/>{nearestLabel}</Button>
      </div>
      {nearestName && <p role="status" className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">{nearestLabel}: {nearestName}</p>}
      </div>

      {/* Map Header with Compact / Expand Toggle */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-blue-600" />
          <span>{en ? "Facility Map" : "सुविधा मानचित्र"}</span>
          <span className="text-gray-400 font-normal">
            ({facilitiesCount} {en ? "facilities plotted" : "सुविधाएं दर्शाई गई"})
          </span>
        </span>
        <Button data-voice-control="ui.b5e235754a451f6e"
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsMapExpanded((prev) => !prev)}
          className="min-h-11 text-xs gap-1.5 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-xs"
        >
          {isMapExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span>
            {isMapExpanded
              ? en ? "Compact map" : "छोटा नक्शा"
              : en ? "Expand map" : "बड़ा नक्शा"}
          </span>
        </Button>
      </div>
    </div>
  )
}
