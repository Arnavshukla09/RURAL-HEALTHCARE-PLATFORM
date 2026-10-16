"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { 
  FileText, Search, ChevronDown, ChevronUp, Loader2, 
  Mail, Phone, Calendar, Trash2, ShieldAlert, Paperclip, AlertTriangle, ShieldCheck
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminRecordsProps { language: string }

const TYPE_COLORS: Record<string, string> = {
  prescription: "bg-purple-100 text-purple-700",
  lab_result:   "bg-blue-100 text-blue-700",
  diagnosis:    "bg-orange-100 text-orange-700",
  vaccination:  "bg-green-100 text-green-700",
  other:        "bg-gray-100 text-gray-600",
}

export function AdminRecords({ language }: AdminRecordsProps) {
  const en = language === "en"
  const [patients, setPatients] = useState<any[]>([])
  const [records, setRecords] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDemoAdmin, setIsDemoAdmin] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loadingRecords, setLoadingRecords] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email?.toLowerCase().includes("demo") || user?.email === "admin@ruralhealth.demo") {
        setIsDemoAdmin(true)
      }

      const { data } = await supabase
        .from("patients")
        .select("id, user_id, first_name, last_name, email, phone, role, created_at")
        .order("created_at", { ascending: false })
      setPatients(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const loadRecords = async (patientId: string) => {
    if (expanded === patientId) { setExpanded(null); return }
    if (records[patientId]) { setExpanded(patientId); return }
    setLoadingRecords(patientId)

    try {
      // Calls server API which redacts clinical text and withholds raw file URLs for admins
      const res = await fetch(`/api/medical-records?patient_id=${patientId}`)
      let data: any[] = []
      if (res.ok) {
        const json = await res.json()
        data = json.data || json.records || []
      }
      setRecords(prev => ({ ...prev, [patientId]: data }))
      setExpanded(patientId)
    } catch (e) {
      console.error("Failed to load records for administration:", e)
    } finally {
      setLoadingRecords(null)
    }
  }

  const handleDelete = async (patientId: string, recordId: string) => {
    if (isDemoAdmin) {
      alert(en 
        ? "Preview Mode: Demo admin privileges are restricted. Deleting records is disabled to prevent data loss." 
        : "पूर्वावलोकन मोड: डेमो व्यवस्थापक रिकॉर्ड हटा नहीं सकता।")
      return
    }

    if (!confirm(en 
      ? "Permanently purge this record entry? (This action removes the record entry and attached file storage reference for data hygiene or right-to-erasure compliance)." 
      : "क्या आप इस रिकॉर्ड प्रविष्टि को हटाना चाहते हैं?")) {
      return
    }

    setActionLoading(recordId)
    try {
      const res = await fetch(`/api/medical-records?id=${recordId}`, { method: "DELETE" })
      if (res.ok) {
        setRecords(prev => ({
          ...prev,
          [patientId]: prev[patientId].filter(r => r.id !== recordId)
        }))
      } else {
        const err = await res.json()
        alert(err.error || (en ? "Failed to delete record" : "रिकॉर्ड हटाने में विफल"))
      }
    } catch (e) {
      console.error("Delete failed:", e)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = patients.filter(p => {
    if (!search) return true
    return [p.first_name, p.last_name, p.email, p.phone, p.role].join(" ").toLowerCase().includes(search.toLowerCase())
  })

  const totalRecords = Object.values(records).flat().length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">{en ? "Medical Records Administration" : "मेडिकल रिकॉर्ड प्रशासन"}</h1>
          <p className="text-sm text-gray-500">
            {patients.length} {en ? "registered users" : "पंजीकृत उपयोगकर्ता"} · {totalRecords} {en ? "records loaded" : "रिकॉर्ड लोड"}
          </p>
        </div>

        {/* Demo Admin Preview Banner */}
        {isDemoAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">{en ? "Preview Mode (Demo Admin):" : "पूर्वावलोकन मोड (डेमो व्यवस्थापक):"}</span>{" "}
              {en
                ? "Destructive operations are disabled to prevent accidental data loss. In accordance with clinical confidentiality standards, medical file contents and private clinical notes are strictly withheld from administrative views."
                : "डेटा सुरक्षा के लिए हटाने की कार्रवाई अक्षम है। डॉक्टर-मरीज गोपनीयता के तहत मेडिकल फ़ाइल सामग्री व्यवस्थापकों से छिपी रहती है।"}
            </div>
          </div>
        )}

        {/* Confidentiality Posture Card */}
        <div className="bg-white border border-purple-100 rounded-xl p-3.5 flex items-center gap-3 text-xs text-purple-900 shadow-2xs">
          <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold">{en ? "Doctor-Patient Confidentiality Architecture:" : "डॉक्टर-मरीज गोपनीयता संरचना:"}</span>{" "}
            {en
              ? "Administrators maintain administrative rights to purge files and entries (for storage quotas and right-to-erasure compliance), but have zero read access to confidential clinical diagnoses, consultation notes, or patient medical files."
              : "व्यवस्थापक के पास फ़ाइलों को हटाने का अधिकार है (भंडारण और विलोपन अनुपालन के लिए), लेकिन निजी मेडिकल डायग्नोसिस या फ़ाइलों को देखने की कोई अनुमति नहीं है।"}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={en ? "Search by name, email, role..." : "नाम, ईमेल, भूमिका से खोजें..."}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400 shadow-2xs" />
        </div>

        <div className="space-y-3">
          {filtered.map(patient => {
            const isExpanded = expanded === patient.id
            const patientRecords = records[patient.id] ?? []
            const isLoadingThis = loadingRecords === patient.id
            return (
              <Card key={patient.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(patient.first_name?.[0] || patient.email?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {patient.first_name} {patient.last_name}
                          </span>
                          <Badge className={`text-xs border-0 capitalize ${
                            patient.role === "doctor" ? "bg-teal-100 text-teal-700" :
                            patient.role === "admin"  ? "bg-purple-100 text-purple-700" :
                                                        "bg-blue-100 text-blue-700"
                          }`}>{patient.role || "patient"}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {patient.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{patient.email}</span>}
                          {patient.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="h-3 w-3" />{patient.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => loadRecords(patient.id)}
                      className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors flex-shrink-0">
                      {isLoadingThis
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <FileText className="h-4 w-4" />}
                      {en ? "Inspect Metadata" : "मेटाडेटा देखें"}
                      {!isLoadingThis && (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {en ? "Patient Record Entries" : "मरीज रिकॉर्ड प्रविष्टियाँ"} ({patientRecords.length})
                      </p>
                      {patientRecords.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center">
                          {en ? "No medical records recorded for this user" : "इस उपयोगकर्ता का कोई रिकॉर्ड नहीं"}
                        </p>
                      ) : patientRecords.map(rec => (
                        <div key={rec.id} className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs border-0 ${TYPE_COLORS[rec.record_type] || TYPE_COLORS.other}`}>
                                {rec.record_type?.replace("_", " ") || "other"}
                              </Badge>
                              {rec.has_file && (
                                <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                  <Paperclip className="h-3 w-3 text-slate-500" />
                                  {en ? "File Attached" : "फ़ाइल संलग्न"}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                                <Calendar className="h-3 w-3" />
                                {new Date(rec.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                              </span>

                              {/* Administration Action: Remove File / Record without exposing clinical contents */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(patient.id, rec.id)}
                                disabled={isDemoAdmin || actionLoading === rec.id}
                                className={`h-7 px-2.5 text-xs font-medium border-rose-200 text-rose-700 hover:bg-rose-50 ${isDemoAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                                title={isDemoAdmin ? (en ? "Disabled in demo preview mode" : "डेमो मोड में अक्षम") : (en ? "Purge file / delete entry" : "फ़ाइल हटाएं")}
                              >
                                {actionLoading === rec.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    <span>{en ? "Remove Record" : "रिकॉर्ड हटाएं"}</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Zero-knowledge clinical content protection banner */}
                          <div className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-purple-600 shrink-0" />
                            <p className="text-xs text-slate-600 italic">
                              {en 
                                ? "Protected Health Information (PHI) — Clinical diagnosis, notes, and file downloads are restricted to the patient and their treating clinician."
                                : "गोपनीय स्वास्थ्य सूचना (PHI) — मेडिकल डायग्नोसिस और फ़ाइल डाउनलोड केवल मरीज और डॉक्टर के लिए सुरक्षित हैं।"}
                            </p>
                          </div>
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
