"use client"

/**
 * components/admin-user-management/parts/UsersTab.tsx
 *
 * User directory table with role promotion/demotion and removal controls.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Administration Subsystem
 */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Search,
  Trash2,
  Loader2,
  ChevronDown,
  Phone,
  AlertTriangle,
} from "lucide-react"
import { ROLES, ROLE_COLORS, type UserProfile } from "../types"

interface UsersTabProps {
  en: boolean
  users: UserProfile[]
  updating: string | null
  onUpdateRole: (userId: string, newRole: string) => void
  onRemoveUser: (userId: string) => void
}

export function UsersTab({
  en,
  users,
  updating,
  onUpdateRole,
  onRemoveUser,
}: UsersTabProps) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === "all" ? true : u.role === roleFilter
    const matchSearch = search
      ? [u.first_name, u.last_name, u.email, u.phone || ""]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      : true
    return matchRole && matchSearch
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={en ? "Search by name, email..." : "नाम, ईमेल से खोजें..."}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400"
          />
        </div>
        <div className="flex rounded-xl bg-white border border-gray-200 p-1 gap-1">
          {["all", ...ROLES].map((r) => (
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

              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                    deleteConfirm === user.id ? "bg-red-50" : ""
                  }`}
                >
                  {deleteConfirm === user.id ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700 flex-1">
                        {en
                          ? `Remove ${user.first_name} ${user.last_name}? This cannot be undone.`
                          : `${user.first_name} ${user.last_name} को हटाएं? यह पूर्ववत नहीं होगा।`}
                      </p>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
                        disabled={updating === user.id}
                        onClick={() => {
                          onRemoveUser(user.id)
                          setDeleteConfirm(null)
                        }}
                      >
                        {updating === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : en ? (
                          "Confirm Remove"
                        ) : (
                          "हटाएं"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setDeleteConfirm(null)}
                      >
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
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(user.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </div>
                      <div>
                        <div className="relative">
                          <select
                            value={user.role || "patient"}
                            disabled={updating === user.id}
                            onChange={(e) => onUpdateRole(user.id, e.target.value)}
                            className={`appearance-none w-full text-xs px-2 py-1 pr-6 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                              ROLE_COLORS[user.role] || ROLE_COLORS.patient
                            }`}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          {updating === user.id ? (
                            <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin" />
                          ) : (
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                          )}
                        </div>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setDeleteConfirm(user.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {en ? "Remove" : "हटाएं"}
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
  )
}
