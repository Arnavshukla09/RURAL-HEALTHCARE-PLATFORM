"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Users, Search, Trash2, Shield, UserCheck, UserX, Loader2,
  ChevronDown, Mail, Phone, Calendar, AlertTriangle, CheckCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const router = useRouter();
  const en = language === "en"
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  const updateRole = async (userId: string, newRole: string) => {
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
    setUpdating(userId)
    const supabase = createClient()
    // Soft delete: set role to 'suspended' or hard delete patient row
    const { error } = await supabase.from("patients").delete().eq("id", userId)
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      flash(en ? "User removed successfully" : "उपयोगकर्ता हटाया गया")
    }
    setDeleteConfirm(null)
    setUpdating(null)
  }

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const filtered = users.filter(u => {
    const matchRole = roleFilter === "all" ? true : u.role === roleFilter
    const matchSearch = search
      ? [u.first_name, u.last_name, u.email, u.phone].join(" ").toLowerCase().includes(search.toLowerCase())
      : true
    return matchRole && matchSearch
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">{en ? "User Management" : "उपयोगकर्ता प्रबंधन"}</h1>
            <p className="text-sm text-gray-500">{en ? "Manage users, assign roles, and remove accounts" : "उपयोगकर्ता प्रबंधित करें, भूमिकाएं असाइन करें"}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${roleColors.patient}`}>{users.filter(u => u.role === "patient").length} patients</div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${roleColors.doctor}`}>{users.filter(u => u.role === "doctor").length} doctors</div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${roleColors.admin}`}>{users.filter(u => u.role === "admin").length} admins</div>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />{successMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={en ? "Search by name, email..." : "नाम, ईमेल से खोजें..."}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400" />
          </div>
          <div className="flex rounded-xl bg-white border border-gray-200 p-1 gap-1">
            {["all", ...ROLES].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${roleFilter === r ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {r === "all" ? (en ? "All" : "सभी") : r}
              </button>
            ))}
          </div>
        </div>

        {/* User table */}
        <Card>
          <CardContent className="p-0 overflow-hidden">
            {filtered.length === 0 ? (
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

                {filtered.map(user => (
                  <div key={user.id} className={`px-4 py-3.5 hover:bg-gray-50 transition-colors ${deleteConfirm === user.id ? "bg-red-50" : ""}`}>
                    {deleteConfirm === user.id ? (
                      /* Confirm delete inline */
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
                        {/* User info */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(user.first_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        {/* Contact */}
                        <div className="text-xs text-gray-500">
                          {user.phone ? (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                        {/* Joined */}
                        <div className="text-xs text-gray-400">
                          {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                        </div>
                        {/* Role selector */}
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
                        {/* Actions */}
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
    </div>
  )
}
