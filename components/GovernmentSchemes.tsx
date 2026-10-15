"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { 
  ArrowLeft, 
  Search, 
  Building2, 
  CheckCircle2, 
  Phone, 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  IndianRupee, 
  Activity, 
  Baby, 
  Users, 
  Accessibility, 
  Dna, 
  Stethoscope, 
  Brain, 
  Zap, 
  RotateCcw, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Check, 
  X, 
  Info,
  SlidersHorizontal
} from "lucide-react"
import { 
  HEALTH_SCHEMES, 
  CATEGORY_FILTERS, 
  GovernmentHealthScheme, 
  SchemeScope, 
  SchemeCategory 
} from "@/lib/schemes/health-schemes"

interface GovernmentSchemesProps {
  language: string
}

// Map category icons dynamically
function getCategoryIcon(key: SchemeCategory, className: string = "h-5 w-5") {
  switch (key) {
    case "kids":
      return <Baby className={className} />
    case "females":
      return <Heart className={className} />
    case "elderly":
      return <Users className={className} />
    case "disability":
      return <Accessibility className={className} />
    case "cancer":
      return <Activity className={className} />
    case "rare_disease":
      return <Dna className={className} />
    case "kidney":
      return <Activity className={className} />
    case "tb":
      return <Stethoscope className={className} />
    case "mental_health":
      return <Brain className={className} />
    case "poverty_upliftment":
      return <ShieldCheck className={className} />
    case "emergency_trauma":
      return <Zap className={className} />
    default:
      return <Building2 className={className} />
  }
}

