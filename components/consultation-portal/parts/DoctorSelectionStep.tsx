"use client"

/**
 * components/consultation-portal/parts/DoctorSelectionStep.tsx
 *
 * Doctor search, state filter, specialty chips, doctor cards and pagination.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Consultation Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Building2, Stethoscope, MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { ScrollableFilterRow } from "@/components/ui/scrollable-filter-row"
import type { RealDoctor } from "@/lib/data/real-doctors"
import { SPECIALTY_OPTIONS, getInitials } from "../types"

interface DoctorSelectionStepProps {
  en: boolean
  filteredDoctors: RealDoctor[]
  paginatedDoctors: RealDoctor[]
  selectedDoctor: RealDoctor | null
  setSelectedDoctor: (doc: RealDoctor | null) => void
  setSelectedSlot: (slot: string) => void
  stateFilter: string
  setStateFilter: (state: string) => void
  stateOptions: { code: string; nameEn: string; nameHi?: string }[]
  doctorSearch: string
  setDoctorSearch: (search: string) => void
  specialtyFilter: string
  setSpecialtyFilter: (spec: string) => void
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number | ((p: number) => number)) => void
}

export function DoctorSelectionStep({
  en,
  filteredDoctors,
  paginatedDoctors,
  selectedDoctor,
  setSelectedDoctor,
  setSelectedSlot,
  stateFilter,
  setStateFilter,
  stateOptions,
  doctorSearch,
  setDoctorSearch,
  specialtyFilter,
  setSpecialtyFilter,
  currentPage,
  totalPages,
  setCurrentPage,
}: DoctorSelectionStepProps) {
  return (
    <Card className="border-gray-200 bg-white rounded-2xl shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
            2
          </span>
          <span>{en ? "Step 2 — Select Doctor" : "चरण 2 — डॉक्टर चुनें"}</span>
          <span className="text-gray-400 font-normal">({filteredDoctors.length} available)</span>
        </CardTitle>

        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">{en ? "All States (Pan-India)" : "सभी राज्य (अखिल भारतीय)"}</option>
            {stateOptions.map((s) => (
              <option key={s.code} value={s.code}>
                {en ? s.nameEn : s.nameHi}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={
              en
                ? "Search doctor name, specialty, hospital, city or district..."
                : "डॉक्टर का नाम, विशेषता, अस्पताल या शहर खोजें..."
            }
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            className="pl-10 pr-8 text-xs sm:text-sm bg-gray-50/70 border-gray-200 rounded-xl h-10 focus:bg-white focus:border-blue-500"
          />
          {doctorSearch && (
            <button
              onClick={() => setDoctorSearch("")}
              className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Specialty Filter Chips */}
        <ScrollableFilterRow contentClassName="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SPECIALTY_OPTIONS.map((sp) => {
            const isSelected = specialtyFilter === sp.key
            return (
              <button
                key={sp.key}
                onClick={() => {
                  setSpecialtyFilter(sp.key)
                  setSelectedDoctor(null)
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {en ? sp.labelEn : sp.labelHi}
              </button>
            )
          })}
        </ScrollableFilterRow>

        {/* Doctor Cards (10 per page) */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {paginatedDoctors.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">{en ? "No doctors found matching filters." : "कोई डॉक्टर नहीं मिला।"}</p>
            </div>
          ) : (
            paginatedDoctors.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctor(doc)
                    setSelectedSlot("")
                  }}
                  className={`flex items-start gap-3.5 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-100 shadow-xs"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  <Avatar className="h-11 w-11 border border-blue-100 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                      {getInitials(doc.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">{doc.name}</h4>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold py-0 h-4">
                        ✓ Verified
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-blue-700">{doc.specialtyName}</p>

                    <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate mt-0.5">
                      <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {doc.hospitalAffiliation}, {doc.districtName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{doc.rating}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {doc.experience} {en ? "yrs exp" : "वर्ष अनुभव"}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-700">
                        {doc.consultationFee && doc.consultationFee > 0
                          ? `₹${doc.consultationFee}`
                          : en
                          ? "Free Govt OPD"
                          : "मुफ्त सरकारी"}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center self-center">
                    <button
                      className={`h-7 px-3 rounded-lg text-xs font-bold transition ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-gray-100 hover:bg-blue-50 text-gray-700"
                      }`}
                    >
                      {isSelected ? (en ? "✓ Selected" : "✓ चयनित") : en ? "Select" : "चुनें"}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">
              {en ? `Page ${currentPage} of ${totalPages}` : `पृष्ठ ${currentPage} / ${totalPages}`}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                <span>{en ? "Prev" : "पिछला"}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-xs"
              >
                <span>{en ? "Next" : "अगला"}</span>
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
