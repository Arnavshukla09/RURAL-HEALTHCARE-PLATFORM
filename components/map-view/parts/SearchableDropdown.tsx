"use client"

/**
 * components/map-view/parts/SearchableDropdown.tsx
 *
 * Searchable dropdown for State & District selection.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, ChevronDown, Check } from "lucide-react"

interface SearchableDropdownProps {
  label: string
  placeholder: string
  searchPlaceholder: string
  selectedCode: string
  options: { code: string; nameEn: string; nameHi?: string }[]
  onSelect: (code: string) => void
  en: boolean
}

export function SearchableDropdown({
  label,
  placeholder,
  searchPlaceholder,
  selectedCode,
  options,
  onSelect,
  en,
}: SearchableDropdownProps) {
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

  const selectedItem = options.find((o) => o.code === selectedCode)
  const displayName = selectedItem
    ? en
      ? selectedItem.nameEn
      : selectedItem.nameHi || selectedItem.nameEn
    : placeholder

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return options
    const q = searchTerm.toLowerCase().trim()
    return options.filter(
      (o) =>
        o.nameEn.toLowerCase().includes(q) ||
        (o.nameHi && o.nameHi.toLowerCase().includes(q))
    )
  }, [options, searchTerm])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-[11px] font-semibold text-blue-900 block mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-xs font-medium border border-blue-200 rounded-lg p-2 bg-white text-gray-800 flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
      >
        <span className="truncate pr-1 text-left">{displayName}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[210px] z-[1050] bg-white rounded-lg shadow-xl border border-blue-200 p-1.5">
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          <div className="max-h-[175px] overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="py-2.5 px-2 text-center text-xs text-gray-400">
                {en ? "No matches found" : "कोई परिणाम नहीं मिला"}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.code === selectedCode
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onSelect(item.code)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left py-2 px-2.5 text-xs rounded flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">
                      {en ? item.nameEn : item.nameHi || item.nameEn}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
