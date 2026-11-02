"use client"

/**
 * components/map-view/parts/FacilityListPagination.tsx
 *
 * Pagination controls for the Facility & Doctor listings.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FacilityListPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  en: boolean
  onPageChange: (page: number) => void
}

export function FacilityListPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  en,
  onPageChange,
}: FacilityListPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="gap-1 h-8 text-xs font-medium"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>{en ? "Previous" : "पिछला"}</span>
      </Button>

      <div className="text-xs text-gray-500">
        {en
          ? `Showing ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems}`
          : `${totalItems} में से ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, totalItems)} दर्शा रहे`}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="gap-1 h-8 text-xs font-medium"
      >
        <span>{en ? "Next" : "अगला"}</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
