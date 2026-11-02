"use client"

/**
 * components/directory/parts/DirectoryPagination.tsx
 *
 * Pagination bar for Directory doctor listings.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DirectoryPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  language: string
  onPageChange: (page: number) => void
}

export function DirectoryPagination({
  currentPage,
  totalPages,
  totalItems,
  language,
  onPageChange,
}: DirectoryPaginationProps) {
  if (totalPages <= 1) return null

  const handlePageSelect = (page: number) => {
    onPageChange(page)
    window.scrollTo({ top: 300, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs mt-4">
      <p className="text-xs text-gray-600 font-medium">
        {language === "hi"
          ? `कुल ${totalItems} में से ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, totalItems)} डॉक्टर (पृष्ठ ${currentPage} / ${totalPages})`
          : `Showing ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, totalItems)} of ${totalItems} doctors (Page ${currentPage} of ${totalPages})`}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageSelect(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 text-xs gap-1 px-2.5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>{language === "hi" ? "पिछला" : "Previous"}</span>
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p = i + 1
            if (totalPages > 5 && currentPage > 3) {
              p = Math.min(currentPage - 2 + i, totalPages - 4 + i)
            }
            return (
              <button
                key={p}
                onClick={() => handlePageSelect(p)}
                className={`h-8 w-8 text-xs font-semibold rounded-lg transition-colors ${
                  currentPage === p
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageSelect(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 text-xs gap-1 px-2.5"
        >
          <span>{language === "hi" ? "अगला" : "Next"}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
