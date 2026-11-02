"use client"

/**
 * components/directory/parts/DirectoryResults.tsx
 *
 * List view and empty states for Directory search results.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, RotateCcw } from "lucide-react"
import type { RealDoctor } from "@/lib/data/real-doctors"
import { DoctorCard } from "./DoctorCard"
import { DirectoryPagination } from "./DirectoryPagination"

interface DirectoryResultsProps {
  language: string
  t: any
  userCoords: { lat: number; lng: number } | null
  selectedRadius: number
  processedDoctors: RealDoctor[]
  paginatedDoctors: RealDoctor[]
  totalPages: number
  currentPage: number
  setCurrentPage: (page: number) => void
  locationLabel: string | null
  searchQuery: string
  resetAllFilters: () => void
}

export function DirectoryResults({
  language,
  t,
  userCoords,
  selectedRadius,
  processedDoctors,
  paginatedDoctors,
  totalPages,
  currentPage,
  setCurrentPage,
  locationLabel,
  searchQuery,
  resetAllFilters,
}: DirectoryResultsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            <span>
              {language === "hi" ? "सत्यापित चिकित्सक एवं नोडल संपर्क" : "Clinicians & Verified Contacts"} ({processedDoctors.length})
            </span>
          </div>
          {userCoords ? (
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-bold">
              📍 Within {selectedRadius} km (GPS Active)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-semibold">
              📚 Full Directory ({processedDoctors.length} available)
            </Badge>
          )}
          {totalPages > 1 && (
            <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200 text-[10px] font-semibold">
              Page {currentPage} of {totalPages}
            </Badge>
          )}
        </div>

        {locationLabel && (
          <div className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${userCoords ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
            <span className="font-medium text-gray-700">Near: {locationLabel}</span>
          </div>
        )}
      </div>

      {paginatedDoctors.length > 0 ? (
        <div className="space-y-4">
          {paginatedDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              language={language}
              userCoords={userCoords}
              t={t}
            />
          ))}

          <DirectoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedDoctors.length}
            language={language}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-6 space-y-3">
          <Stethoscope className="h-12 w-12 text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">
            {language === "hi" ? "कोई डॉक्टर नहीं मिला" : "No Verified Doctors Found"}
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? language === "hi"
                ? `'${searchQuery}' के लिए कोई डॉक्टर नहीं मिला। कृपया वर्तनी जांचें या 'सभी विशेषताएं' चुनें।`
                : `No doctors found matching '${searchQuery}'. Try checking spelling or choosing 'All Specialties'.`
              : userCoords
                ? `No verified practitioners found within ${selectedRadius} km of your GPS location. Try expanding the radius to 50 km or 100 km.`
                : "No verified practitioners match the selected state/district filters. Try expanding your search."}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button onClick={resetAllFilters} variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
              <RotateCcw className="h-3 w-3" />
              <span>{t.resetFilters}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
