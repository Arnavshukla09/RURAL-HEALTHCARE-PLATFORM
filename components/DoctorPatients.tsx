"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Users, FileText, Search, ChevronDown, ChevronUp, Loader2, Calendar, Phone, Mail, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DoctorPatientsProps {
  language: string
}

export function DoctorPatients({ language }: DoctorPatientsProps) {
  const router = useRouter();
  const en = language === "en"
  const [patients, setPatients] = useState<any[]>([])
  const [records, setRecords] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      // Load all patients: role = 'patient' OR role is not set yet
      const { data: allPatients } = await supabase
        .from("patients")
        .select("id, user_id, first_name, last_name, email, phone, created_at, role")
        .or("role.eq.patient,role.is.null")
        .order("created_at", { ascending: false })
      setPatients(allPatients ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const loadRecords = async (patientId: string, userId?: string) => {
    if (records[patientId] !== undefined) {
      setExpanded(expanded === patientId ? null : patientId)
      return
    }
    const supabase = createClient()
    // Try patient_id first (matches patients.id)
    const { data: byPatientId } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(20)

    let combined = byPatientId ?? []

    setRecords(prev => ({ ...prev, [patientId]: combined }))
    setExpanded(patientId)
  }

  const filtered = patients.filter(p => {
    if (!search) return true
    return [p.first_name, p.last_name, p.email, p.phone].join(" ").toLowerCase().includes(search.toLowerCase())
  })

  const recordTypeColor: Record<string, string> = {
    prescription: "bg-purple-100 text-purple-700",
    lab_result: "bg-blue-100 text-blue-700",
    diagnosis: "bg-orange-100 text-orange-700",
    vaccination: "bg-green-100 text-green-700",
    other: "bg-gray-100 text-gray-600",
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-teal-900">{en ? "Patient Records" : "मरीज़ रिकॉर्ड"}</h1>
          <p className="text-sm text-gray-500">{en ? "View medical records of patients who have booked appointments" : "अपॉइंटमेंट बुक करने वाले मरीज़ों के रिकॉर्ड"}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-xs text-gray-500">{en ? "Total Patients" : "कुल मरीज़"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.values(records).flat().length}</p>
                <p className="text-xs text-gray-500">{en ? "Records Loaded" : "लोड किए रिकॉर्ड"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={en ? "Search patients by name, email, phone..." : "नाम, ईमेल, फ़ोन से खोजें..."}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-400" />
        </div>

        {/* Patient list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{en ? "No patients found" : "कोई मरीज़ नहीं मिला"}</p>
                <p className="text-xs mt-1">{en ? "Patients who book appointments will appear here" : "अपॉइंटमेंट बुक करने वाले मरीज़ यहां दिखेंगे"}</p>
              </CardContent>
            </Card>
          ) : filtered.map(patient => {
            const isExpanded = expanded === patient.id
            const patientRecords = records[patient.id] || []

            return (
              <Card key={patient.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {(patient.first_name?.[0] || "P").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{patient.first_name} {patient.last_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {patient.email && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Mail className="h-3 w-3" />{patient.email}
                            </span>
                          )}
                          {patient.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="h-3 w-3" />{patient.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {en ? "Registered" : "पंजीकृत"}: {new Date(patient.created_at).toLocaleDateString(en ? "en-IN" : "hi-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => loadRecords(patient.id, patient.user_id)}
                      className="flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors flex-shrink-0">
                      <Eye className="h-4 w-4" />
                      {en ? "Records" : "रिकॉर्ड"}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Expanded records */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {en ? "Medical Records" : "मेडिकल रिकॉर्ड"} ({patientRecords.length})
                      </p>
                      {patientRecords.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center">{en ? "No medical records found for this patient" : "इस मरीज़ का कोई रिकॉर्ड नहीं"}</p>
                      ) : patientRecords.map(rec => (
                        <div key={rec.id} className="bg-gray-50 rounded-xl p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge className={`text-xs border-0 ${recordTypeColor[rec.record_type] || recordTypeColor.other}`}>
                              {rec.record_type?.replace("_", " ") || "other"}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(rec.created_at).toLocaleDateString(en ? "en-IN" : "hi-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{rec.content || rec.notes || "—"}</p>
                          {rec.file_url && (
                            <a href={rec.file_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {en ? "View file" : "फ़ाइल देखें"}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </div>
  )
}
