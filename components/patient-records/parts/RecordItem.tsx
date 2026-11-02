"use client"

/**
 * components/patient-records/parts/RecordItem.tsx
 *
 * Renders an individual clinical record row with tag separation and file links.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import {
  FileText,
  Download,
  X,
  Pill,
  Stethoscope,
  TestTube,
  Calendar,
  MapPin,
  User,
  ClipboardList,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getRecordTag,
  TYPE_BADGE_COLORS,
  type MedicalRecord,
  type RecordFilterTag,
} from '../types'

interface RecordItemProps {
  rec: MedicalRecord
  en: boolean
  formatDate: (d: string) => string
  onDelete: (id: string) => void
}

export function RecordItem({ rec, en, formatDate, onDelete }: RecordItemProps) {
  const tag = getRecordTag(rec)

  const tagLabels: Record<RecordFilterTag, string> = {
    all: en ? 'Record' : 'रिकॉर्ड',
    prescription: en ? 'Prescription' : 'प्रिस्क्रिप्शन',
    diagnosis: en ? 'Diagnosis' : 'निदान',
    lab_result: en ? 'Lab Report' : 'लैब रिपोर्ट',
    consultation: en ? 'Consultation' : 'परामर्श',
    camp: en ? 'Health Camp' : 'स्वास्थ्य शिविर',
    profile: en ? 'Medical Profile' : 'स्वास्थ्य प्रोफ़ाइल',
    other: en ? 'Clinical Note' : 'चिकित्सा टिप्पणी',
  }

  const getTagIcon = (t: RecordFilterTag) => {
    switch (t) {
      case 'prescription':
        return <Pill className="h-4 w-4 text-purple-600" />
      case 'diagnosis':
        return <Stethoscope className="h-4 w-4 text-blue-600" />
      case 'lab_result':
        return <TestTube className="h-4 w-4 text-emerald-600" />
      case 'consultation':
        return <Calendar className="h-4 w-4 text-indigo-600" />
      case 'camp':
        return <MapPin className="h-4 w-4 text-amber-600" />
      case 'profile':
        return <User className="h-4 w-4 text-teal-600" />
      default:
        return <ClipboardList className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="flex items-start gap-3 p-3.5 bg-gray-50/90 rounded-xl hover:bg-gray-100/90 transition-colors border border-gray-100">
      <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
        {getTagIcon(tag)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={`text-xs font-semibold px-2 py-0.5 border ${TYPE_BADGE_COLORS[tag] || TYPE_BADGE_COLORS.other}`}>
              {tagLabels[tag]}
            </Badge>
            {rec.created_at && (
              <span className="text-[11px] text-gray-500">{formatDate(rec.created_at)}</span>
            )}
          </div>
          <button
            onClick={() => onDelete(rec.id)}
            className="text-red-500 hover:text-red-700 text-xs flex items-center p-1 rounded hover:bg-red-50 transition-colors shrink-0"
            title={en ? 'Delete record' : 'रिकॉर्ड हटाएं'}
          >
            <X className="h-3 w-3 mr-1" />
            <span>{en ? 'Delete' : 'हटाएं'}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
          {rec.content}
        </p>

        {rec.file_url && (
          <div className="flex items-center gap-2 mt-2">
            <a
              href={rec.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded-md border border-teal-200 font-medium hover:underline"
            >
              <Download className="h-3 w-3" />
              <span>{en ? 'View Attached Report / File' : 'संलग्न फाइल / रिपोर्ट देखें'}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
