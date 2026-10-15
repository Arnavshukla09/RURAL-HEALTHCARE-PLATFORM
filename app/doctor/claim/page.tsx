"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
  Building2,
  CreditCard,
  Phone,
  ArrowRight,
  FileCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react"
import { REAL_DOCTORS, RealDoctor } from "@/lib/data/real-doctors"
import { createClient } from "@/lib/supabase/client"

export default function DoctorClaimPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<RealDoctor | null>(null)
  const [mobileNumber, setMobileNumber] = useState("")
  const [nmcRegInput, setNmcRegInput] = useState("")
  const [customUpi, setCustomUpi] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [claimedSuccess, setClaimedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Filter matching doctors from 913 directory
  const matchedDoctors = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase().trim()
    return REAL_DOCTORS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.regNo.toLowerCase().includes(q) ||
        d.hospitalAffiliation.toLowerCase().includes(q) ||
        d.districtName.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [query])

  const handleSelectDoctor = (doc: RealDoctor) => {
    setSelectedDoctor(doc)
    setNmcRegInput(doc.regNo)
    setMobileNumber(doc.phone.replace(/[^\d]/g, "").slice(-10))
    setCustomUpi(`${doc.name.toLowerCase().replace(/[^a-z]/g, "")}@upi`)
    setErrorMsg("")
  }

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor) return

    if (!mobileNumber || mobileNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number")
      return
    }

    setSubmitting(true)
    setErrorMsg("")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Record in local claimed doctor session
      const claimedProfile = {
        id: selectedDoctor.id,
        name: selectedDoctor.name,
        regNo: nmcRegInput || selectedDoctor.regNo,
        specialty: selectedDoctor.specialty,
        specialtyName: selectedDoctor.specialtyName,
        hospitalAffiliation: selectedDoctor.hospitalAffiliation,
        phone: mobileNumber,
        upiId: customUpi,
        claimedAt: new Date().toISOString(),
        verified: true,
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("rural_health_claimed_doctor", JSON.stringify(claimedProfile))
      }

      // If user is authenticated in Supabase, link their role
      if (user) {
        await supabase
          .from("profiles")
          .update({ role: "doctor" })
          .eq("id", user.id)
      }

      setClaimedSuccess(true)
      setTimeout(() => {
        router.push("/doctor/dashboard")
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to link doctor profile. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-purple-50/30 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <Card className="max-w-2xl w-full border-2 border-purple-200/80 shadow-2xl rounded-3xl bg-white overflow-hidden">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-teal-800 p-6 sm:p-8 text-white text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Stethoscope className="h-9 w-9 text-purple-200" />
          </div>
          <Badge className="bg-white/20 text-white text-xs font-bold border-0 mb-2">
            NMC / State Medical Council Clinician Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black">
            Claim Your Verified Doctor Profile
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 max-w-lg mx-auto mt-1 leading-relaxed">
            Are you one of the 913 registered specialists listed in our directory? Claim your profile to manage teleconsultations, set your direct UPI payment ID, and update OPD slots.
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {claimedSuccess ? (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h2 className="text-xl font-black text-emerald-900">
                Doctor Profile Successfully Linked!
              </h2>
              <p className="text-xs text-emerald-700">
                Welcome Dr. {selectedDoctor?.name}. Redirecting to your dedicated Doctor Dashboard...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mt-2" />
            </div>
          ) : (
            <>
              {/* Step 1: Search Doctor by Name or NMC Number */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-purple-600" />
                  <span>Step 1: Search for your Name or NMC / SMC Registration Number:</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Dr. Ajay Goenka, Dr. Sharma, or NMC/MPMC-14285..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      if (selectedDoctor && e.target.value !== selectedDoctor.name) {
                        setSelectedDoctor(null)
                      }
                    }}
                    className="h-11 pl-10 text-xs sm:text-sm rounded-xl border-slate-300"
                  />
                  <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>

                {/* Search Results Dropdown */}
                {matchedDoctors.length > 0 && !selectedDoctor && (
                  <div className="border border-purple-200 rounded-2xl p-2 bg-purple-50/50 space-y-1.5 max-h-60 overflow-y-auto">
                    <p className="text-[11px] font-bold text-purple-800 px-2 py-1">
                      Found {matchedDoctors.length} matching clinician profiles (tap yours):
                    </p>
                    {matchedDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDoctor(doc)}
                        className="p-2.5 rounded-xl bg-white hover:bg-purple-100 border border-slate-200 hover:border-purple-300 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{doc.name}</p>
                          <p className="text-[11px] text-purple-700 font-medium">
                            {doc.specialtyName} • {doc.hospitalAffiliation}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Reg: {doc.regNo} • {doc.districtName}, {doc.stateName}
                          </p>
                        </div>
                        <Button size="sm" className="h-7 text-xs bg-purple-600 text-white rounded-lg">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Confirm & Link Account */}
              {selectedDoctor && (
                <form onSubmit={handleClaimSubmit} className="space-y-4 p-4 rounded-2xl bg-purple-50/60 border border-purple-200 animate-in fade-in">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-purple-200">
                    <Avatar className="h-12 w-12 border border-purple-200">
                      <AvatarFallback className="bg-purple-600 text-white font-bold text-sm">
                        {selectedDoctor.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</h3>
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          <ShieldCheck className="h-3 w-3 mr-0.5 inline" /> NMC Verified
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-800">{selectedDoctor.qualifications}</p>
                      <p className="text-[11px] text-slate-600">{selectedDoctor.hospitalAffiliation}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        NMC / Medical Council Reg No:
                      </label>
                      <Input
                        value={nmcRegInput}
                        onChange={(e) => setNmcRegInput(e.target.value)}
                        className="h-9 text-xs bg-white rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Doctor Mobile Phone (for OTP/Alerts):
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
                      <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                        <span>Direct UPI ID for Patient Fees (e.g. GPay / PhonePe / Paytm VPA):</span>
                      </label>
                      <Input
                        placeholder="e.g. dr.name@okhdfcbank or 9826012345@upi"
                        value={customUpi}
                        onChange={(e) => setCustomUpi(e.target.value)}
                        className="h-9 text-xs bg-white rounded-xl"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Patient consultation fees will be directly credited to this UPI address with 0% platform deduction.
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
                    <span>Claim & Link Profile to Doctor Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
