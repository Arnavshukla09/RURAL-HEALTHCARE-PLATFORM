"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Search, Loader2, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AssignedPatient, DoctorPatientsProps } from "./types"
import { PatientCard } from "./parts/PatientCard"

export function DoctorPatients({ language }: DoctorPatientsProps) {
  const router = useRouter()
  const en = language === "en"
  const [patients, setPatients] = useState<AssignedPatient[]>([])
  const [records, setRecords] = useState<Record<string, any[]>>({})
  const [loadingRecords, setLoadingRecords] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timeout = setTimeout(() => {
      if (active) setLoading(false)
    }, 4000)

    const loadAllAssignedPatients = async () => {
      try {
        const supabase = createClient()
        const patientMap = new Map<string, AssignedPatient>()

        const registerPatient = (p: any, apptInfo?: any) => {
          if (!p || (!p.id && !p.user_id)) return
          const key = p.id || p.user_id
          if (!patientMap.has(key)) {
            patientMap.set(key, {
              id: p.id || key,
              user_id: p.user_id || "",
              first_name: p.first_name || (en ? "Patient" : "मरीज़"),
              last_name: p.last_name || "",
              email: p.email || "",
              phone: p.phone || "",
              created_at: p.created_at || new Date().toISOString(),
              role: p.role || "patient",
              appointment_count: apptInfo ? 1 : 0,
              latest_date: apptInfo?.appointment_date || null,
              latest_status: apptInfo?.status || null,
              latest_notes: apptInfo?.notes || null,
            })
          } else if (apptInfo) {
            const existing = patientMap.get(key)!
            existing.appointment_count += 1
            if (
              apptInfo.appointment_date &&
              (!existing.latest_date ||
                new Date(apptInfo.appointment_date) > new Date(existing.latest_date))
            ) {
              existing.latest_date = apptInfo.appointment_date
              existing.latest_status = apptInfo.status
              existing.latest_notes = apptInfo.notes
            }
          }
        }

        // 1. Fetch appointments via API (guaranteed doctor-scoped)
        try {
          const res = await fetch("/api/appointments?limit=100")
          if (res.ok) {
            const json = await res.json()
            const appts: any[] = Array.isArray(json)
              ? json
              : json.appointments ?? json.data ?? []
            for (const a of appts) {
              const p = Array.isArray(a.patients) ? a.patients[0] : a.patients
              if (p) registerPatient(p, a)
            }
          }
        } catch (e) {
          console.warn("[DoctorPatients] API appointments notice:", e)
        }

        // 2. Fetch direct assigned appointments from Supabase client
        try {
          const { data: dbAppts } = await supabase
            .from("appointments")
            .select(
              "id, patient_id, appointment_date, status, notes, patients (id, user_id, first_name, last_name, email, phone, created_at, role)"
            )
            .order("appointment_date", { ascending: false })

          for (const a of dbAppts || []) {
            const p = Array.isArray(a.patients) ? a.patients[0] : a.patients
            if (p) registerPatient(p, a)
          }
        } catch (e) {
          console.warn("[DoctorPatients] DB appointments notice:", e)
        }

        // 3. Merge direct patients under RLS
        try {
          const { data: directPatients } = await supabase
            .from("patients")
            .select("id, user_id, first_name, last_name, email, phone, created_at, role")
            .limit(50)

          for (const p of directPatients || []) {
            registerPatient(p)
          }
        } catch (e) {
          console.warn("[DoctorPatients] Direct patients notice:", e)
        }

        if (active) {
          const sorted = Array.from(patientMap.values()).sort((a, b) => {
            const timeA = a.latest_date ? new Date(a.latest_date).getTime() : 0
            const timeB = b.latest_date ? new Date(b.latest_date).getTime() : 0
            return timeB - timeA
          })
          setPatients(sorted)
        }
      } catch (err) {
        console.error("[DoctorPatients] Load exception:", err)
      } finally {
        if (active) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    loadAllAssignedPatients()

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [en])

  const loadRecords = async (patientId: string) => {
    if (records[patientId] !== undefined) {
      setExpanded(expanded === patientId ? null : patientId)
      return
    }

    setLoadingRecords((prev) => ({ ...prev, [patientId]: true }))
    try {
      const supabase = createClient()
      const recMap = new Map<string, any>()

      // 1. Fetch via scoped API route
      try {
        const res = await fetch(`/api/medical-records?patient_id=${encodeURIComponent(patientId)}`)
        if (res.ok) {
          const json = await res.json()
          const arr: any[] = Array.isArray(json) ? json : json.records ?? json.data ?? []
          arr.forEach((r) => recMap.set(r.id, r))
        }
      } catch {}

      // 2. Direct client query fallback under RLS
      try {
        const { data: directRecs } = await supabase
          .from("medical_records")
          .select("id, patient_id, record_type, content, file_url, created_at")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(20)

        directRecs?.forEach((r) => recMap.set(r.id, r))
      } catch {}

      setRecords((prev) => ({ ...prev, [patientId]: Array.from(recMap.values()) }))
    } catch (err) {
      console.error("[DoctorPatients] Records fetch exception:", err)
      setRecords((prev) => ({ ...prev, [patientId]: [] }))
    } finally {
      setLoadingRecords((prev) => ({ ...prev, [patientId]: false }))
      setExpanded(patientId)
    }
  }

  const filtered = patients.filter((p) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      [p.first_name, p.last_name, p.email, p.phone, p.latest_notes]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">
            {en ? "My Patients & Clinical Records" : "मेरे मरीज़ एवं चिकित्सा रिकॉर्ड"}
          </h1>
          <p className="text-sm text-gray-500">
            {en
              ? "Patients who have scheduled or completed consultations with you. Document attachment is optional."
              : "आपके साथ निर्धारित या पूर्ण परामर्श वाले मरीज़। दस्तावेज़ संलग्न होना अनिवार्य नहीं है।"}
          </p>
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
                <p className="text-xs text-gray-500">{en ? "Assigned Patients" : "पंजीकृत मरीज़"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.reduce((sum, p) => sum + p.appointment_count, 0)}
                </p>
                <p className="text-xs text-gray-500">{en ? "Total Consultations" : "कुल परामर्श"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={en ? "Search patients by name, email, phone..." : "नाम, ईमेल, फ़ोन से खोजें..."}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-400"
          />
        </div>

        {/* Patient list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{en ? "No patients found" : "कोई मरीज़ नहीं मिला"}</p>
                <p className="text-xs mt-1">
                  {en
                    ? "Patients who book consultations with you appear here immediately, with or without uploaded files."
                    : "आपके साथ परामर्श बुक करने वाले मरीज़ यहाँ तुरंत दिखाई देते हैं, चाहे फ़ाइलें अपलोड हों या नहीं।"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                en={en}
                isExpanded={expanded === patient.id}
                patientRecords={records[patient.id] || []}
                isLoadingRec={Boolean(loadingRecords[patient.id])}
                onToggleRecords={() => loadRecords(patient.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
