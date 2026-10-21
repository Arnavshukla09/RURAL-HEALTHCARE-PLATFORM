"use client"

/**
 * components/government-schemes/parts/SchemeCard.tsx
 *
 * Detailed card presentation for a government health scheme.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Schemes Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  CheckCircle2,
  Phone,
  Globe,
  ExternalLink,
  Info,
} from "lucide-react"
import type { GovernmentHealthScheme } from "@/lib/schemes/health-schemes"
import { getCategoryIcon } from "../types"

interface SchemeCardProps {
  scheme: GovernmentHealthScheme
  en: boolean
}

export function SchemeCard({ scheme, en }: SchemeCardProps) {
  return (
    <Card
      key={scheme.id}
      className={`overflow-hidden border-2 ${scheme.themeColor.border} bg-white shadow-xs hover:shadow-md transition-shadow rounded-2xl`}
    >
      <CardContent className="p-0">
        <div className="p-5 sm:p-6 md:flex md:gap-6">
          {/* Left: Icon Box */}
          <div className="shrink-0 mb-4 md:mb-0">
            <div
              className={`h-14 w-14 rounded-2xl ${scheme.themeColor.iconBg} ${scheme.themeColor.iconColor} shadow-2xs flex items-center justify-center border border-white/60`}
            >
              {getCategoryIcon(scheme.categories[0] || "poverty_upliftment", "h-7 w-7")}
            </div>
          </div>

          {/* Middle: Details */}
          <div className="flex-1 space-y-3.5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {scheme.scope === "national" ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1">
                    <span>🇮🇳</span>
                    <span>{en ? "Central / National" : "केंद्र सरकार"}</span>
                  </Badge>
                ) : (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] font-bold gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{en ? scheme.stateNameEn : scheme.stateNameHi}</span>
                  </Badge>
                )}

                {scheme.badgeTagEn && (
                  <Badge variant="outline" className="text-gray-700 bg-gray-50 text-[10px] font-semibold">
                    {en ? scheme.badgeTagEn : scheme.badgeTagHi}
                  </Badge>
                )}

                <Badge className="bg-blue-600 text-white text-[10px] font-bold ml-auto sm:ml-0">
                  {scheme.coverageAmount}
                </Badge>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                {en ? scheme.titleEn : scheme.titleHi}
              </h2>

              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {en ? scheme.departmentEn : scheme.departmentHi}
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
              {en ? scheme.descriptionEn : scheme.descriptionHi}
            </p>

            {/* Key Benefits Checklist */}
            <div className="pt-1">
              <h4 className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{en ? "Key Benefits & Coverage:" : "मुख्य लाभ एवं कवरेज:"}</span>
              </h4>
              <ul className="grid sm:grid-cols-2 gap-2 mb-3">
                {(en ? scheme.benefitsEn : scheme.benefitsHi).map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50/80 p-2 rounded-lg border border-gray-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Eligibility & How to Apply Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <Info className="h-3 w-3 text-blue-600" />
                  <span>{en ? "Eligibility Criteria:" : "पात्रता मानदंड:"}</span>
                </span>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  {en ? scheme.eligibilityEn : scheme.eligibilityHi}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                <span className="font-bold text-purple-900 flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-purple-600" />
                  <span>{en ? "How to Apply / Channel:" : "आवेदन का माध्यम:"}</span>
                </span>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  {en ? scheme.applicationModeEn : scheme.applicationModeHi}
                </p>
              </div>
            </div>

            {/* Footer Actions: Call & Website */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-2xs"
                  onClick={() =>
                    window.open(`tel:${scheme.contactPhone.split(" ")[0].split("/")[0].trim()}`)
                  }
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{scheme.contactPhone}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3 font-semibold rounded-lg flex items-center gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 bg-white"
                  onClick={() => window.open(`https://${scheme.contactWeb}`, "_blank")}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{scheme.contactWeb}</span>
                  <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
                </Button>
              </div>

              <span className="text-[11px] font-semibold text-gray-400">
                {en ? "Official Govt Scheme" : "आधिकारिक सरकारी योजना"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
