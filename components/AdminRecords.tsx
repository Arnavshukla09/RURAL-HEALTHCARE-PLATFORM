"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { FileText, Search, ChevronDown, ChevronUp, Loader2, User, Mail, Phone, Calendar, Trash2, Edit2, Check, X } from "lucide-react"
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
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [editType, setEditType] = useState<string>("")
  const [editContent, setEditContent] = useState<string>("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loadingRecords, setLoadingRecords] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("patients")
        .select("id, user_id, first_name, last_name, email, phone, role, created_at")
        .order("created_at", { ascending: false })
      setPatients(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const loadRecords = async (patientId: string, userId: string) => {
    if (expanded === patientId) { setExpanded(null); return }
    if (records[patientId]) { setExpanded(patientId); return }
    setLoadingRecords(patientId)
    const supabase = createClient()
    let { data } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(20)
    if (!data) data = []
    setRecords(prev => ({ ...prev, [patientId]: data ?? [] }))
    setExpanded(patientId)
    setLoadingRecords(null)
  }

  const handleDelete = async (patientId: string, recordId: string) => {
    if (!confirm(en ? "Delete this medical record?" : "क्या आप इस रिकॉर्ड को हटाना चाहते हैं?")) return
    setActionLoading(recordId)
    try {
      const res = await fetch(`/api/medical-records?id=${recordId}`, { method: "DELETE" })
      if (res.ok) {
        setRecords(prev => ({
          ...prev,
          [patientId]: prev[patientId].filter(r => r.id !== recordId)
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveEdit = async (patientId: string, recordId: string) => {
    setActionLoading(recordId)
    try {
      const res = await fetch(`/api/medical-records`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId, record_type: editType, content: editContent })
      })
      if (res.ok) {
        const [updated] = await res.json()
        setRecords(prev => ({
          ...prev,
          [patientId]: prev[patientId].map(r => r.id === recordId ? { ...r, record_type: editType, content: editContent } : r)
        }))
        setEditingRecord(null)
      }
    } catch (e) {
      console.error(e)
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
          <h1 className="text-2xl font-bold text-purple-900">{en ? "Medical Records" : "मेडिकल रिकॉर्ड"}</h1>
          <p className="text-sm text-gray-500">{patients.length} {en ? "users" : "उपयोगकर्ता"} · {totalRecords} {en ? "records loaded" : "रिकॉर्ड लोड"}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={en ? "Search by name, email, role..." : "नाम, ईमेल, भूमिका से खोजें..."}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400" />
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
                    <button onClick={() => loadRecords(patient.id, patient.user_id)}
                      className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors flex-shrink-0">
                      {isLoadingThis
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <FileText className="h-4 w-4" />}
                      {en ? "Records" : "रिकॉर्ड"}
                      {!isLoadingThis && (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {en ? "Medical Records" : "मेडिकल रिकॉर्ड"} ({patientRecords.length})
                      </p>
                      {patientRecords.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center">
                          {en ? "No medical records for this user" : "इस उपयोगकर्ता का कोई रिकॉर्ड नहीं"}
                        </p>
                      ) : patientRecords.map(rec => {
                        const isEditing = editingRecord === rec.id
                        return (
                        <div key={rec.id} className="bg-gray-50 rounded-xl p-3 space-y-1 relative group">
                          <div className="flex items-center justify-between">
                            {isEditing ? (
                              <select 
                                value={editType} 
                                onChange={e => setEditType(e.target.value)}
                                className="text-xs border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                              >
                                {["diagnosis", "prescription", "lab_result", "vaccination", "other"].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            ) : (
                              <Badge className={`text-xs border-0 ${TYPE_COLORS[rec.record_type] || TYPE_COLORS.other}`}>
                                {rec.record_type?.replace("_", " ") || "other"}
                              </Badge>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(rec.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                              </span>
                              {/* Action buttons (Edit/Delete) */}
                              {!isEditing ? (
                                <div className="hidden group-hover:flex items-center gap-1 ml-2">
                                  <button onClick={() => { setEditingRecord(rec.id); setEditType(rec.record_type); setEditContent(rec.content || rec.notes || ""); }} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-purple-600 transition-colors">
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(patient.id, rec.id)} disabled={actionLoading === rec.id} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600 transition-colors">
                                    {actionLoading === rec.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 ml-2">
                                  <button onClick={() => handleSaveEdit(patient.id, rec.id)} disabled={actionLoading === rec.id} className="p-1 hover:bg-purple-100 rounded text-purple-600 transition-colors">
                                    {actionLoading === rec.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                  </button>
                                  <button onClick={() => setEditingRecord(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              className="w-full text-sm border-gray-300 rounded p-2 focus:ring-purple-500 focus:border-purple-500 min-h-[80px]"
                            />
                          ) : (
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{rec.content || rec.notes || "—"}</p>
                          )}

                          {rec.file_url && !isEditing && (
                            <a href={rec.file_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                              <FileText className="h-3 w-3" />{en ? "View file" : "फ़ाइल देखें"}
                            </a>
                          )}
                        </div>
                      )})}
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
