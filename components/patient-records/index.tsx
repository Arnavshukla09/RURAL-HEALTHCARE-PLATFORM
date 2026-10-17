"use client"

/**
 * components/patient-records/index.tsx
 *
 * Modular Patient Medical Records Manager.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText, Upload, Plus, Loader2, AlertCircle, CheckCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { MedicalProfileCard } from './parts/MedicalProfileCard'
import { VitalsCard } from './parts/VitalsCard'
import { AddRecordCard } from './parts/AddRecordCard'
import { RecordItem } from './parts/RecordItem'
import { usePatientRecords } from './hooks/usePatientRecords'
import type { PatientRecordsProps } from './types'

export function PatientRecords({ language, user }: PatientRecordsProps) {
  const en = language === 'en'

  const {
    records,
    setRecords,
    nextCursor,
    loadingMore,
    healthData,
    loading,
    error,
    setError,
    saveSuccess,
    setSaveSuccess,
    handleLoadMoreRecords,
    handleDeleteRecord,
  } = usePatientRecords(user?.id)

  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState<'manual' | 'upload' | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ record_type: 'prescription', content: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const t = {
    title: en ? 'My Medical Records' : 'मेरे चिकित्सा रिकॉर्ड',
    subtitle: en ? 'View and manage your health information' : 'अपनी स्वास्थ्य जानकारी देखें और प्रबंधित करें',
    noRecords: en ? 'No medical records yet' : 'अभी तक कोई चिकित्सा रिकॉर्ड नहीं',
    firstTimeTitle: en ? 'Start Building Your Health Profile' : 'अपनी स्वास्थ्य प्रोफ़ाइल बनाना शुरू करें',
    firstTimeDesc: en
      ? 'Upload your prescriptions, lab reports, or vaccination records to keep everything in one place. You can also add details manually.'
      : 'अपने प्रिस्क्रिप्शन, लैब रिपोर्ट या टीकाकरण रिकॉर्ड अपलोड करें। आप विवरण मैन्युअल रूप से भी जोड़ सकते हैं।',
    addManual: en ? 'Add Manually' : 'मैन्युअल रूप से जोड़ें',
    uploadFile: en ? 'Upload Report / Prescription' : 'रिपोर्ट / प्रिस्क्रिप्शन अपलोड करें',
    records: en ? 'Medical Records' : 'चिकित्सा रिकॉर्ड',
    loginRequired: en ? 'Please login to view records' : 'रिकॉर्ड देखने के लिए लॉगिन करें',
    savedOk: en ? 'Record saved successfully!' : 'रिकॉर्ड सफलतापूर्वक सेव हुआ!',
    deleteConfirm: en ? 'Are you sure you want to delete this record?' : 'क्या आप वाकई इस रिकॉर्ड को हटाना चाहते हैं?',
  }

  // Save manual record
  const handleSaveManual = async () => {
    if (!formData.content.trim()) return
    setSaving(true)
    setSaveSuccess('')
    try {
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_type: formData.record_type,
          content: formData.content,
        }),
      })
      if (res.ok) {
        setSaveSuccess(t.savedOk)
        setFormData({ record_type: 'prescription', content: '' })
        setShowAdd(false)
        setAddMode(null)
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to save')
      }
    } catch {
      setError(en ? 'Failed to save record' : 'रिकॉर्ड सेव विफल')
    } finally {
      setSaving(false)
    }
  }

  // Upload file + save record
  const handleUploadAndSave = async () => {
    if (!selectedFile) return
    setUploading(true)
    setSaveSuccess('')
    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) { setError(t.loginRequired); return }

      const ext = selectedFile.name.split('.').pop()
      const fileName = `${currentUser.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(fileName, selectedFile, { upsert: false })

      let fileUrl = ''
      if (uploadError) {
        console.warn('Storage upload failed (bucket may not exist):', uploadError.message)
        const res = await fetch('/api/medical-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record_type: formData.record_type,
            content: `[Uploaded: ${selectedFile.name}] ${formData.content}`.trim(),
          }),
        })
        if (res.ok) {
          setSaveSuccess(t.savedOk)
          setSelectedFile(null)
          setFormData({ record_type: 'prescription', content: '' })
          setShowAdd(false)
          setAddMode(null)
        } else {
          const err = await res.json()
          setError(typeof err.error === 'string' ? err.error : 'Failed to save')
        }
      } else {
        const { data: urlData } = supabase.storage
          .from('medical-records')
          .getPublicUrl(uploadData.path)
        fileUrl = urlData.publicUrl

        const res = await fetch('/api/medical-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record_type: formData.record_type,
            content: formData.content || `Uploaded: ${selectedFile.name}`,
            file_url: fileUrl,
          }),
        })
        if (res.ok) {
          setSaveSuccess(t.savedOk)
          setSelectedFile(null)
          setFormData({ record_type: 'prescription', content: '' })
          setShowAdd(false)
          setAddMode(null)
        } else {
          const err = await res.json()
          setError(typeof err.error === 'string' ? err.error : 'Failed to save')
        }
      }
    } catch {
      setError(en ? 'Upload failed' : 'अपलोड विफल')
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(en ? 'en-IN' : 'hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return d
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error && !records.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const isFirstTime = records.length === 0 && healthData.length === 0
  const hasMedicalProfile = records.some(r => typeof r.content === 'string' && r.content.includes('[Medical Profile]'))

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />{saveSuccess}
          </div>
        )}

        {/* Medical Profile Form */}
        {!hasMedicalProfile && (
          <MedicalProfileCard
            en={en}
            onProfileSaved={(newRec) => setRecords(prev => [newRec, ...prev])}
            onError={setError}
            onSuccess={setSaveSuccess}
          />
        )}

        {/* First time CTA */}
        {isFirstTime && !showAdd && (
          <Card className="border-2 border-dashed border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-teal-800 mb-2">{t.firstTimeTitle}</h2>
              <p className="text-sm text-teal-700/80 max-w-md mx-auto mb-6">{t.firstTimeDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => { setShowAdd(true); setAddMode('upload') }}
                  className="gradient-primary text-white gap-2 text-sm"
                >
                  <Upload className="h-4 w-4" />{t.uploadFile}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowAdd(true); setAddMode('manual') }}
                  className="gap-2 text-sm border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <Plus className="h-4 w-4" />{t.addManual}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Button toolbar */}
        {!isFirstTime && !showAdd && (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowAdd(true); setAddMode('upload') }}
              className="gap-1.5 text-teal-700 border-teal-300 hover:bg-teal-50"
            >
              <Upload className="h-4 w-4" />{en ? 'Upload' : 'अपलोड'}
            </Button>
            <Button
              size="sm"
              onClick={() => { setShowAdd(true); setAddMode('manual') }}
              className="gap-1.5 gradient-primary text-white"
            >
              <Plus className="h-4 w-4" />{en ? 'Add Record' : 'रिकॉर्ड जोड़ें'}
            </Button>
          </div>
        )}

        {/* Add Record Modal / Form */}
        {showAdd && addMode && (
          <AddRecordCard
            en={en}
            addMode={addMode}
            setAddMode={setAddMode}
            onClose={() => { setShowAdd(false); setAddMode(null); setSelectedFile(null) }}
            formData={formData}
            setFormData={setFormData}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            uploading={uploading}
            saving={saving}
            onSaveManual={handleSaveManual}
            onUploadAndSave={handleUploadAndSave}
          />
        )}

        {/* Vitals summary */}
        <VitalsCard en={en} healthData={healthData} formatDate={formatDate} />

        {/* Records list */}
        {records.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                {t.records}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {records.map((rec, i) => (
                  <RecordItem
                    key={rec.id || i}
                    rec={rec}
                    en={en}
                    formatDate={formatDate}
                    onDelete={(id) => handleDeleteRecord(id, t.deleteConfirm)}
                  />
                ))}
              </div>
              {nextCursor && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={handleLoadMoreRecords}
                  disabled={loadingMore}
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {en ? "Load more" : "और देखें"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default PatientRecords
