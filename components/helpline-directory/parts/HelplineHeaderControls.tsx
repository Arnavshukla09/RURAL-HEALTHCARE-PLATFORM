"use client"

/**
 * components/helpline-directory/parts/HelplineHeaderControls.tsx
 *
 * State selection, search input, view mode toggle, and category pills.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Helpline Subsystem
 */

import { Phone, MapPin, Globe, Search } from "lucide-react"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import { CATEGORY_THEMES } from "../types"
import type { HelplineCategory } from "@/lib/emergency/helplines"

interface HelplineHeaderControlsProps {
  en: boolean
  viewMode: "state" | "all"
  setViewMode: (mode: "state" | "all") => void
  selectedStateCode: string
  setSelectedStateCode: (code: string) => void
  isDetectingLocation: boolean
  handleDetectLocation: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedCategory: HelplineCategory
  setSelectedCategory: (cat: HelplineCategory) => void
}

export function HelplineHeaderControls({
  en,
  viewMode,
  setViewMode,
  selectedStateCode,
  setSelectedStateCode,
  isDetectingLocation,
  handleDetectLocation,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}: HelplineHeaderControlsProps) {
  return (
    <CardHeader className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-gray-900">
            <Phone className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>
              {en
                ? "National & State Emergency Helpline Directory"
                : "राष्ट्रीय एवं राज्य आपातकालीन हेल्पलाइन निर्देशिका"}
            </span>
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            {en
              ? "Explore verified helpline contacts across all 36 States/UTs with distinct category color themes."
              : "सभी 36 राज्यों व केंद्र शासित प्रदेशों के सत्यापित हेल्पलाइन नंबर खोजें।"}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto border border-gray-200">
          <button
            onClick={() => setViewMode("state")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "state"
                ? "bg-white text-red-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-red-600" />
            <span>{en ? "State View" : "राज्य अनुसार"}</span>
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "all"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-teal-600" />
            <span>{en ? "All-India Directory" : "संपूर्ण देश"}</span>
          </button>
        </div>
      </div>

      {/* State Selector Bar (Active in State View) */}
      {viewMode === "state" && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
              {en ? "Select State / UT:" : "राज्य / केंद्र शासित प्रदेश चुनें:"}
            </span>
            <select
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full py-1.5 px-2.5 font-medium shadow-sm"
            >
              {LGD_STATES.map((state: any) => (
                <option key={state.code} value={state.code}>
                  {en ? state.nameEn : state.nameHi} ({state.nameEn})
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            variant="outline"
            size="sm"
            className="text-xs bg-white border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1.5 h-8 flex-shrink-0 font-medium"
          >
            <MapPin className={`h-3.5 w-3.5 ${isDetectingLocation ? "animate-spin" : ""}`} />
            <span>
              {isDetectingLocation
                ? en ? "Detecting..." : "पहचान रहा है..."
                : en ? "Detect My State" : "मेरा राज्य पहचानें"}
            </span>
          </Button>
        </div>
      )}

      {/* Search Input */}
      <div className="mt-3 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            en
              ? "Search helplines by name, number (e.g. 108, 112, 104), or topic..."
              : "नाम, नंबर (उदा. 108, 112, 104) या विषय से खोजें..."
          }
          className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border-gray-200 rounded-xl"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(CATEGORY_THEMES) as HelplineCategory[]).map((cat) => {
          const theme = CATEGORY_THEMES[cat]
          const Icon = theme.icon
          const isSelected = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 border ${
                isSelected
                  ? "bg-red-600 text-white border-red-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{en ? theme.en : theme.hi}</span>
            </button>
          )
        })}
      </div>
    </CardHeader>
  )
}
