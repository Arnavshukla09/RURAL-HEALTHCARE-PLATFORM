"use client"

/**
 * components/directory/parts/SearchableDropdown.tsx
 *
 * Searchable dropdown component for State and District geographic hierarchy.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, ChevronDown, Check } from "lucide-react"
import type { SearchableDropdownProps } from "../types"

export function SearchableDropdown({
  label,
  placeholder,
  searchPlaceholder,
  selectedCode,
  options,
  onSelect,
  disabled = false,
  disabledMessage,
  language,
  allOptionLabel,
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
  const displayName =
    selectedCode === "all" || !selectedItem
      ? placeholder
      : language === "hi" && selectedItem.nameHi
        ? selectedItem.nameHi
        : selectedItem.nameEn

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
    <div className={`relative w-full ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-700 block mb-1">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        title={disabled && disabledMessage ? disabledMessage : undefined}
        className={`w-full text-xs font-medium border rounded-xl px-3 py-2.5 bg-white text-gray-800 flex items-center justify-between transition-colors shadow-2xs ${
          disabled
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : isOpen
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-200 hover:border-blue-400"
        }`}
      >
        <span className={`truncate pr-1 text-left ${selectedCode !== "all" ? "font-semibold text-gray-900" : "text-gray-500"}`}>
          {displayName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[220px] z-50 bg-white rounded-xl shadow-xl border border-blue-200 p-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          <div className="max-h-[190px] overflow-y-auto divide-y divide-gray-50 space-y-0.5">
            {allOptionLabel && (
              <button
                type="button"
                onClick={() => {
                  onSelect("all")
                  setIsOpen(false)
                }}
                className={`w-full text-left py-1.5 px-2.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                  selectedCode === "all"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-gray-600 hover:bg-gray-50 font-medium"
                }`}
              >
                <span>{allOptionLabel}</span>
                {selectedCode === "all" && (
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1.5" />
                )}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-gray-400">
                {language === "hi" ? "कोई परिणाम नहीं मिला" : "No matches found"}
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
                    className={`w-full text-left py-1.5 px-2.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">
                      {language === "hi" && item.nameHi ? item.nameHi : item.nameEn}
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
