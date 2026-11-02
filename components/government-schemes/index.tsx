"use client"

/**
 * components/government-schemes/index.tsx
 *
 * Government Health Schemes Directory — Central & State healthcare repository.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Schemes Subsystem
 */

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Sparkles, Building2, RotateCcw } from "lucide-react"
import {
  HEALTH_SCHEMES,
  SchemeCategory,
} from "@/lib/schemes/health-schemes"
import type { GovernmentSchemesProps } from "./types"
import { SchemeFilterControls } from "./parts/SchemeFilterControls"
import { SchemeCard } from "./parts/SchemeCard"
import { SchemePagination } from "./parts/SchemePagination"

export function GovernmentSchemes({ language }: GovernmentSchemesProps) {
  const router = useRouter()
  const en = language === "en"

  const [scopeMode, setScopeMode] = useState<"all" | "national" | "state">("all")
  const [selectedStateCode, setSelectedStateCode] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const stateOptions = useMemo(() => {
    const map = new Map<string, { code: string; nameEn: string; nameHi: string; count: number }>()
    for (const scheme of HEALTH_SCHEMES) {
      if (scheme.stateCode && scheme.stateNameEn) {
        const existing = map.get(scheme.stateCode)
        if (existing) {
          existing.count += 1
        } else {
          map.set(scheme.stateCode, {
            code: scheme.stateCode,
            nameEn: scheme.stateNameEn,
            nameHi: scheme.stateNameHi || scheme.stateNameEn,
            count: 1,
          })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nameEn.localeCompare(b.nameEn))
  }, [])

  const filteredSchemes = useMemo(() => {
    let list = HEALTH_SCHEMES

    if (scopeMode === "national") {
      list = list.filter((s) => s.scope === "national")
    } else if (scopeMode === "state") {
      list = list.filter((s) => s.scope === "state")
    }

    if (selectedStateCode !== "all") {
      list = list.filter((s) => s.stateCode === selectedStateCode || s.scope === "national")
    }

    if (selectedCategory !== "all") {
      list = list.filter((s) => s.categories.includes(selectedCategory))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((s) => {
        const titleMatch = s.titleEn.toLowerCase().includes(q) || s.titleHi.toLowerCase().includes(q)
        const descMatch = s.descriptionEn.toLowerCase().includes(q) || s.descriptionHi.toLowerCase().includes(q)
        const deptMatch = s.departmentEn.toLowerCase().includes(q) || s.departmentHi.toLowerCase().includes(q)
        const stateMatch = s.stateNameEn?.toLowerCase().includes(q) || s.stateNameHi?.toLowerCase().includes(q)
        const targetMatch =
          s.targetBeneficiariesEn.toLowerCase().includes(q) || s.targetBeneficiariesHi.toLowerCase().includes(q)
        const benefitsMatch =
          s.benefitsEn.some((b) => b.toLowerCase().includes(q)) ||
          s.benefitsHi.some((b) => b.toLowerCase().includes(q))
        return titleMatch || descMatch || deptMatch || stateMatch || targetMatch || benefitsMatch
      })
    }

    return list
  }, [scopeMode, selectedStateCode, selectedCategory, searchQuery])

  const SCHEMES_PER_PAGE = 5
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [scopeMode, selectedStateCode, selectedCategory, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredSchemes.length / SCHEMES_PER_PAGE))
  const paginatedSchemes = useMemo(() => {
    const start = (currentPage - 1) * SCHEMES_PER_PAGE
    return filteredSchemes.slice(start, start + SCHEMES_PER_PAGE)
  }, [filteredSchemes, currentPage])

  const nationalCount = useMemo(() => HEALTH_SCHEMES.filter((s) => s.scope === "national").length, [])
  const stateCount = useMemo(() => HEALTH_SCHEMES.filter((s) => s.scope === "state").length, [])

  const resetAllFilters = () => {
    setScopeMode("all")
    setSelectedStateCode("all")
    setSelectedCategory("all")
    setSearchQuery("")
  }

  const hasActiveFilters =
    scopeMode !== "all" ||
    selectedStateCode !== "all" ||
    selectedCategory !== "all" ||
    searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-gray-50/70 p-3 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span>{en ? "Back" : "वापस"}</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {en
                ? `${HEALTH_SCHEMES.length} Verified National & State Health Schemes`
                : `${HEALTH_SCHEMES.length} सत्यापित राष्ट्रीय एवं राज्य स्वास्थ्य योजनाएं`}
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            {en ? "Government Health Schemes Directory" : "सरकारी स्वास्थ्य योजनाएं निर्देशिका"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            {en
              ? "Comprehensive repository of Central Government and State healthcare schemes across India. Filter by children, maternal, disability/paralysis, cancer, age, and economic benefits."
              : "भारत सरकार और राज्य सरकारों द्वारा संचालित स्वास्थ्य योजनाओं का संपूर्ण डेटाबेस। बच्चों, महिलाओं, दिव्यांगता/लकवा, कैंसर, वरिष्ठ नागरिकों व आर्थिक योजनाओं के अनुसार खोजें।"}
          </p>
        </div>

        <SchemeFilterControls
          en={en}
          language={language}
          totalCount={HEALTH_SCHEMES.length}
          nationalCount={nationalCount}
          stateCount={stateCount}
          scopeMode={scopeMode}
          setScopeMode={setScopeMode}
          selectedStateCode={selectedStateCode}
          setSelectedStateCode={setSelectedStateCode}
          stateOptions={stateOptions}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          hasActiveFilters={hasActiveFilters}
          resetAllFilters={resetAllFilters}
        />

        {/* Results Header Count */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-gray-600">
            {en
              ? `Showing ${filteredSchemes.length === 0 ? 0 : (currentPage - 1) * SCHEMES_PER_PAGE + 1}–${Math.min(
                  currentPage * SCHEMES_PER_PAGE,
                  filteredSchemes.length
                )} of ${filteredSchemes.length} Schemes (Page ${currentPage} of ${totalPages})`
              : `${filteredSchemes.length} में से ${
                  filteredSchemes.length === 0 ? 0 : (currentPage - 1) * SCHEMES_PER_PAGE + 1
                }–${Math.min(currentPage * SCHEMES_PER_PAGE, filteredSchemes.length)} योजनाएं (पृष्ठ ${currentPage}/${totalPages})`}
          </p>
          {hasActiveFilters && (
            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-bold">
              {en ? "Filters Active" : "फ़िल्टर लागू"}
            </Badge>
          )}
        </div>

        {/* Schemes Card List */}
        {filteredSchemes.length > 0 ? (
          <div className="space-y-6">
            <div className="grid gap-6">
              {paginatedSchemes.map((scheme) => (
                <SchemeCard key={scheme.id} scheme={scheme} en={en} />
              ))}
            </div>

            <SchemePagination
              en={en}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSchemes.length}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : (
          <Card className="border-dashed border-gray-300 py-12 text-center bg-white rounded-2xl">
            <CardContent className="space-y-3 max-w-md mx-auto">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">
                {en ? "No Matching Health Schemes Found" : "कोई संबंधित स्वास्थ्य योजना नहीं मिली"}
              </h3>
              <p className="text-xs text-gray-500">
                {searchQuery
                  ? en
                    ? `No government schemes match the query "${searchQuery}". Try searching for broader terms like "hospital", "delivery", "dialysis" or "grant".`
                    : `"${searchQuery}" से संबंधित कोई योजना नहीं मिली। "अस्पताल", "प्रसव", "कैंसर" जैसे शब्दों से खोजें।`
                  : en
                  ? "No schemes available for the selected filters. Try choosing 'All Schemes' or another state."
                  : "चयनित फ़िल्टर के लिए कोई योजना नहीं मिली। 'सभी योजनाएं' चुनें।"}
              </p>
              <Button size="sm" variant="outline" onClick={resetAllFilters} className="text-xs font-semibold rounded-xl mt-2">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                <span>{en ? "Reset All Filters" : "सभी फ़िल्टर रीसेट करें"}</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default GovernmentSchemes
