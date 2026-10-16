"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import {
  Users, Search, Trash2, Shield, UserCheck, UserX, Loader2,
  ChevronDown, Mail, Phone, Calendar, AlertTriangle, CheckCircle,
  Stethoscope, ShieldCheck, Check, Copy, Share2, ExternalLink, KeyRound, Clock
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { REAL_DOCTORS, RealDoctor } from "@/lib/data/real-doctors"
import { 
  getStoredDoctorClaims, 
  updateDoctorClaimStatus, 
  generateDoctorClaimToken, 
  DoctorClaim 
} from "@/lib/doctor-claims"

interface AdminUserManagementProps {
  language: string
}

const ROLES = ["patient", "doctor", "admin"]
const roleColors: Record<string, string> = {
  patient: "bg-blue-100 text-blue-700",
  doctor: "bg-teal-100 text-teal-700",
  admin: "bg-purple-100 text-purple-700",
}

export function AdminUserManagement({ language }: AdminUserManagementProps) {
  const router = useRouter()
  const en = language === "en"
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"users" | "claims">("users")
  
  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState("")

  // Doctor Claims & Invites state
  const [claims, setClaims] = useState<DoctorClaim[]>([])
  const [inviteSearch, setInviteSearch] = useState("")
  const [selectedInviteDoctor, setSelectedInviteDoctor] = useState<RealDoctor | null>(null)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [isDemoAdmin, setIsDemoAdmin] = useState(false)

  useEffect(() => { 
    const checkDemo = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email?.toLowerCase().includes("demo") || user?.email === "admin@ruralhealth.demo") {
        setIsDemoAdmin(true)
      }
    }
    checkDemo()
    fetchUsers() 
    refreshClaims()
  }, [])

  const refreshClaims = () => {
    setClaims(getStoredDoctorClaims())
  }

  const fetchUsers = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("patients")
      .select("id, user_id, first_name, last_name, email, phone, role, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
    setUsers(data ?? [])
    setLoading(false)
  }

  const updateRole = async (userId: string, newRole: string) => {
    if (isDemoAdmin) {
      flash(en ? "Preview Mode: Demo admin privileges cannot modify live roles." : "पूर्वावलोकन मोड: डेमो व्यवस्थापक भूमिकाएं नहीं बदल सकता।")
      return
    }
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase.from("patients").update({ role: newRole }).eq("id", userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      flash(en ? `Role updated to ${newRole}` : `भूमिका ${newRole} में बदली`)
    }
    setUpdating(null)
  }

  const removeUser = async (userId: string) => {
    if (isDemoAdmin) {
      flash(en ? "Preview Mode: Demo admin privileges cannot delete users." : "पूर्वावलोकन मोड: डेमो व्यवस्थापक उपयोगकर्ता नहीं हटा सकता।")
      setDeleteConfirm(null)
      return
    }
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase.from("patients").delete().eq("id", userId)
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      flash(en ? "User removed successfully" : "उपयोगकर्ता हटाया गया")
    }
    setDeleteConfirm(null)
    setUpdating(null)
  }

  const handleApproveClaim = (claimId: string) => {
    const updated = updateDoctorClaimStatus(claimId, "approved", "Approved by Medical Administration Officer")
    if (updated) {
      refreshClaims()
      flash(en ? `Doctor claim approved for ${updated.doctorName}` : `${updated.doctorName} का क्लेम स्वीकृत किया गया`)
    }
  }

  const handleRejectClaim = (claimId: string) => {
    const updated = updateDoctorClaimStatus(claimId, "rejected", "Rejected: Verification documents mismatch")
    if (updated) {
      refreshClaims()
      flash(en ? `Claim rejected for ${updated.doctorName}` : `${updated.doctorName} का क्लेम अस्वीकृत किया गया`)
    }
  }

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3500)
  }

  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === "all" ? true : u.role === roleFilter
    const matchSearch = search
      ? [u.first_name, u.last_name, u.email, u.phone].join(" ").toLowerCase().includes(search.toLowerCase())
      : true
    return matchRole && matchSearch
  })

  // Matching doctors from 913 registry for direct admin invites
  const matchedInviteDoctors = useMemo(() => {
    if (!inviteSearch.trim() || inviteSearch.length < 2) return []
    const q = inviteSearch.toLowerCase().trim()
    return REAL_DOCTORS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.hospitalAffiliation.toLowerCase().includes(q) ||
        (d.regNo ? d.regNo.toLowerCase().includes(q) : false) ||
        d.districtName.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [inviteSearch])

  const pendingClaimsCount = claims.filter(c => c.status === "pending_admin_approval").length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">{en ? "Administration Console" : "प्रशासन कंसोल"}</h1>
            <p className="text-sm text-gray-500">
              {en ? "Manage system users, doctor verification claims, and role credentials" : "उपयोगकर्ता, डॉक्टर क्लेम सत्यापन और क्रेडेंशियल प्रबंधित करें"}
            </p>
          </div>
          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-200 shadow-2xs">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "users" ? "bg-purple-600 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{en ? "Users" : "उपयोगकर्ता"}</span>
              <span className="text-[10px] opacity-80">({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("claims")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "claims" ? "bg-purple-600 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>{en ? "Doctor Claims & Invites" : "डॉक्टर क्लेम एवं आमंत्रण"}</span>
              {pendingClaimsCount > 0 && (
                <span className="bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-black animate-pulse">
                  {pendingClaimsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Demo Admin Preview Banner */}
        {isDemoAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">{en ? "Preview Mode (Demo Admin):" : "पूर्वावलोकन मोड (डेमो व्यवस्थापक):"}</span>{" "}
              {en
                ? "You are exploring the administration console in preview mode. Destructive actions (deleting users, role changes, database wiping) are disabled to protect live platform data."
                : "आप पूर्वावलोकन मोड में प्रशासन कंसोल देख रहे हैं। लाइव डेटा की सुरक्षा के लिए उपयोगकर्ताओं को हटाना या बदलना अक्षम है।"}
            </div>
          </div>
        )}

        {/* Success message alert */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />{successMsg}
          </div>
        )}

        {/* ── TAB 1: USERS MANAGEMENT ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder={en ? "Search by name, email..." : "नाम, ईमेल से खोजें..."}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400" 
                />
              </div>
              <div className="flex rounded-xl bg-white border border-gray-200 p-1 gap-1">
                {["all", ...ROLES].map(r => (
                  <button 
                    key={r} 
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      roleFilter === r ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {r === "all" ? (en ? "All" : "सभी") : r}
                  </button>
                ))}
              </div>
            </div>

            {/* User table */}
            <Card>
              <CardContent className="p-0 overflow-hidden">
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{en ? "No users found" : "कोई उपयोगकर्ता नहीं"}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {/* Table header */}
                    <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <span>{en ? "User" : "उपयोगकर्ता"}</span>
                      <span>{en ? "Contact" : "संपर्क"}</span>
                      <span>{en ? "Joined" : "शामिल हुए"}</span>
                      <span>{en ? "Role" : "भूमिका"}</span>
                      <span>{en ? "Actions" : "कार्य"}</span>
                    </div>

                    {filteredUsers.map(user => (
                      <div key={user.id} className={`px-4 py-3.5 hover:bg-gray-50 transition-colors ${deleteConfirm === user.id ? "bg-red-50" : ""}`}>
                        {deleteConfirm === user.id ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700 flex-1">
                              {en ? `Remove ${user.first_name} ${user.last_name}? This cannot be undone.` : `${user.first_name} ${user.last_name} को हटाएं? यह पूर्ववत नहीं होगा।`}
                            </p>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
                              disabled={updating === user.id}
                              onClick={() => removeUser(user.id)}>
                              {updating === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (en ? "Confirm Remove" : "हटाएं")}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeleteConfirm(null)}>
                              {en ? "Cancel" : "रद्द"}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr] items-center gap-3 md:gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(user.first_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.phone ? (
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </div>
                            <div>
                              <div className="relative">
                                <select
                                  value={user.role || "patient"}
                                  disabled={updating === user.id}
                                  onChange={e => updateRole(user.id, e.target.value)}
                                  className={`appearance-none w-full text-xs px-2 py-1 pr-6 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-300 ${roleColors[user.role] || roleColors.patient}`}>
                                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                {updating === user.id
                                  ? <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin" />
                                  : <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />}
                              </div>
                            </div>
                            <div>
                              <Button size="sm" variant="outline"
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setDeleteConfirm(user.id)}>
                                <Trash2 className="h-3 w-3 mr-1" />{en ? "Remove" : "हटाएं"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── TAB 2: DOCTOR CLAIMS & INVITATIONS (ADMIN GATE) ── */}
        {activeTab === "claims" && (
          <div className="space-y-6">
            {/* Section A: Pending / Reviewed Doctor Profile Claims */}
            <Card className="border-purple-200 shadow-sm">
              <CardHeader className="bg-purple-50/50 pb-3 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-700" />
                    <CardTitle className="text-base font-bold text-purple-950">
                      {en ? "Clinician Verification Claims Queue" : "डॉक्टर प्रोफ़ाइल क्लेम सत्यापन कतार"}
                    </CardTitle>
                  </div>
                  <Badge className="bg-purple-600 text-white text-xs">
                    {claims.length} {en ? "Total Claims" : "कुल क्लेम"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {claims.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-30 text-purple-600" />
                    <p className="text-xs font-semibold text-gray-500">
                      {en ? "No doctor verification claims submitted yet." : "अभी तक कोई क्लेम अनुरोध प्राप्त नहीं हुआ है।"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {en 
                        ? "Claims appear when registered clinicians respond to private invitation links." 
                        : "जब डॉक्टर निजी आमंत्रण लिंक द्वारा आवेदन करेंगे, तब क्लेम यहाँ दिखाई देंगे।"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims.map((claim) => {
                      const isPending = claim.status === "pending_admin_approval"
                      const isApproved = claim.status === "approved"
                      const isRejected = claim.status === "rejected"

                      return (
                        <div
                          key={claim.id}
                          className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-purple-300 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm text-gray-900">{claim.doctorName}</h3>
                                {isPending && (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                                    <Clock className="h-3 w-3 mr-0.5 inline" /> Pending Admin Review
                                  </Badge>
                                )}
                                {isApproved && (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                                    <Check className="h-3 w-3 mr-0.5 inline" /> Approved & Active
                                  </Badge>
                                )}
                                {isRejected && (
                                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold">
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-purple-700 font-medium">
                                {claim.specialtyName} • {claim.hospitalAffiliation}
                              </p>
                            </div>

                            <span className="text-[10px] text-gray-400">
                              Submitted: {new Date(claim.submittedAt).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                            <div>
                              <span className="text-gray-400 block text-[10px]">NMC / SMC Reg No:</span>
                              <span className="font-bold text-gray-800">{claim.regNo}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px]">Clinician Phone:</span>
                              <span className="font-bold text-gray-800">{claim.mobileNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px]">Direct UPI Fee VPA:</span>
                              <span className="font-bold text-gray-800">{claim.upiId || "—"}</span>
                            </div>
                          </div>

                          {/* Admin Action Buttons */}
                          {isPending && (
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectClaim(claim.id)}
                                className="text-xs h-8 text-rose-700 border-rose-200 hover:bg-rose-50"
                              >
                                Reject Claim
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApproveClaim(claim.id)}
                                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-2xs"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve Claim & Grant Doctor Role</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section B: Admin Direct Doctor Invitation Dispatcher (913 NMC Registry) */}
            <Card className="border-indigo-200 shadow-sm">
              <CardHeader className="bg-indigo-50/50 pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-700" />
                  <div>
                    <CardTitle className="text-base font-bold text-indigo-950">
                      {en ? "Dispatch Private Clinician Invitation (913 Directory)" : "निजी डॉक्टर आमंत्रण लिंक जनरेटर (913 निर्देशिका)"}
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                      {en 
                        ? "Select any verified practitioner to create a private tokenized onboarding link" 
                        : "किसी भी सत्यापित डॉक्टर को सुरक्षित टोकन युक्त आमंत्रण लिंक भेजें"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">
                    {en ? "Search Doctor by Name, Hospital, or NMC Number:" : "नाम, अस्पताल या एनएमसी नंबर से खोजें:"}
                  </label>
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    <Input
                      placeholder={en ? "e.g. Dr. Ajay Goenka, AIIMS Bhopal, GMC, BMHRC..." : "जैसे डॉ. अजय गोयनका, एम्स भोपाल..."}
                      value={inviteSearch}
                      onChange={(e) => {
                        setInviteSearch(e.target.value)
                        setSelectedInviteDoctor(null)
                      }}
                      className="pl-9 h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Search Matches */}
                {matchedInviteDoctors.length > 0 && !selectedInviteDoctor && (
                  <div className="p-2 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1.5">
                    <p className="text-[11px] font-bold text-indigo-900 px-1">
                      {en ? "Select clinician to generate invitation:" : "आमंत्रण हेतु डॉक्टर चुनें:"}
                    </p>
                    {matchedInviteDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedInviteDoctor(doc)}
                        className="p-2.5 rounded-lg bg-white hover:bg-indigo-100/60 border border-indigo-100 cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{doc.name}</p>
                          <p className="text-[11px] text-indigo-800">{doc.specialtyName} • {doc.hospitalAffiliation}</p>
                          <p className="text-[10px] text-gray-500">Reg: {doc.regNo} • {doc.districtName}, {doc.stateName}</p>
                        </div>
                        <Button size="sm" className="h-7 text-xs bg-indigo-600 text-white rounded-lg">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Generated Tokenized Invitation Box */}
                {selectedInviteDoctor && (() => {
                  const origin = typeof window !== "undefined" ? window.location.origin : ""
                  const token = generateDoctorClaimToken(selectedInviteDoctor.id)
                  const inviteUrl = `${origin}/doctor/claim?id=${selectedInviteDoctor.id}&token=${token}`
                  const cleanPhone = selectedInviteDoctor.phone.replace(/[^\d+]/g, "")
                  const inviteMsg = `🏥 *OFFICIAL RURAL HEALTHCARE INVITATION*\n\nRespected ${selectedInviteDoctor.name},\n\nYou are invited by the Medical Director to claim your verified doctor profile on the Rural Healthcare Platform:\n\n🔐 *Your Private Claim & Onboarding Link:*\n${inviteUrl}\n\nNMC Registration: ${selectedInviteDoctor.regNo}\nRural Healthcare Network`

                  return (
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-indigo-950">{selectedInviteDoctor.name}</h4>
                          <p className="text-xs text-indigo-800">{selectedInviteDoctor.hospitalAffiliation}</p>
                          <p className="text-[11px] text-gray-600">Reg: {selectedInviteDoctor.regNo} • Contact: {selectedInviteDoctor.phone}</p>
                        </div>
                        <Badge className="bg-indigo-600 text-white text-[10px]">
                          Token Active
                        </Badge>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-indigo-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-gray-700 truncate select-all">{inviteUrl}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(inviteUrl)
                              setCopiedInvite(true)
                              setTimeout(() => setCopiedInvite(false), 2500)
                            }
                          }}
                          className="h-7 px-2.5 text-xs text-indigo-700 hover:bg-indigo-50 gap-1 shrink-0 font-bold"
                        >
                          {copiedInvite ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedInvite ? "Copied!" : "Copy Link"}</span>
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteMsg)}`, "_blank")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg gap-1.5 shadow-2xs"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Dispatch via WhatsApp</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(inviteMsg)}`}
                          className="border-indigo-300 text-indigo-800 hover:bg-indigo-100 text-xs h-8 rounded-lg gap-1.5 bg-white"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Dispatch via SMS</span>
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}
