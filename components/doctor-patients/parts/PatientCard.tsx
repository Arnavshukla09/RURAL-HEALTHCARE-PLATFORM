"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react"
import { AssignedPatient, RECORD_TYPE_COLORS } from "../types"

interface PatientCardProps {
  patient: AssignedPatient
  en: boolean
  isExpanded: boolean
  patientRecords: any[]
  isLoadingRec: boolean
  onToggleRecords: () => void
}

export function PatientCard({
  patient,
  en,
  isExpanded,
  patientRecords,
  isLoadingRec,
  onToggleRecords,
}: PatientCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-base shrink-0">
              {(patient.first_name?.[0] || "P").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </p>
                {patient.latest_status && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 border-0 ${
                      patient.latest_status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {patient.latest_status === "completed" ? (
                      <CheckCircle className="h-3 w-3 mr-1 inline" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1 inline" />
                    )}
                    {patient.latest_status === "completed"
                      ? en
                        ? "Completed"
                        : "पूर्ण"
                      : en
                      ? "Scheduled"
                      : "निर्धारित"}
                  </Badge>
                )}
                <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                  {patient.appointment_count}{" "}
                  {en
                    ? patient.appointment_count === 1
                      ? "consultation"
                      : "consultations"
                    : "परामर्श"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    {patient.email}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {patient.phone}
                  </span>
                )}
                {patient.latest_date && (
                  <span className="flex items-center gap-1 text-teal-700 font-medium">
                    <Calendar className="h-3 w-3 text-teal-600" />
                    {new Date(patient.latest_date).toLocaleDateString(
                      en ? "en-IN" : "hi-IN",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleRecords}
            disabled={isLoadingRec}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors shrink-0 disabled:opacity-50"
          >
            {isLoadingRec ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span>{en ? "Records" : "रिकॉर्ड"}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded clinical records */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {en ? "Medical Records & Prescriptions" : "मेडिकल रिकॉर्ड एवं नुस्खे"} (
                {patientRecords.length})
              </p>
            </div>

            {patientRecords.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-700">
                  {en
                    ? "No clinical documents uploaded by patient yet."
                    : "मरीज़ द्वारा अभी तक कोई नैदानिक दस्तावेज़ अपलोड नहीं किया गया है।"}
                </p>
                <p className="text-gray-400">
                  {en
                    ? "Consultation notes and teleconsult summaries are safely archived with their appointments."
                    : "परामर्श नोट्स और टेलीकंसल्ट सारांश उनकी अपॉइंटमेंट में सुरक्षित हैं।"}
                </p>
              </div>
            ) : (
              patientRecords.map((rec) => (
                <div key={rec.id} className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`text-xs border-0 ${
                        RECORD_TYPE_COLORS[rec.record_type] || RECORD_TYPE_COLORS.other
                      }`}
                    >
                      {rec.record_type?.replace("_", " ") || "other"}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(rec.created_at).toLocaleDateString(en ? "en-IN" : "hi-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {rec.content || rec.notes || "—"}
                  </p>
                  {rec.file_url && (
                    <a
                      href={rec.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <FileText className="h-3 w-3" />
                      {en ? "View attached document" : "संलग्न फ़ाइल देखें"}
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
