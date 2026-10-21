"use client"

/**
 * components/patient-records/parts/AddRecordCard.tsx
 *
 * Manual entry and document upload form for clinical records.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Plus, X, File, Loader2, CheckCircle } from 'lucide-react'
import { RECORD_TYPES } from '../types'

interface AddRecordCardProps {
  en: boolean
  addMode: 'manual' | 'upload'
  setAddMode: (mode: 'manual' | 'upload') => void
  onClose: () => void
  formData: { record_type: string; content: string }
  setFormData: React.Dispatch<React.SetStateAction<{ record_type: string; content: string }>>
  selectedFile: File | null
  setSelectedFile: (file: File | null) => void
  uploading: boolean
  saving: boolean
  onSaveManual: () => void
  onUploadAndSave: () => void
}

export function AddRecordCard({
  en,
  addMode,
  setAddMode,
  onClose,
  formData,
  setFormData,
  selectedFile,
  setSelectedFile,
  uploading,
  saving,
  onSaveManual,
  onUploadAndSave,
}: AddRecordCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const t = {
    addManual: en ? 'Add Manually' : 'मैन्युअल रूप से जोड़ें',
    uploadFile: en ? 'Upload Report / Prescription' : 'रिपोर्ट / प्रिस्क्रिप्शन अपलोड करें',
    selectType: en ? 'Record Type' : 'रिकॉर्ड प्रकार',
    details: en ? 'Details / Notes' : 'विवरण / नोट्स',
    save: en ? 'Save Record' : 'रिकॉर्ड सेव करें',
    cancel: en ? 'Cancel' : 'रद्द करें',
    saving: en ? 'Saving...' : 'सेव हो रहा है...',
    chooseFile: en ? 'Choose file (JPG, PNG, PDF — max 5MB)' : 'फाइल चुनें (JPG, PNG, PDF — अधिकतम 5MB)',
    uploadAndSave: en ? 'Upload & Save' : 'अपलोड और सेव करें',
  }

  return (
    <Card className="border-teal-200 bg-teal-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {addMode === 'upload' ? <Upload className="h-5 w-5 text-teal-600" /> : <Plus className="h-5 w-5 text-teal-600" />}
            {addMode === 'upload' ? t.uploadFile : t.addManual}
          </CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Mode switch */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setAddMode('manual')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${addMode === 'manual' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            ✏️ {t.addManual}
          </button>
          <button
            onClick={() => setAddMode('upload')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${addMode === 'upload' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            📎 {t.uploadFile}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Record type */}
        <div>
          <label className="text-sm font-medium block mb-1.5">{t.selectType}</label>
          <div className="flex flex-wrap gap-2">
            {RECORD_TYPES.map(rt => (
              <button
                key={rt.value}
                onClick={() => setFormData(f => ({ ...f, record_type: rt.value }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                  formData.record_type === rt.value
                    ? 'border-teal-500 bg-teal-50 text-teal-800 font-medium'
                    : 'border-gray-200 bg-white hover:border-teal-300'
                }`}
              >
                <span>{rt.icon}</span>
                <span>{en ? rt.label : rt.labelHi}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upload area */}
        {addMode === 'upload' && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-teal-700">
                  <File className="h-5 w-5" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-gray-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{t.chooseFile}</p>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Notes/details */}
        <div>
          <label className="text-sm font-medium block mb-1.5">{t.details}</label>
          <textarea
            rows={3}
            value={formData.content}
            onChange={e => setFormData(f => ({ ...f, content: e.target.value }))}
            placeholder={en
              ? 'e.g. "Dr. Singh prescribed Paracetamol 500mg for 5 days for viral fever"'
              : 'जैसे "डॉ. सिंह ने वायरल बुखार के लिए 5 दिन पैरासिटामोल 500mg लिखा"'}
            className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:border-teal-500 resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t.cancel}
          </Button>
          {addMode === 'upload' ? (
            <Button
              size="sm"
              className="gradient-primary text-white gap-1.5"
              disabled={!selectedFile || uploading}
              onClick={onUploadAndSave}
            >
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />{t.saving}</> : <><Upload className="h-4 w-4" />{t.uploadAndSave}</>}
            </Button>
          ) : (
            <Button
              size="sm"
              className="gradient-primary text-white gap-1.5"
              disabled={!formData.content.trim() || saving}
              onClick={onSaveManual}
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />{t.saving}</> : <><CheckCircle className="h-4 w-4" />{t.save}</>}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
