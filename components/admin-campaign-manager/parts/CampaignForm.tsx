"use client"

/**
 * components/admin-campaign-manager/parts/CampaignForm.tsx
 *
 * Campaign editor/creator form for administrators.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Campaigns Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { CATEGORIES, catLabel, type Campaign } from "../types"

interface CampaignFormProps {
  form: Campaign
  editing: string | null
  saving: boolean
  en: boolean
  onChangeField: (k: keyof Campaign, v: any) => void
  onSave: () => void
  onCancel: () => void
}

export function CampaignForm({
  form,
  editing,
  saving,
  en,
  onChangeField: f,
  onSave,
  onCancel,
}: CampaignFormProps) {
  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
        <CardTitle className="text-base">
          {editing
            ? en
              ? "✏️ Edit Campaign"
              : "अभियान संपादित करें"
            : en
            ? "➕ New Campaign"
            : "नया अभियान"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Title + Category */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Campaign Title *" : "अभियान शीर्षक *"}
            </label>
            <input data-voice-control="ui.3dec55e9561d423d"
              value={form.title}
              onChange={(e) => f("title", e.target.value)}
              placeholder="RNTCP TB Screening Camp"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Campaign Title *" : "अभियान शीर्षक *"].join(' ')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Category" : "श्रेणी"}
            </label>
            <select data-voice-control="ui.1aa2dc2b465decd9"
              value={form.category}
              onChange={(e) => f("category", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 bg-white capitalize" aria-label={[en ? "Category" : "श्रेणी"].join(' ')}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {catLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            {en ? "Description" : "विवरण"}
          </label>
          <textarea data-voice-control="ui.6db78d897e87809d"
            value={form.description}
            onChange={(e) => f("description", e.target.value)}
            rows={3}
            placeholder="Free sputum test, chest X-ray, CBNAAT testing under Nikshay Poshan Yojana"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 resize-none" aria-label={[en ? "Description" : "विवरण"].join(' ')}
          />
        </div>

        {/* Location + Address */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Venue Name *" : "स्थान नाम *"}
            </label>
            <input data-voice-control="ui.22bf3471d98db5e9"
              value={form.location}
              onChange={(e) => f("location", e.target.value)}
              placeholder="District TB Centre, Hamidia Hospital, Bhopal"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Venue Name *" : "स्थान नाम *"].join(' ')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Address / Landmark" : "पता / लैंडमार्क"}
            </label>
            <input data-voice-control="ui.0a717e00faea4c35"
              value={form.address || ""}
              onChange={(e) => f("address", e.target.value)}
              placeholder="Inside Hamidia Hospital Campus"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Address / Landmark" : "पता / लैंडमार्क"].join(' ')}
            />
          </div>
        </div>

        {/* Dates + Time + Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Start Date" : "शुरू तिथि"}
            </label>
            <input data-voice-control="ui.62a9468012434c48"
              type="date"
              value={form.start_date}
              onChange={(e) => f("start_date", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Start Date" : "शुरू तिथि"].join(' ')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Time" : "समय"}
            </label>
            <input data-voice-control="ui.7740b86a67ec1a43"
              type="time"
              value={form.start_time || "10:00"}
              onChange={(e) => f("start_time", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Time" : "समय"].join(' ')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "End Date" : "समाप्त तिथि"}
            </label>
            <input data-voice-control="ui.c4b3fb6ee216f869"
              type="date"
              value={form.end_date}
              onChange={(e) => f("end_date", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "End Date" : "समाप्त तिथि"].join(' ')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Status" : "स्थिति"}
            </label>
            <select data-voice-control="ui.b0612c86075bc180"
              value={form.status}
              onChange={(e) => f("status", e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 bg-white" aria-label={[en ? "Status" : "स्थिति"].join(' ')}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        {/* Participants + Phone + Map */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Expected Participants" : "प्रतिभागी"}
            </label>
            <input data-voice-control="ui.cb9c5e2bbef96e7d"
              type="number"
              min={0}
              value={form.participants ?? ""}
              onChange={(e) =>
                f("participants", e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="90"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Expected Participants" : "प्रतिभागी"].join(' ')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Contact Phone" : "संपर्क फ़ोन"}
            </label>
            <input data-voice-control="ui.1e0f27cf6bec58a2"
              value={form.phone || ""}
              onChange={(e) => f("phone", e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Contact Phone" : "संपर्क फ़ोन"].join(' ')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {en ? "Google Maps URL" : "मैप लिंक"}
            </label>
            <input data-voice-control="ui.5415f2c8c24bab2b"
              value={form.map_url || ""}
              onChange={(e) => f("map_url", e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" aria-label={[en ? "Google Maps URL" : "मैप लिंक"].join(' ')}
            />
          </div>
        </div>

        {/* Annual toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input data-voice-control="ui.8a0dca025ac6f7cc"
            type="checkbox"
            checked={form.is_annual || false}
            onChange={(e) => f("is_annual", e.target.checked)}
            className="h-4 w-4 rounded accent-purple-600"
          />
          <span className="text-sm text-gray-700">
            {en ? "Annual recurring event" : "वार्षिक आयोजन"}
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button data-voice-control="ui.94de833dd11e0205"
            className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {editing
              ? en
                ? "Save Changes"
                : "बदलाव सहेजें"
              : en
              ? "Create Campaign"
              : "अभियान बनाएं"}
          </Button>
          <Button data-voice-control="ui.a6aa4fb1f0a6f54f" variant="outline" onClick={onCancel}>
            {en ? "Cancel" : "रद्द"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
