"use client"

/**
 * components/government-schemes/parts/SchemeFilterControls.tsx
 *
 * Filter card with scope tabs, state dropdown, live search, and category pills.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Schemes Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react"
import { CATEGORY_FILTERS, SchemeCategory } from "@/lib/schemes/health-schemes"
import { SearchableStateSelect } from "./SearchableStateSelect"
import { getCategoryIcon } from "../types"

interface SchemeFilterControlsProps {
  en: boolean
  language: string
  totalCount: number
  nationalCount: number
  stateCount: number
  scopeMode: "all" | "national" | "state"
  setScopeMode: (mode: "all" | "national" | "state") => void
  selectedStateCode: string
  setSelectedStateCode: (code: string) => void
  stateOptions: { code: string; nameEn: string; nameHi: string; count: number }[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: SchemeCategory
  setSelectedCategory: (cat: SchemeCategory) => void
  hasActiveFilters: boolean
  resetAllFilters: () => void
}

export function SchemeFilterControls({
  en,
  language,
  totalCount,
  nationalCount,
  stateCount,
  scopeMode,
  setScopeMode,
  selectedStateCode,
  setSelectedStateCode,
  stateOptions,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  hasActiveFilters,
  resetAllFilters,
}: SchemeFilterControlsProps) {
  return (
    <Card className="border-gray-200 shadow-xs bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Scope Navigation Tabs: All vs National vs State */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center p-1 bg-gray-100/90 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setScopeMode("all")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scopeMode === "all"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {en ? `All Schemes (${totalCount})` : `सभी योजनाएं (${totalCount})`}
            </button>
            <button
              onClick={() => setScopeMode("national")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scopeMode === "national"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {en ? `🇮🇳 National (${nationalCount})` : `🇮🇳 केंद्रीय योजनाएं (${nationalCount})`}
            </button>
            <button
              onClick={() => setScopeMode("state")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scopeMode === "state"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {en ? `🏛️ State Schemes (${stateCount})` : `🏛️ राज्य योजनाएं (${stateCount})`}
            </button>
          </div>

          {/* State Filter Dropdown */}
          {scopeMode !== "national" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 hidden md:inline">
                {en ? "Filter State:" : "राज्य चुनें:"}
              </span>
              <SearchableStateSelect
                selectedStateCode={selectedStateCode}
                onSelect={setSelectedStateCode}
                language={language}
                stateOptions={stateOptions}
              />
            </div>
          )}
        </div>

        {/* Pop-Out Hero Universal Search Bar */}
        <div className="relative">
          <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl border-2 border-blue-200/90 shadow-2xs hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 transition-all p-1 sm:p-1.5">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-1">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <Input
              type="text"
              placeholder={
                en
                  ? "Search scheme name, disease (e.g. Cancer, Paralysis, Kidney), benefits, or authority..."
                  : "योजना का नाम, बीमारी (जैसे कैंसर, लकवा, डायलिसिस), लाभ, या विभाग खोजें..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none text-xs sm:text-sm font-medium px-3 h-9 sm:h-10 focus-visible:ring-0 placeholder:text-gray-400 text-gray-900 bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="h-7 w-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center shrink-0 mr-1"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category / Demographic Differentiators Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              <span>{en ? "Target Categories & Diseases:" : "श्रेणी एवं रोग अनुसार फ़िल्टर:"}</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{en ? "Reset All" : "रीसेट करें"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>{getCategoryIcon(cat.key, "h-3.5 w-3.5")}</span>
                  <span>{en ? cat.labelEn : cat.labelHi}</span>
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
