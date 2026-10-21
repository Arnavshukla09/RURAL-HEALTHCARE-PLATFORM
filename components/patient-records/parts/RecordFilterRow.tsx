"use client"

/**
 * components/patient-records/parts/RecordFilterRow.tsx
 *
 * Filter pill row for clinical records categories with count badges.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { ScrollableFilterRow } from '@/components/ui/scrollable-filter-row'
import {
  RECORD_FILTER_TAGS,
  type RecordFilterTag,
} from '../types'

interface RecordFilterRowProps {
  en: boolean
  selectedTag: RecordFilterTag
  tagCounts: Record<string, number>
  onSelectTag: (tag: RecordFilterTag) => void
}

export function RecordFilterRow({
  en,
  selectedTag,
  tagCounts,
  onSelectTag,
}: RecordFilterRowProps) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <ScrollableFilterRow className="w-full min-w-0 max-w-full overflow-hidden" contentClassName="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full min-w-0 max-w-full">
      {RECORD_FILTER_TAGS.map((tag) => {
        const count = tagCounts[tag.key] || 0
        if (tag.key !== 'all' && count === 0) return null
        const isSelected = selectedTag === tag.key
        return (
          <button
            key={tag.key}
            onClick={() => onSelectTag(tag.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
              isSelected
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
            }`}
          >
            <span>{en ? tag.labelEn : tag.labelHi}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                isSelected
                  ? 'bg-white/25 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
      </ScrollableFilterRow>
    </div>
  )
}