// Searchable State Dropdown with Top-Pinned Search Input
function SearchableStateSelect({
  selectedStateCode,
  onSelect,
  language,
  stateOptions
}: {
  selectedStateCode: string
  onSelect: (code: string) => void
  language: string
  stateOptions: { code: string; nameEn: string; nameHi: string; count: number }[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40)
    } else {
      setSearchTerm("")
    }
  }, [isOpen])

  const selectedItem = stateOptions.find(o => o.code === selectedStateCode)
  const displayName = selectedStateCode === "all"
    ? (language === "hi" ? "सभी राज्य एवं केंद्र शासित प्रदेश" : "All States & UTs")
    : selectedItem
      ? (language === "hi" ? selectedItem.nameHi : selectedItem.nameEn)
      : (language === "hi" ? "राज्य चुनें" : "Select State")

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return stateOptions
    const q = searchTerm.toLowerCase().trim()
    return stateOptions.filter(
      o => o.nameEn.toLowerCase().includes(q) || o.nameHi.toLowerCase().includes(q)
    )
  }, [stateOptions, searchTerm])

  return (
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full text-xs font-semibold border border-blue-200 hover:border-blue-400 rounded-xl px-3 py-2 bg-white text-gray-800 flex items-center justify-between shadow-2xs transition-colors"
      >
        <span className="truncate pr-1 text-left flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span className={selectedStateCode !== "all" ? "font-bold text-blue-900" : "text-gray-600"}>
            {displayName}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[240px] z-50 bg-white rounded-xl shadow-xl border border-blue-200 p-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Small search box inside state dropdown */}
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === "hi" ? "राज्य खोजें..." : "Type to filter states..."}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-50 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelect("all")
                setIsOpen(false)
              }}
              className={`w-full text-left py-1.5 px-2.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                selectedStateCode === "all"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-gray-700 hover:bg-gray-50 font-medium"
              }`}
            >
              <span>{language === "hi" ? "सभी राज्य एवं केंद्र शासित प्रदेश" : "All States & UTs"}</span>
              {selectedStateCode === "all" && (
                <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" />
              )}
            </button>

            {filtered.map((item) => {
              const isSelected = item.code === selectedStateCode
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onSelect(item.code)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left py-1.5 px-2.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-gray-700 hover:bg-gray-50 font-medium"
                  }`}
                >
                  <span className="truncate">
                    {language === "hi" ? item.nameHi : item.nameEn}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    <span className="text-[10px] text-gray-400 font-normal">({item.count})</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function GovernmentSchemes({ language }: GovernmentSchemesProps) {
  const router = useRouter()
  const en = language === "en"

  // Primary Scope Mode: "all" | "national" | "state"
  const [scopeMode, setScopeMode] = useState<"all" | "national" | "state">("all")

  // Selected State Filter (for state schemes)
  const [selectedStateCode, setSelectedStateCode] = useState<string>("all")

  // Target Beneficiary / Category Filter
  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory>("all")

  // Universal Live Keyword Search
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Available unique state list with scheme counts
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
            count: 1
          })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nameEn.localeCompare(b.nameEn))
  }, [])

  // Filtered schemes based on Scope, State, Category, and Keyword Search
  const filteredSchemes = useMemo(() => {
    let list = HEALTH_SCHEMES

    // 1. Filter by Scope
    if (scopeMode === "national") {
      list = list.filter(s => s.scope === "national")
    } else if (scopeMode === "state") {
      list = list.filter(s => s.scope === "state")
    }

    // 2. Filter by State (if specific state chosen)
    if (selectedStateCode !== "all") {
      list = list.filter(s => s.stateCode === selectedStateCode || s.scope === "national")
    }

    // 3. Filter by Category / Demographic Differentiator
    if (selectedCategory !== "all") {
      list = list.filter(s => s.categories.includes(selectedCategory))
    }

    // 4. Keyword Search across Title, Department, Description, Benefits, Eligibility, and State
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(s => {
        const titleMatch = s.titleEn.toLowerCase().includes(q) || s.titleHi.toLowerCase().includes(q)
        const descMatch = s.descriptionEn.toLowerCase().includes(q) || s.descriptionHi.toLowerCase().includes(q)
        const deptMatch = s.departmentEn.toLowerCase().includes(q) || s.departmentHi.toLowerCase().includes(q)
        const stateMatch = s.stateNameEn?.toLowerCase().includes(q) || s.stateNameHi?.toLowerCase().includes(q)
        const targetMatch = s.targetBeneficiariesEn.toLowerCase().includes(q) || s.targetBeneficiariesHi.toLowerCase().includes(q)
        const benefitsMatch = s.benefitsEn.some(b => b.toLowerCase().includes(q)) || s.benefitsHi.some(b => b.toLowerCase().includes(q))
        return titleMatch || descMatch || deptMatch || stateMatch || targetMatch || benefitsMatch
      })
    }

    return list
  }, [scopeMode, selectedStateCode, selectedCategory, searchQuery])

  // Pagination (5 schemes per page to prevent long scrolling)
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

  // Count summaries
  const nationalCount = useMemo(() => HEALTH_SCHEMES.filter(s => s.scope === "national").length, [])
  const stateCount = useMemo(() => HEALTH_SCHEMES.filter(s => s.scope === "state").length, [])

  const resetAllFilters = () => {
    setScopeMode("all")
    setSelectedStateCode("all")
    setSelectedCategory("all")
    setSearchQuery("")
  }

  const hasActiveFilters = scopeMode !== "all" || selectedStateCode !== "all" || selectedCategory !== "all" || searchQuery.trim().length > 0

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

        {/* Controls Card: Scope Tabs + State Selector + Pop-Out Search Bar + Category Differentiators */}
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
                  {en ? `All Schemes (${HEALTH_SCHEMES.length})` : `सभी योजनाएं (${HEALTH_SCHEMES.length})`}
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

              {/* State Filter Dropdown (Active when looking at State or All schemes) */}
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

              {/* Scrollable Category Filter Pills */}
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

        {/* Results Header Count */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-gray-600">
            {en
              ? `Showing ${filteredSchemes.length === 0 ? 0 : (currentPage - 1) * SCHEMES_PER_PAGE + 1}–${Math.min(currentPage * SCHEMES_PER_PAGE, filteredSchemes.length)} of ${filteredSchemes.length} Schemes (Page ${currentPage} of ${totalPages})`
              : `${filteredSchemes.length} में से ${filteredSchemes.length === 0 ? 0 : (currentPage - 1) * SCHEMES_PER_PAGE + 1}–${Math.min(currentPage * SCHEMES_PER_PAGE, filteredSchemes.length)} योजनाएं (पृष्ठ ${currentPage}/${totalPages})`}
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
                <Card
                  key={scheme.id}
                  className={`overflow-hidden border-2 ${scheme.themeColor.border} bg-white shadow-xs hover:shadow-md transition-shadow rounded-2xl`}
                >
                  <CardContent className="p-0">
                    <div className="p-5 sm:p-6 md:flex md:gap-6">
                      {/* Left: Icon Box */}
                      <div className="shrink-0 mb-4 md:mb-0">
                        <div className={`h-14 w-14 rounded-2xl ${scheme.themeColor.iconBg} ${scheme.themeColor.iconColor} shadow-2xs flex items-center justify-center border border-white/60`}>
                          {getCategoryIcon(scheme.categories[0] || "poverty_upliftment", "h-7 w-7")}
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 space-y-3.5">
                        {/* Badges Row + Title */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {/* Scope / State Badge */}
                            {scheme.scope === "national" ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1">
                                <span>🇮🇳</span>
                                <span>{en ? "Central / National" : "केंद्र सरकार"}</span>
                              </Badge>
                            ) : (
                              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] font-bold gap-1">
                                <Building2 className="h-3 w-3" />
                                <span>{en ? scheme.stateNameEn : scheme.stateNameHi}</span>
                              </Badge>
                            )}

                            {/* Tag Badge */}
                            {scheme.badgeTagEn && (
                              <Badge variant="outline" className="text-gray-700 bg-gray-50 text-[10px] font-semibold">
                                {en ? scheme.badgeTagEn : scheme.badgeTagHi}
                              </Badge>
                            )}

                            {/* Coverage Amount Badge */}
                            <Badge className="bg-blue-600 text-white text-[10px] font-bold ml-auto sm:ml-0">
                              {scheme.coverageAmount}
                            </Badge>
                          </div>

                          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                            {en ? scheme.titleEn : scheme.titleHi}
                          </h2>

                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {en ? scheme.departmentEn : scheme.departmentHi}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                          {en ? scheme.descriptionEn : scheme.descriptionHi}
                        </p>

                        {/* Key Benefits Checklist */}
                        <div className="pt-1">
                          <h4 className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{en ? "Key Benefits & Coverage:" : "मुख्य लाभ एवं कवरेज:"}</span>
                          </h4>
                          <ul className="grid sm:grid-cols-2 gap-2 mb-3">
                            {(en ? scheme.benefitsEn : scheme.benefitsHi).map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-snug">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Eligibility & How to Apply Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                          <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                            <span className="font-bold text-blue-900 flex items-center gap-1">
                              <Info className="h-3 w-3 text-blue-600" />
                              <span>{en ? "Eligibility Criteria:" : "पात्रता मानदंड:"}</span>
                            </span>
                            <p className="text-gray-600 text-[11px] leading-relaxed">
                              {en ? scheme.eligibilityEn : scheme.eligibilityHi}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                            <span className="font-bold text-purple-900 flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-purple-600" />
                              <span>{en ? "How to Apply / Channel:" : "आवेदन का माध्यम:"}</span>
                            </span>
                            <p className="text-gray-600 text-[11px] leading-relaxed">
                              {en ? scheme.applicationModeEn : scheme.applicationModeHi}
                            </p>
                          </div>
                        </div>

                        {/* Footer Actions: Call & Website */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-2xs"
                              onClick={() => window.open(`tel:${scheme.contactPhone.split(" ")[0].split("/")[0].trim()}`)}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>{scheme.contactPhone}</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-3 font-semibold rounded-lg flex items-center gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 bg-white"
                              onClick={() => window.open(`https://${scheme.contactWeb}`, "_blank")}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              <span>{scheme.contactWeb}</span>
                              <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
                            </Button>
                          </div>

                          <span className="text-[11px] font-semibold text-gray-400">
                            {en ? "Official Govt Scheme" : "आधिकारिक सरकारी योजना"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls Bar (5 Schemes Per Page) */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                <p className="text-xs font-semibold text-gray-600 order-2 sm:order-1">
                  {en
                    ? `Page ${currentPage} of ${totalPages} (${filteredSchemes.length} schemes total)`
                    : `पृष्ठ ${currentPage} का ${totalPages} (कुल ${filteredSchemes.length} योजनाएं)`}
                </p>

                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1))
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg border-gray-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{en ? "Previous" : "पिछला"}</span>
                  </Button>

                  {/* Dynamic Page Number Pills */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const isCurrent = page === currentPage
                    // Keep visible first page, last page, and pages around current page
                    if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                      if (Math.abs(page - currentPage) === 3) {
                        return <span key={page} className="text-xs text-gray-400 px-1">…</span>
                      }
                      return null
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                        className={`h-8 min-w-8 px-2.5 rounded-lg text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg border-gray-200 disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">{en ? "Next" : "अगला"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Search State */
          <Card className="border-dashed border-gray-300 py-12 text-center bg-white rounded-2xl">
            <CardContent className="space-y-3 max-w-md mx-auto">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">
                {en ? "No Matching Health Schemes Found" : "कोई संबंधित स्वास्थ्य योजना नहीं मिली"}
              </h3>
              <p className="text-xs text-gray-500">
                {searchQuery
                  ? (en ? `No government schemes match the query "${searchQuery}". Try searching for broader terms like "hospital", "delivery", "dialysis" or "grant".` : `"${searchQuery}" से संबंधित कोई योजना नहीं मिली। "अस्पताल", "प्रसव", "कैंसर" जैसे शब्दों से खोजें।`)
                  : (en ? "No schemes available for the selected filters. Try choosing 'All Schemes' or another state." : "चयनित फ़िल्टर के लिए कोई योजना नहीं मिली। 'सभी योजनाएं' चुनें।")}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={resetAllFilters}
                className="text-xs font-semibold rounded-xl mt-2"
              >
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
