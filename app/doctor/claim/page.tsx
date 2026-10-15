"use client"

import { useState, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Stethoscope,
  Search,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Building2,
  CreditCard,
  Phone,
  ArrowRight,
  FileCheck,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  KeyRound,
  ExternalLink,
} from "lucide-react"
import { REAL_DOCTORS, RealDoctor } from "@/lib/data/real-doctors"
import { createClient } from "@/lib/supabase/client"
import { 
  verifyDoctorClaimToken, 
  saveDoctorClaim, 
  generateDoctorClaimToken,
  getStoredDoctorClaims,
  updateDoctorClaimStatus,
  DoctorClaim 
} from "@/lib/doctor-claims"

function DoctorClaimContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const docIdParam = searchParams.get("id") || ""
  const tokenParam = searchParams.get("token") || ""

  // Manual token input state for clinicians arriving without direct url params
  const [manualToken, setManualToken] = useState("")
  const [tokenInputError, setTokenInputError] = useState("")

  // Form states
  const [mobileNumber, setMobileNumber] = useState("")
  const [emailAddress, setEmailAddress] = useState("")
  const [customUpi, setCustomUpi] = useState("")
  const [councilRegInput, setCouncilRegInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submittedClaim, setSubmittedClaim] = useState<DoctorClaim | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  // Resolve target doctor from query parameter
  const targetDoctor: RealDoctor | null = useMemo(() => {
    if (!docIdParam) return null
    return REAL_DOCTORS.find((d) => d.id === docIdParam) || null
  }, [docIdParam])

  // Verify token
  const isTokenValid = useMemo(() => {
    if (!docIdParam || !tokenParam) return false
    return verifyDoctorClaimToken(docIdParam, tokenParam)
  }, [docIdParam, tokenParam])

  // Check if this doctor already has an existing claim
  const existingClaim = useMemo(() => {
    if (!docIdParam) return null
    const claims = getStoredDoctorClaims()
    return claims.find((c) => c.doctorId === docIdParam) || null
  }, [docIdParam, submittedClaim])

  // Initialize prefilled fields when doctor & token are verified
  useState(() => {
    if (targetDoctor) {
      setCouncilRegInput(targetDoctor.regNo)
      const cleanPhone = targetDoctor.phone.replace(/[^\d]/g, "").slice(-10)
      setMobileNumber(cleanPhone)
      setCustomUpi(`${targetDoctor.name.toLowerCase().replace(/[^a-z]/g, "")}@upi`)
    }
  })

  // Handle manual invite link / token submission
  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTokenInputError("")

    const trimmed = manualToken.trim()
    if (!trimmed) {
      setTokenInputError("Please enter your invitation link or token code.")
      return
    }

    try {
      if (trimmed.includes("http://") || trimmed.includes("https://") || trimmed.includes("/doctor/claim")) {
        const url = new URL(trimmed.startsWith("http") ? trimmed : `https://example.com${trimmed}`)
        const id = url.searchParams.get("id")
        const token = url.searchParams.get("token")
        if (id && token) {
          router.push(`/doctor/claim?id=${id}&token=${token}`)
          return
        }
      }
      setTokenInputError("Invalid invitation link format. Please check the SMS or Email you received.")
    } catch {
      setTokenInputError("Could not parse link. Please paste the complete invitation link.")
    }
  }

  // Handle Claim Submission
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetDoctor) return

    if (!mobileNumber || mobileNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit clinician mobile number.")
      return
    }

    setSubmitting(true)
    setErrorMsg("")

    try {
      const claim = saveDoctorClaim({
        doctorId: targetDoctor.id,
        doctorName: targetDoctor.name,
        regNo: councilRegInput || targetDoctor.regNo,
        specialtyName: targetDoctor.specialtyName,
        hospitalAffiliation: targetDoctor.hospitalAffiliation,
        mobileNumber: mobileNumber,
        email: emailAddress || `${targetDoctor.id}@hospital.gov.in`,
        upiId: customUpi,
        token: tokenParam,
      })

      // Also register into supabase profiles if authenticated
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("profiles")
          .update({ 
            role: "doctor",
            phone: mobileNumber,
            metadata: { nmcReg: councilRegInput || targetDoctor.regNo, claimStatus: "pending_admin_approval" }
          })
          .eq("id", user.id)
      }

      setSubmittedClaim(claim)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit verification claim. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── SCENARIO 1: Access Without Valid Token / ID (Security Barrier) ──
  if (!docIdParam || !tokenParam || !isTokenValid || !targetDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="max-w-xl w-full border-2 border-indigo-700/60 shadow-2xl rounded-3xl bg-slate-950/90 text-white overflow-hidden backdrop-blur-md">
          {/* Locked Security Header */}
          <div className="bg-gradient-to-b from-rose-900/40 to-slate-950 p-6 sm:p-8 text-center border-b border-indigo-800/40">
            <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="h-8 w-8 text-rose-400" />
            </div>
            <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold mb-2">
              Identity Theft Protection Active
            </Badge>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Restricted Clinician Invitation Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              Open public claiming of doctors has been disabled to prevent identity theft and protect NMC credentials. Access is strictly granted via <strong>private tokenized invitation links</strong>.
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Explanation of Security Gating */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2.5 text-xs text-slate-300">
              <h3 className="font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>How Clinicians Receive Private Access:</span>
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-slate-200">Patient Appointment Request:</strong> When a patient books an appointment, an encrypted private link with your secret token is sent directly to your phone/WhatsApp.
                </li>
                <li>
                  <strong className="text-slate-200">Administrator Direct Invitation:</strong> Platform medical officers can dispatch an invitation link from the Administrator Console.
                </li>
                <li>
                  <strong className="text-slate-200">Admin Approval Gate:</strong> All submissions must be reviewed and verified against NMC state registries before dashboard activation.
                </li>
              </ul>
            </div>

            {/* Paste Invitation Link Form */}
            <form onSubmit={handleManualTokenSubmit} className="space-y-3">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                <span>Have a Private Invite Link from SMS or WhatsApp?</span>
              </label>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Paste your private invitation URL here..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="bg-slate-900 border-indigo-700/60 text-white placeholder:text-slate-500 text-xs rounded-xl h-10"
                />
                {tokenInputError && (
                  <p className="text-rose-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{tokenInputError}</span>
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
              >
                Verify & Open Invitation
              </Button>
            </form>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
              >
                ← Return to Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
                className="text-indigo-400 hover:text-indigo-300 text-xs"
              >
                Doctor Login →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── SCENARIO 2: Valid Private Invitation Loaded ──
  const isApproved = existingClaim?.status === "approved"
  const isPending = (existingClaim?.status === "pending_admin_approval" || submittedClaim?.status === "pending_admin_approval") && !isApproved

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-purple-50/30 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <Card className="max-w-2xl w-full border-2 border-purple-200/80 shadow-2xl rounded-3xl bg-white overflow-hidden">
        {/* Clinician Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-teal-800 p-6 sm:p-8 text-white text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Stethoscope className="h-9 w-9 text-purple-200" />
          </div>
          <Badge className="bg-white/20 text-white text-xs font-bold border-0 mb-2">
            Verified Clinician Invitation
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black">
            Claim Profile: {targetDoctor.name}
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 max-w-lg mx-auto mt-1 leading-relaxed">
            {targetDoctor.specialtyName} • {targetDoctor.hospitalAffiliation}
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Status: Approved */}
          {isApproved ? (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h2 className="text-xl font-black text-emerald-900">
                Doctor Profile Verified & Approved!
              </h2>
              <p className="text-xs text-emerald-700">
                Your credentials have been validated by the medical administration. You can access your Doctor Dashboard anytime.
              </p>
              <Button
                onClick={() => router.push("/doctor/dashboard")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md mt-2"
              >
                Go to Doctor Dashboard →
              </Button>
            </div>
          ) : isPending ? (
            /* Status: Pending Admin Approval */
            <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-amber-900">
                Verification Claim Submitted — Awaiting Admin Approval
              </h2>
              <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
                Thank you Dr. {targetDoctor.name}. To safeguard clinician identity and patient safety, your claim is queued for verification by the Medical Administrator against state council records.
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left space-y-1">
                <p><strong>NMC Registration:</strong> {councilRegInput || targetDoctor.regNo}</p>
                <p><strong>Contact Phone:</strong> {mobileNumber || targetDoctor.phone}</p>
                <p><strong>Status:</strong> <span className="font-bold text-amber-700">Pending Review</span></p>
              </div>
              <p className="text-[11px] text-gray-500">
                You will receive an SMS confirmation once approved. For immediate clinical emergencies, please call the state helpline.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="text-xs text-gray-600 rounded-xl"
              >
                Return to Healthcare Home
              </Button>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-purple-300 shrink-0">
                    <AvatarFallback className="bg-purple-700 text-white font-bold text-sm">
                      {targetDoctor.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{targetDoctor.name}</h3>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        <ShieldCheck className="h-3 w-3 mr-0.5 inline" /> NMC Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-purple-800">{targetDoctor.qualifications}</p>
                    <p className="text-[11px] text-slate-600">{targetDoctor.hospitalAffiliation}</p>
                    <p className="text-[10px] text-slate-400">
                      Reg No: {targetDoctor.regNo} • {targetDoctor.districtName}, {targetDoctor.stateName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    NMC / State Medical Council Reg No:
                  </label>
                  <Input
                    value={councilRegInput}
                    onChange={(e) => setCouncilRegInput(e.target.value)}
                    className="h-9 text-xs bg-white rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Doctor Mobile Phone (for OTP & Alerts):
                  </label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="h-9 text-xs bg-white rounded-xl"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Professional / Hospital Email Address:
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. dr.goenka@aiimsbhopal.edu.in"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="h-9 text-xs bg-white rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                    <span>Direct UPI ID for Patient Fees (GPay / PhonePe / Paytm VPA):</span>
                  </label>
                  <Input
                    placeholder="e.g. dr.name@okhdfcbank or 9826012345@upi"
                    value={customUpi}
                    onChange={(e) => setCustomUpi(e.target.value)}
                    className="h-9 text-xs bg-white rounded-xl"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Patient fees will be transferred directly to this clinician UPI account with 0% platform deductions.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm h-11 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>Submit Profile Claim for Admin Verification</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-center">
                🛡️ All clinician claims are reviewed by the rural health administrator to maintain strict identity integrity.
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-slate-200 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Return to Healthcare Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DoctorClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    }>
      <DoctorClaimContent />
    </Suspense>
  )
}
