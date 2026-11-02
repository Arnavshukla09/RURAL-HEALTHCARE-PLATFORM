"use client"

/**
 * components/helpline-directory/parts/HelplineCard.tsx
 *
 * Card component for individual emergency / national / state helplines.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Helpline Subsystem
 */

import { Phone, MapPin, Globe, Clock, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CATEGORY_THEMES } from "../types"
import type { HelplineItem, HelplineCategory } from "@/lib/emergency/helplines"

interface HelplineCardProps {
  item: HelplineItem
  en: boolean
  t: any
  copiedId: string | null
  onCopy: (id: string, num: string, e: React.MouseEvent) => void
}

export function HelplineCard({ item, en, t, copiedId, onCopy }: HelplineCardProps) {
  const theme = CATEGORY_THEMES[item.category as HelplineCategory] || CATEGORY_THEMES.all
  const Icon = theme.icon
  const isCopied = copiedId === item.id

  return (
    <div
      onClick={() => {
        window.location.href = `tel:${item.number}`
      }}
      className={`group bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 cursor-pointer ${theme.cardBorder} ${theme.cardBg}`}
    >
      <div>
        {/* Top Badges & 24/7 status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.isNational ? (
              <Badge
                variant="secondary"
                className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 font-bold"
              >
                <Globe className="h-2.5 w-2.5 mr-1" />
                {t.national}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-[10px] bg-amber-50 text-amber-800 border-amber-200 font-bold"
              >
                <MapPin className="h-2.5 w-2.5 mr-1" />
                {en ? item.stateNameEn : item.stateNameHi}
              </Badge>
            )}

            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${theme.badgeBg} ${theme.badgeText}`}
            >
              <Icon className="h-2.5 w-2.5" />
              <span>{en ? theme.en : theme.hi}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            {item.is24x7 && (
              <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                <Clock className="h-2.5 w-2.5" /> 24/7
              </span>
            )}
            {item.isTollFree && (
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[9px] font-semibold">
                {t.tollFree}
              </span>
            )}
          </div>
        </div>

        {/* Visual Category Figure + Title & Description */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${theme.iconBoxBg} ${theme.iconBoxColor}`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
              {en ? item.serviceEn : item.serviceHi}
            </h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {en ? item.descriptionEn : item.descriptionHi}
            </p>
          </div>
        </div>
      </div>

      {/* Dial Action & Number Display */}
      <div className="pt-2.5 border-t border-gray-100/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black text-gray-900 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 tracking-wider shadow-2xs">
            {item.number}
          </span>
          <button
            onClick={(e) => onCopy(item.id, item.number, e)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition"
            title={t.copyNumber}
            aria-label="Copy number"
          >
            {isCopied ? (
              <span className="text-[10px] font-bold text-emerald-600">✓ {t.copied}</span>
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <Button
          size="sm"
          className={`${theme.btnBg} text-white font-bold text-xs px-3.5 h-8 rounded-lg flex items-center gap-1.5 shadow-xs`}
          onClick={(e) => {
            e.stopPropagation()
            window.location.href = `tel:${item.number}`
          }}
        >
          <Phone className="h-3.5 w-3.5" />
          <span>{t.callNow}</span>
        </Button>
      </div>
    </div>
  )
}
