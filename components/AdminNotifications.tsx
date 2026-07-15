"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Bell, Send, Users, User, CheckCircle, Loader2, Search,
  Megaphone, AlertTriangle, Info, Heart, Trash2, Clock
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminNotificationsProps {
  language: string
}

interface Notification {
  id?: string
  recipient_type: "all" | "individual" | "role"
  recipient_id?: string
  recipient_role?: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "emergency"
  created_at?: string
  is_read?: boolean
}

const TYPE_COLORS: Record<string, { bg: string; icon: any; label: string }> = {
  info:      { bg: "bg-blue-100 text-blue-700",   icon: Info,           label: "Info" },
  warning:   { bg: "bg-orange-100 text-orange-700", icon: AlertTriangle, label: "Warning" },
  success:   { bg: "bg-green-100 text-green-700",  icon: CheckCircle,   label: "Success" },
  emergency: { bg: "bg-red-100 text-red-700",      icon: AlertTriangle, label: "Emergency" },
}

export function AdminNotifications({ language }: AdminNotificationsProps) {
  const en = language === "en"
  const [tab, setTab] = useState<"compose" | "sent">("compose")
  const [users, setUsers] = useState<any[]>([])
  const [sent, setSent] = useState<Notification[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [userSearch, setUserSearch] = useState("")

  const [form, setForm] = useState<Notification>({
    recipient_type: "all",
    title: "",
    message: "",
    type: "info",
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: userList }, { data: notifList }] = await Promise.all([
        supabase.from("patients").select("id, first_name, last_name, email, role").order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      ])
      setUsers(userList ?? [])
      setSent((notifList ?? []) as Notification[])
      setLoadingUsers(false)
    }
    load()
  }, [])

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000) }

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return
    if (form.recipient_type === "individual" && !form.recipient_id) return

    setSending(true)
    try {
      const supabase = createClient()
      const payload: any = {
        title: form.title,
        message: form.message,
        type: form.type,
        recipient_type: form.recipient_type,
      }
      if (form.recipient_type === "individual") payload.recipient_id = form.recipient_id
      if (form.recipient_type === "role") payload.recipient_role = form.recipient_role || "patient"

      const { data, error } = await supabase.from("notifications").insert(payload).select().single()
      if (!error && data) {
        setSent(prev => [data as Notification, ...prev])
        flash(en ? "Notification sent successfully!" : "सूचना सफलतापूर्वक भेजी गई!")
        setForm({ recipient_type: "all", title: "", message: "", type: "info" })
      } else {
        flash(en ? `Error: ${error?.message}` : `त्रुटि: ${error?.message}`)
      }
    } finally { setSending(false) }
  }

  const deleteNotif = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").delete().eq("id", id)
    setSent(prev => prev.filter(n => n.id !== id))
  }

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true
    return [u.first_name, u.last_name, u.email].join(" ").toLowerCase().includes(userSearch.toLowerCase())
  })

  const selectedUser = users.find(u => u.id === form.recipient_id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-purple-900">{en ? "Notification Center" : "सूचना केंद्र"}</h1>
          <p className="text-sm text-gray-500">{en ? "Send announcements to users individually or in bulk" : "उपयोगकर्ताओं को व्यक्तिगत या सामूहिक सूचनाएं भेजें"}</p>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4" />{successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl bg-white border border-gray-200 p-1 gap-1 w-fit">
          <button onClick={() => setTab("compose")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "compose" ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <Send className="h-4 w-4 inline mr-1.5" />{en ? "Compose" : "लिखें"}
          </button>
          <button onClick={() => setTab("sent")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "sent" ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <Bell className="h-4 w-4 inline mr-1.5" />{en ? "Sent" : "भेजे गए"} ({sent.length})
          </button>
        </div>

        {/* Compose */}
        {tab === "compose" && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Compose form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-purple-600" />
                  {en ? "Compose Notification" : "सूचना लिखें"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient type */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">{en ? "Send To" : "प्राप्तकर्ता"}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "all", label: en ? "Everyone" : "सभी", icon: Users },
                      { value: "role", label: en ? "By Role" : "भूमिका से", icon: Megaphone },
                      { value: "individual", label: en ? "Individual" : "व्यक्तिगत", icon: User },
                    ] as const).map(opt => {
                      const Icon = opt.icon
                      return (
                        <button key={opt.value}
                          onClick={() => setForm(f => ({ ...f, recipient_type: opt.value, recipient_id: undefined, recipient_role: undefined }))}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                            form.recipient_type === opt.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}>
                          <Icon className="h-4 w-4" />{opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Role selector */}
                {form.recipient_type === "role" && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Role" : "भूमिका"}</label>
                    <select value={form.recipient_role || "patient"} onChange={e => setForm(f => ({ ...f, recipient_role: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400 capitalize">
                      {["patient", "doctor", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {/* Individual user search */}
                {form.recipient_type === "individual" && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      {en ? "Select User" : "उपयोगकर्ता चुनें"}
                      {selectedUser && <span className="ml-2 text-purple-600 font-medium">✓ {selectedUser.first_name} {selectedUser.last_name}</span>}
                    </label>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                        placeholder={en ? "Search user..." : "उपयोगकर्ता खोजें..."}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                    </div>
                    <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl">
                      {filteredUsers.slice(0, 20).map(u => (
                        <button key={u.id} onClick={() => setForm(f => ({ ...f, recipient_id: u.id }))}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0 ${
                            form.recipient_id === u.id ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}>
                          <span className="font-medium">{u.first_name} {u.last_name}</span>
                          <span className="ml-2 text-gray-400">{u.email}</span>
                          <Badge className={`ml-1 text-[10px] border-0 ${u.role === "doctor" ? "bg-teal-100 text-teal-700" : u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {u.role}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">{en ? "Notification Type" : "सूचना प्रकार"}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TYPE_COLORS).map(([k, v]) => {
                      const Icon = v.icon
                      return (
                        <button key={k} onClick={() => setForm(f => ({ ...f, type: k as any }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                            form.type === k ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                          }`}>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${v.bg}`}><Icon className="h-3 w-3 inline" /></span>
                          {v.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Title *" : "शीर्षक *"}</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={en ? "Notification title..." : "सूचना का शीर्षक..."}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Message *" : "संदेश *"}</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={4} placeholder={en ? "Type your message here..." : "यहां संदेश लिखें..."}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 resize-none" />
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {form.recipient_type === "all" ? (en ? `Send to All (${users.length})` : `सभी को भेजें (${users.length})`) :
                   form.recipient_type === "role" ? (en ? `Send to All ${form.recipient_role || "patient"}s` : `सभी ${form.recipient_role || "patient"} को भेजें`) :
                   (en ? "Send to User" : "उपयोगकर्ता को भेजें")}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="border-dashed border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-purple-700">{en ? "Preview" : "पूर्वावलोकन"}</CardTitle>
              </CardHeader>
              <CardContent>
                {!form.title && !form.message ? (
                  <div className="text-center py-8 text-gray-300">
                    <Bell className="h-12 w-12 mx-auto mb-3" />
                    <p className="text-sm">{en ? "Fill in the form to preview" : "पूर्वावलोकन के लिए फ़ॉर्म भरें"}</p>
                  </div>
                ) : (
                  <div className={`rounded-2xl p-4 ${TYPE_COLORS[form.type]?.bg || "bg-gray-100"} space-y-2`}>
                    <div className="flex items-start gap-3">
                      {(() => { const Icon = TYPE_COLORS[form.type]?.icon || Info; return <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" /> })()}
                      <div>
                        <p className="font-semibold text-sm">{form.title || "—"}</p>
                        <p className="text-sm mt-1 leading-relaxed">{form.message || "—"}</p>
                        <p className="text-xs opacity-60 mt-2">
                          {en ? "To: " : "को: "}
                          {form.recipient_type === "all" ? (en ? `All users (${users.length})` : `सभी (${users.length})`) :
                           form.recipient_type === "role" ? (en ? `All ${form.recipient_role || "patient"}s` : `सभी ${form.recipient_role || "patient"}`) :
                           selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : (en ? "Select a user" : "उपयोगकर्ता चुनें")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sent list */}
        {tab === "sent" && (
          <div className="space-y-3">
            {sent.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{en ? "No notifications sent yet" : "अभी कोई सूचना नहीं भेजी गई"}</p>
                </CardContent>
              </Card>
            ) : sent.map(n => {
              const tc = TYPE_COLORS[n.type] || TYPE_COLORS.info
              const Icon = tc.icon
              return (
                <Card key={n.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${tc.bg}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">{n.title}</span>
                            <Badge className={`text-xs border-0 ${tc.bg}`}>{tc.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {n.created_at ? new Date(n.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {n.recipient_type === "all" ? (en ? "All users" : "सभी") : n.recipient_type === "role" ? (n as any).recipient_role : (en ? "Individual" : "व्यक्तिगत")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteNotif(n.id!)}
                        className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
