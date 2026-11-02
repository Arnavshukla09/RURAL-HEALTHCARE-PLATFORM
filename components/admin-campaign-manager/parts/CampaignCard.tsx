"use client"

/**
 * components/admin-campaign-manager/parts/CampaignCard.tsx
 *
 * Campaign summary card with actions, edit/delete triggers, and confirmation dialog.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Campaigns Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  MapPin,
  Phone,
  Users,
  Navigation,
  ExternalLink,
  Edit3,
  Trash2,
} from "lucide-react"
import { STATUS_COLORS, catLabel, type Campaign } from "../types"

interface CampaignCardProps {
  campaign: Campaign
  deleteConfirm: string | null
  en: boolean
  onStartEdit: (c: Campaign) => void
  onSetDeleteConfirm: (id: string | null) => void
  onDelete: (id: string) => void
}

export function CampaignCard({
  campaign: c,
  deleteConfirm,
  en,
  onStartEdit,
  onSetDeleteConfirm,
  onDelete,
}: CampaignCardProps) {
  const isConfirming = deleteConfirm === c.id

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-lg ${
        isConfirming ? "ring-2 ring-red-400" : "border border-gray-100"
      }`}
    >
      {isConfirming ? (
        <CardContent className="p-5 space-y-3">
          <p className="text-sm text-red-700 font-medium flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            {en
              ? `Delete "${c.title}"? This cannot be undone.`
              : `"${c.title}" हटाएं?`}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-red-600 text-white flex-1 h-8"
              onClick={() => onDelete(c.id!)}
            >
              {en ? "Yes, Delete" : "हां, हटाएं"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8"
              onClick={() => onSetDeleteConfirm(null)}
            >
              {en ? "Cancel" : "रद्द"}
            </Button>
          </div>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          {/* Colour band */}
          <div
            className={`h-1.5 w-full ${
              c.status === "active"
                ? "bg-green-500"
                : c.status === "upcoming"
                ? "bg-blue-500"
                : "bg-gray-300"
            }`}
          />
          <div className="p-5 space-y-3">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge
                    className={`text-xs border capitalize ${STATUS_COLORS[c.status]}`}
                  >
                    {c.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {catLabel(c.category)}
                  </Badge>
                  {c.is_annual && (
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-600 border-amber-200"
                    >
                      Annual
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {c.title}
                </h3>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onStartEdit(c)}
                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onSetDeleteConfirm(c.id!)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            {c.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {c.description}
              </p>
            )}

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
                <div>
                  <p className="font-medium">{c.location}</p>
                  {c.address && (
                    <p className="text-xs text-gray-400">{c.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
                <div>
                  <p className="font-medium">
                    {new Date(c.start_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {c.start_time && ` at ${c.start_time}`}
                  </p>
                  {c.is_annual && (
                    <p className="text-xs text-amber-600">Tentative — Annual</p>
                  )}
                  {c.end_date !== c.start_date && (
                    <p className="text-xs text-gray-400">
                      Until{" "}
                      {new Date(c.end_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
              {c.participants && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4 flex-shrink-0 text-purple-500" />
                  <span>
                    {c.participants} {en ? "participants" : "प्रतिभागी"}
                  </span>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 flex-shrink-0 text-purple-500" />
                  <a
                    href={`tel:${c.phone}`}
                    className="hover:text-purple-700 hover:underline"
                  >
                    {c.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {en ? "Call Camp" : "कॉल करें"}
                </a>
              )}
              {c.map_url && (
                <a
                  href={c.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <Navigation className="h-3 w-3" />
                  {en ? "Get Directions" : "दिशा पाएं"}
                </a>
              )}
              {c.map_url && (
                <a
                  href={c.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {en ? "View on Map" : "मैप पर देखें"}
                </a>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
