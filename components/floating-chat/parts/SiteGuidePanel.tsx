"use client"

/**
 * components/floating-chat/parts/SiteGuidePanel.tsx
 *
 * Slide-in quick navigation panel for Platform destinations.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — AI Navigation Subsystem
 */

import { X } from "lucide-react"
import { SITE_GUIDE_PAGES } from "../types"

interface SiteGuidePanelProps {
  en: boolean
  onClose: () => void
  onNavigate: (page: string, label: string) => void
}

export function SiteGuidePanel({ en, onClose, onNavigate }: SiteGuidePanelProps) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 p-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700">
          {en ? "📍 Navigate to..." : "📍 नेविगेट करें..."}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {SITE_GUIDE_PAGES.map((p) => (
          <button
            key={p.page}
            onClick={() => onNavigate(p.page, en ? p.label : p.labelHi)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-center"
          >
            <span className="text-lg">{p.icon}</span>
            <span className="text-[10px] font-medium text-gray-700 leading-tight">
              {en ? p.label : p.labelHi}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
