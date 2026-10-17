"use client"

/**
 * components/patient-records/parts/RecordItem.tsx
 *
 * Renders an individual clinical record row with ABDM FHIR export and file links.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { FileText, Download, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TYPE_BADGE_COLORS, type MedicalRecord } from '../types'

interface RecordItemProps {
  rec: MedicalRecord
  en: boolean
  formatDate: (d: string) => string
  onDelete: (id: string) => void
}

export function RecordItem({ rec, en, formatDate, onDelete }: RecordItemProps) {
  const typeLabels: Record<string, string> = {
    diagnosis: en ? 'Diagnosis' : 'निदान',
    prescription: en ? 'Prescription' : 'प्रिस्क्रिप्शन',
    lab_result: en ? 'Lab Report' : 'लैब रिपोर्ट',
    vaccination: en ? 'Vaccination' : 'टीकाकरण',
    other: en ? 'Other' : 'अन्य',
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center flex-shrink-0">
        <FileText className="h-5 w-5 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${TYPE_BADGE_COLORS[rec.record_type] || TYPE_BADGE_COLORS.other}`}>
              {typeLabels[rec.record_type] || rec.record_type}
            </Badge>
            {rec.created_at && (
              <span className="text-xs text-muted-foreground">{formatDate(rec.created_at)}</span>
            )}
          </div>
          <button
            onClick={() => onDelete(rec.id)}
            className="text-red-500 hover:text-red-700 text-xs flex items-center p-1 rounded hover:bg-red-50"
          >
            <X className="h-3 w-3 mr-1" /> {en ? 'Delete' : 'हटाएं'}
          </button>
        </div>
        <p className="text-sm text-gray-700 line-clamp-2">{rec.content}</p>
        <div className="flex items-center gap-2 mt-2">
          {rec.file_url && (
            <a
              href={rec.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline"
            >
              <Download className="h-3 w-3" />
              {en ? 'View file' : 'फाइल देखें'}
            </a>
          )}
          {rec.id && (
            <a
              href={`/api/abdm/fhir-export?record_id=${rec.id}`}
              download={`record-${rec.id}.fhir.json`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
              title="Download ABDM NRCES HL7 FHIR R4 Document Bundle"
            >
              <FileText className="h-3 w-3" />
              {en ? 'ABDM FHIR R4' : 'एबीडीएम एफएचआईआर'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
