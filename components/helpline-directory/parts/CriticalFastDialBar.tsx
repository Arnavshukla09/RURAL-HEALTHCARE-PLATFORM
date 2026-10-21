"use client"

/**
 * components/helpline-directory/parts/CriticalFastDialBar.tsx
 *
 * Pinned critical emergency 1-tap fast-dial cards.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Helpline Subsystem
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, PhoneCall } from "lucide-react"
import { CRITICAL_FAST_DIAL } from "../types"

interface CriticalFastDialBarProps {
  en: boolean
  t: any
}

export function CriticalFastDialBar({ en, t }: CriticalFastDialBarProps) {
  return (
    <Card className="border-red-300 bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white shadow-lg overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs flex items-center justify-center animate-pulse">
              <Zap className="h-5 w-5 text-yellow-300" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{t.criticalEmergencyTitle}</span>
                <Badge className="bg-yellow-400 text-gray-950 font-black text-[10px] px-2 py-0.5">
                  24/7 FREE
                </Badge>
              </h2>
              <p className="text-xs text-white/90 font-medium">{t.criticalEmergencySubtitle}</p>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-white/80 hidden md:block">
            1-Tap Instant Call • Zero Latency
          </div>
        </div>

        {/* 8-Card Priority Fast-Dial Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 pt-3">
          {CRITICAL_FAST_DIAL.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="group bg-white rounded-xl p-3 text-gray-900 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between border border-white/40 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`p-1.5 rounded-lg text-white ${item.pillBg}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-gray-950 tracking-wider">
                        {item.number}
                      </span>
                    </div>
                    <PhoneCall className="h-3.5 w-3.5 text-red-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <h3 className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-red-700 transition-colors">
                    {en ? item.serviceEn : item.serviceHi}
                  </h3>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                    {item.category}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {t.tollFree}
                  </span>
                  <span className="text-xs font-bold text-red-600 group-hover:underline flex items-center gap-1">
                    <span>{t.callNow}</span>
                    <span>→</span>
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
