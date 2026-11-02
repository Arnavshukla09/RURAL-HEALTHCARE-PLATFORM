"use client"

/**
 * components/admin-user-management/index.tsx
 *
 * Modular Administration Console — Users, Clinician Verification Claims & Invite Dispatcher.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Administration Subsystem
 */

import { useState, useEffect } from "react"
import {
  Users,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getStoredDoctorClaims,
  updateDoctorClaimStatus,
  type DoctorClaim,
} from "@/lib/doctor-claims"

import { UsersTab } from "./parts/UsersTab"
import { DoctorClaimsTab } from "./parts/DoctorClaimsTab"
import type { AdminUserManagementProps, UserProfile } from "./types"

export function AdminUserManagement({ language }: AdminUserManagementProps) {
  const en = language === "en"

  // Tab State
  const [activeTab, setActiveTab] = useState<"users" | "claims">("users")

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState("")

  // Doctor Claims & Invites state
  const [claims, setClaims] = useState<DoctorClaim[]>([])
  const [isDemoAdmin, setIsDemoAdmin] = useState(false)

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3500)
  }

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
    setUsers((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    const checkDemo = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email?.toLowerCase().trim() === "admin@ruralhealth.demo") {
        setIsDemoAdmin(true)
      }
    }
    checkDemo()
    fetchUsers()
    refreshClaims()
  }, [])

  const updateRole = async (userId: string, newRole: string) => {
    if (isDemoAdmin) {
      flash(
        en
          ? "Preview Mode: Demo admin privileges cannot modify live roles."
          : "पूर्वावलोकन मोड: डेमो व्यवस्थापक भूमिकाएं नहीं बदल सकता।"
      )
      return
    }
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase
      .from("patients")
      .update({ role: newRole })
      .eq("id", userId)
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      flash(en ? `Role updated to ${newRole}` : `भूमिका ${newRole} में बदली`)
    }
    setUpdating(null)
  }

  const removeUser = async (userId: string) => {
    if (isDemoAdmin) {
      flash(
        en
          ? "Preview Mode: Demo admin privileges cannot delete users."
          : "पूर्वावलोकन मोड: डेमो व्यवस्थापक उपयोगकर्ता नहीं हटा सकता।"
      )
      return
    }
    setUpdating(userId)
    const supabase = createClient()
    const { error } = await supabase.from("patients").delete().eq("id", userId)
    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      flash(en ? "User removed successfully" : "उपयोगकर्ता हटाया गया")
    }
    setUpdating(null)
  }

  const handleApproveClaim = (claimId: string) => {
    const updated = updateDoctorClaimStatus(
      claimId,
      "approved",
      "Approved by Medical Administration Officer"
    )
    if (updated) {
      refreshClaims()
      flash(
        en
          ? `Doctor claim approved for ${updated.doctorName}`
          : `${updated.doctorName} का क्लेम स्वीकृत किया गया`
      )
    }
  }

  const handleRejectClaim = (claimId: string) => {
    const updated = updateDoctorClaimStatus(
      claimId,
      "rejected",
      "Rejected: Verification documents mismatch"
    )
    if (updated) {
      refreshClaims()
      flash(
        en
          ? `Claim rejected for ${updated.doctorName}`
          : `${updated.doctorName} का क्लेम अस्वीकृत किया गया`
      )
    }
  }

  const pendingClaimsCount = claims.filter(
    (c) => c.status === "pending_admin_approval"
  ).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">
              {en ? "Administration Console" : "प्रशासन कंसोल"}
            </h1>
            <p className="text-sm text-gray-500">
              {en
                ? "Manage system users, doctor verification claims, and role credentials"
                : "उपयोगकर्ता, डॉक्टर क्लेम सत्यापन और क्रेडेंशियल प्रबंधित करें"}
            </p>
          </div>
          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-200 shadow-2xs">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "users"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{en ? "Users" : "उपयोगकर्ता"}</span>
              <span className="text-[10px] opacity-80">({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("claims")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "claims"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
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
              <span className="font-bold">
                {en ? "Preview Mode (Demo Admin):" : "पूर्वावलोकन मोड (डेमो व्यवस्थापक):"}
              </span>{" "}
              {en
                ? "You are exploring the administration console in preview mode. Destructive actions (deleting users, role changes, database wiping) are disabled to protect live platform data."
                : "आप पूर्वावलोकन मोड में प्रशासन कंसोल देख रहे हैं। लाइव डेटा की सुरक्षा के लिए उपयोगकर्ताओं को हटाना या बदलना अक्षम है।"}
            </div>
          </div>
        )}

        {/* Success message alert */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Tab 1: Users */}
        {activeTab === "users" && (
          <UsersTab
            en={en}
            users={users}
            updating={updating}
            onUpdateRole={updateRole}
            onRemoveUser={removeUser}
          />
        )}

        {/* Tab 2: Doctor Claims & Invites */}
        {activeTab === "claims" && (
          <DoctorClaimsTab
            en={en}
            claims={claims}
            onApproveClaim={handleApproveClaim}
            onRejectClaim={handleRejectClaim}
          />
        )}
      </div>
    </div>
  )
}

export default AdminUserManagement
