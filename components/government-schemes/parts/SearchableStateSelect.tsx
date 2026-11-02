"use client"

/**
 * components/government-schemes/parts/SearchableStateSelect.tsx
 *
 * Searchable dropdown for filtering schemes by State & UT.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Schemes Subsystem
 */

import { useState, useRef, useEffect, useMemo } from "react"
import { Building2, ChevronDown, Search, Check } from "lucide-react"

interface SearchableStateSelectProps {
  selectedStateCode: string
  onSelect: (code: string) => void
  language: string
  stateOptions: { code: string; nameEn: string; nameHi: string; count: number }[]
}

export function SearchableStateSelect({
  selectedStateCode,
  onSelect,
  language,
  stateOptions,
}: SearchableStateSelectProps) {
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

  const selectedItem = stateOptions.find((o) => o.code === selectedStateCode)
  const displayName =
    selectedStateCode === "all"
      ? language === "hi"
        ? "सभी राज्य एवं केंद्र शासित प्रदेश"
        : "All States & UTs"
      : selectedItem
      ? language === "hi"
        ? selectedItem.nameHi
        : selectedItem.nameEn
      : language === "hi"
      ? "राज्य चुनें"
      : "Select State"

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return stateOptions
    const q = searchTerm.toLowerCase().trim()
    return stateOptions.filter(
      (o) => o.nameEn.toLowerCase().includes(q) || o.nameHi.toLowerCase().includes(q)
    )
  }, [stateOptions, searchTerm])

  return (
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
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
                  <span className="truncate">{language === "hi" ? item.nameHi : item.nameEn}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    <span className="text-[10px] text-gray-400 font-normal">({item.count})</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
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
