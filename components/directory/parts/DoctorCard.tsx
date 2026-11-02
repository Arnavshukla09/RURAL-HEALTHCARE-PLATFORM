"use client"

/**
 * components/directory/parts/DoctorCard.tsx
 *
 * Clinician and Nodal Healthcare Provider card item.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Phone,
  Star,
  Clock,
  Calendar,
  CheckCircle2,
  Building2,
} from "lucide-react"
import type { RealDoctor } from "@/lib/data/real-doctors"

interface DoctorCardProps {
  doctor: RealDoctor
  language: string
  userCoords: { lat: number; lng: number } | null
  t: any
}

export function DoctorCard({ doctor, language, userCoords, t }: DoctorCardProps) {
  const router = useRouter()

  const getInitials = (name: string) => {
    return name
      .replace(/^(Dr\.|Dr|Prof\.|Prof)\s+/i, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card className="hover:shadow-md transition-shadow border-gray-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-5 items-start justify-between">
          {/* Left: Avatar + Details */}
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-16 w-16 border-2 border-blue-100 shrink-0">
              <AvatarFallback className="bg-blue-600 text-white font-bold text-base">
                {getInitials(doctor.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 flex-1 min-w-0">
              {/* Name + Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>

                {/* Truthful Verification Badge */}
                {doctor.recordType === "facility_nodal_contact" ? (
                  <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-semibold gap-1">
                    <Building2 className="h-3 w-3 text-blue-600" />
                    <span>{language === "hi" ? "पीएम-जय सुविधा संपर्क" : "PM-JAY Facility Contact"}</span>
                  </Badge>
                ) : doctor.verificationStatus === "independently_verified" && doctor.regNo ? (
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>
                      {t.verified} • {doctor.regNo}
                    </span>
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>{t.verified}</span>
                  </Badge>
                )}

                {/* Distance Badge */}
                {userCoords && doctor.distance !== undefined && (
                  <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-bold">
                    📍 {doctor.distance} {t.kmAway}
                  </Badge>
                )}

                {!userCoords && (
                  <Badge variant="outline" className="text-gray-700 bg-gray-50 border-gray-200 text-[10px] font-medium">
                    📍 {doctor.districtName}, {doctor.stateName}
                  </Badge>
                )}

                {doctor.available && (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {t.available}
                  </Badge>
                )}
              </div>

              {/* Qualifications & Specialty */}
              <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 flex-wrap">
                <span>{doctor.specialtyName}</span>
                {doctor.qualifications && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-600 font-normal">{doctor.qualifications}</span>
                  </>
                )}
              </div>

              {/* Hospital Affiliation */}
              <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{doctor.hospitalAffiliation}</span>
              </div>

              {/* Location Address */}
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="truncate">{doctor.location}</span>
              </div>

              {/* OPD Timings */}
              {doctor.opdTimings ? (
                <div className="text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-amber-200/60 font-medium">
                  <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>
                    {t.opdTimings}: {doctor.opdTimings}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-gray-200/80 font-medium">
                  <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                  <span>{language === "hi" ? "समय: पुष्टि के लिए कॉल करें" : "Timings: Call to confirm"}</span>
                </div>
              )}

              {/* Rating, Reviews & Experience */}
              <div className="flex items-center gap-2.5 text-xs text-gray-600 pt-1 flex-wrap">
                {doctor.rating !== undefined && doctor.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-gray-800">{doctor.rating}</span>
                    {doctor.reviewCount && (
                      <span className="text-[11px] text-gray-400">({doctor.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
                {doctor.patientRecommendationPercent && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200/60">
                      👍 {doctor.patientRecommendationPercent}% Recommended
                    </span>
                  </>
                )}
                {doctor.experience !== undefined && doctor.experience > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      {doctor.experience} {t.yearsExp}
                    </span>
                  </>
                )}
                {doctor.phone ? (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="font-mono">{doctor.phone}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-[11px] italic">
                        {language === "hi" ? "फोन असूचीबद्ध (ओपीडी)" : "Phone unlisted (OPD)"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Consultation Fees & Call to Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            <div className="text-left lg:text-right">
              {doctor.consultationFee !== undefined && doctor.consultationFee !== null ? (
                <>
                  <p className="text-xl font-black text-emerald-700">
                    {doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : t.free}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {doctor.consultationFee > 0 ? "OPD Consultation" : "Govt Free OPD"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-700">
                    {language === "hi" ? "शुल्क: सूचीबद्ध नहीं" : "Fee: Not listed"}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {language === "hi" ? "अस्पताल संपर्क" : "Hospital contact"}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              {doctor.phone ? (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                  onClick={() => window.open(`tel:${doctor.phone}`)}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{t.callNow}</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="text-gray-400 font-medium text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 cursor-not-allowed bg-gray-50 border-gray-200"
                >
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span>{language === "hi" ? "असूचीबद्ध" : "Unlisted"}</span>
                </Button>
              )}

              {doctor.recordType === "clinician" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs h-8 px-3 font-semibold rounded-lg flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  onClick={() => router.push("/consultation")}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{t.bookAppointment}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
