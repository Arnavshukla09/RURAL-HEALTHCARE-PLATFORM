"use client"

/**
 * components/admin-campaign-manager/index.tsx
 *
 * Modularized AdminCampaignManager component for Rural Healthcare Platform.
 * Full CRUD management over public and mobile health camps, TB screenings, and immunization drives.
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Campaigns Subsystem
 */

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, Plus, X, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  type AdminCampaignManagerProps,
  type Campaign,
  emptyForm,
} from "./types"
import { CampaignForm } from "./parts/CampaignForm"
import { CampaignCard } from "./parts/CampaignCard"

export function AdminCampaignManager({ language }: AdminCampaignManagerProps) {
  const en = language === "en"
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Campaign>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("camps")
      .select("*")
      .order("start_date", { ascending: false })
    if (error) console.error("camps fetch error:", error)
    setCampaigns((data ?? []) as Campaign[])
    setLoading(false)
  }

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const f = (k: keyof Campaign, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim() || !form.location.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title: form.title,
      description: form.description,
      location: form.location,
      address: form.address,
      start_date: form.start_date,
      end_date: form.end_date,
      start_time: form.start_time,
      status: form.status,
      category: form.category,
      participants: form.participants || null,
      phone: form.phone,
      map_url: form.map_url,
      is_annual: form.is_annual || false,
    }
    try {
      if (editing) {
        const { error } = await supabase
          .from("camps")
          .update(payload)
          .eq("id", editing)
        if (!error) {
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === editing ? ({ ...c, ...payload } as Campaign) : c
            )
          )
          flash(en ? "Campaign updated!" : "अभियान अपडेट हुआ!")
        } else {
          flash("Error: " + error.message)
        }
      } else {
        const { data, error } = await supabase
          .from("camps")
          .insert(payload)
          .select()
          .single()
        if (!error && data) {
          setCampaigns((prev) => [data as Campaign, ...prev])
          flash(en ? "Campaign created!" : "अभियान बनाया गया!")
        } else {
          flash("Error: " + error?.message)
        }
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm())
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("camps").delete().eq("id", id)
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
    setDeleteConfirm(null)
    flash(en ? "Campaign deleted" : "अभियान हटाया गया")
  }

  const startEdit = (c: Campaign) => {
    setForm({ ...c })
    setEditing(c.id!)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">
              {en ? "Campaign Manager" : "अभियान प्रबंधक"}
            </h1>
            <p className="text-sm text-gray-500">
              {campaigns.length} {en ? "campaigns" : "अभियान"}
            </p>
          </div>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => {
              setShowForm(!showForm)
              setEditing(null)
              setForm(emptyForm())
            }}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-1" />
                {en ? "Cancel" : "रद्द"}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                {en ? "New Campaign" : "नया अभियान"}
              </>
            )}
          </Button>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4" />
            {successMsg}
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <CampaignForm
            form={form}
            editing={editing}
            saving={saving}
            en={en}
            onChangeField={f}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditing(null)
            }}
          />
        )}

        {/* Campaign Cards */}
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-400">
                <Megaphone className="h-14 w-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-base">
                  {en ? "No campaigns yet" : "अभी कोई अभियान नहीं"}
                </p>
                <p className="text-xs mt-1">
                  {en
                    ? "Click 'New Campaign' to add one"
                    : "'नया अभियान' पर क्लिक करें"}
                </p>
              </CardContent>
            </Card>
          ) : (
            campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                deleteConfirm={deleteConfirm}
                en={en}
                onStartEdit={startEdit}
                onSetDeleteConfirm={setDeleteConfirm}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCampaignManager
