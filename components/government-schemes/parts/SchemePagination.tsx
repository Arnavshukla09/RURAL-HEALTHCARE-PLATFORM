"use client"

/**
 * components/government-schemes/parts/SchemePagination.tsx
 *
 * Pagination bar with dynamic page pills for Government Schemes directory.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Schemes Subsystem
 */

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SchemePaginationProps {
  en: boolean
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function SchemePagination({
  en,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: SchemePaginationProps) {
  if (totalPages <= 1) return null

  const handleSelectPage = (page: number) => {
    onPageChange(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
      <p className="text-xs font-semibold text-gray-600 order-2 sm:order-1">
        {en
          ? `Page ${currentPage} of ${totalPages} (${totalItems} schemes total)`
          : `पृष्ठ ${currentPage} का ${totalPages} (कुल ${totalItems} योजनाएं)`}
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => handleSelectPage(Math.max(1, currentPage - 1))}
          className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg border-gray-200 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{en ? "Previous" : "पिछला"}</span>
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const isCurrent = page === currentPage
          if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
            if (Math.abs(page - currentPage) === 3) {
              return (
                <span key={page} className="text-xs text-gray-400 px-1">
                  …
                </span>
              )
            }
            return null
          }
          return (
            <button
              key={page}
              onClick={() => handleSelectPage(page)}
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
          onClick={() => handleSelectPage(Math.min(totalPages, currentPage + 1))}
          className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg border-gray-200 disabled:opacity-40"
        >
          <span className="hidden sm:inline">{en ? "Next" : "अगला"}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
