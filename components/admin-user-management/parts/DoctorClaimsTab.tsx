"use client"

/**
 * components/admin-user-management/parts/DoctorClaimsTab.tsx
 *
 * Doctor credential verification queue and tokenized private invite dispatcher.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Administration Subsystem
 */

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ShieldCheck,
  Stethoscope,
  KeyRound,
  Search,
  Check,
  Copy,
  Share2,
  Phone,
  Clock,
} from "lucide-react"
import { REAL_DOCTORS, type RealDoctor } from "@/lib/data/real-doctors"
import { generateDoctorClaimToken, type DoctorClaim } from "@/lib/doctor-claims"

interface DoctorClaimsTabProps {
  en: boolean
  claims: DoctorClaim[]
  onApproveClaim: (claimId: string) => void
  onRejectClaim: (claimId: string) => void
}

export function DoctorClaimsTab({
  en,
  claims,
  onApproveClaim,
  onRejectClaim,
}: DoctorClaimsTabProps) {
  const [inviteSearch, setInviteSearch] = useState("")
  const [selectedInviteDoctor, setSelectedInviteDoctor] = useState<RealDoctor | null>(null)
  const [copiedInvite, setCopiedInvite] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Section A: Doctor Verification Claims Queue */}
      <Card className="border-purple-200 shadow-sm">
        <CardHeader className="bg-purple-50/50 pb-3 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-700" />
              <CardTitle className="text-base font-bold text-purple-950">
                {en
                  ? "Clinician Verification Claims Queue"
                  : "डॉक्टर प्रोफ़ाइल क्लेम सत्यापन कतार"}
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
                {en
                  ? "No doctor verification claims submitted yet."
                  : "अभी तक कोई क्लेम अनुरोध प्राप्त नहीं हुआ है।"}
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

                    {isPending && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRejectClaim(claim.id)}
                          className="text-xs h-8 text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          Reject Claim
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onApproveClaim(claim.id)}
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
                {en
                  ? "Dispatch Private Clinician Invitation (913 Directory)"
                  : "निजी डॉक्टर आमंत्रण लिंक जनरेटर (913 निर्देशिका)"}
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
              {en
                ? "Search Doctor by Name, Hospital, or NMC Number:"
                : "नाम, अस्पताल या एनएमसी नंबर से खोजें:"}
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <Input
                placeholder={
                  en
                    ? "e.g. Dr. Ajay Goenka, AIIMS Bhopal, GMC, BMHRC..."
                    : "जैसे डॉ. अजय गोयनका, एम्स भोपाल..."
                }
                value={inviteSearch}
                onChange={(e) => {
                  setInviteSearch(e.target.value)
                  setSelectedInviteDoctor(null)
                }}
                className="pl-9 h-10 text-xs rounded-xl"
              />
            </div>
          </div>

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
                    <p className="text-[11px] text-indigo-800">
                      {doc.specialtyName} • {doc.hospitalAffiliation}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Reg: {doc.regNo} • {doc.districtName}, {doc.stateName}
                    </p>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-indigo-600 text-white rounded-lg">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}

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
                    <p className="text-[11px] text-gray-600">
                      Reg: {selectedInviteDoctor.regNo} • Contact: {selectedInviteDoctor.phone}
                    </p>
                  </div>
                  <Badge className="bg-indigo-600 text-white text-[10px]">Token Active</Badge>
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
                    {copiedInvite ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedInvite ? "Copied!" : "Copy Link"}</span>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteMsg)}`,
                        "_blank"
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg gap-1.5 shadow-2xs"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Dispatch via WhatsApp</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(inviteMsg)}`)
                    }
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
  )
}
