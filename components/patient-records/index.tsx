"use client"

/**
 * components/patient-records/index.tsx
 *
 * Modular Patient Medical Records Manager.
 * Features tag filtering, user-scoped privacy isolation, and manual/file uploads.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText, Upload, Plus, Loader2, AlertCircle, CheckCircle, Lock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { MedicalProfileCard } from './parts/MedicalProfileCard'
import { VitalsCard } from './parts/VitalsCard'
import { AddRecordCard } from './parts/AddRecordCard'
import { RecordItem } from './parts/RecordItem'
import { RecordFilterRow } from './parts/RecordFilterRow'
import { usePatientRecords } from './hooks/usePatientRecords'
import {
  getRecordTag,
  type RecordFilterTag,
  type PatientRecordsProps
} from './types'

export function PatientRecords({ language, user }: PatientRecordsProps) {
  const en = language === 'en'
  const isGuestOrUnauth = !user || user.id === 'guest'

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

  const [selectedTag, setSelectedTag] = useState<RecordFilterTag>('all')
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
    loginRequired: en ? 'Sign in to access your Medical Records' : 'अपने चिकित्सा रिकॉर्ड देखने के लिए लॉगिन करें',
    guestNotice: en
      ? 'Medical records are private, confidential, and encrypted. Guest users cannot access clinical files.'
      : 'चिकित्सा रिकॉर्ड गोपनीय और सुरक्षित हैं। अतिथि उपयोगकर्ताओं के लिए रिकॉर्ड उपलब्ध नहीं हैं।',
    savedOk: en ? 'Record saved successfully!' : 'रिकॉर्ड सफलतापूर्वक सेव हुआ!',
    deleteConfirm: en ? 'Are you sure you want to delete this record?' : 'क्या आप वाकई इस रिकॉर्ड को हटाना चाहते हैं?',
    noMatchingRecords: en ? 'No records found under this category.' : 'इस श्रेणी में कोई रिकॉर्ड नहीं मिला।',
  }

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: records.length }
    for (const rec of records) {
      const tag = getRecordTag(rec)
      counts[tag] = (counts[tag] || 0) + 1
    }
    return counts
  }, [records])

  const displayedRecords = useMemo(() => {
    if (selectedTag === 'all') return records
    return records.filter((r) => getRecordTag(r) === selectedTag)
  }, [records, selectedTag])

  // Save manual record
  const handleSaveManual = async () => {
    if (!formData.content.trim() || isGuestOrUnauth) return
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
    if (!selectedFile || isGuestOrUnauth) return
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

  if (isGuestOrUnauth) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{t.loginRequired}</h2>
          <p className="text-xs text-gray-500 leading-relaxed">{t.guestNotice}</p>
        </div>
      </div>
    )
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
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 space-y-3 min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  {t.records}
                </CardTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  {records.length} {en ? 'Total' : 'कुल'}
                </span>
              </div>

              {/* Tag separation filter bar */}
              <RecordFilterRow
                en={en}
                selectedTag={selectedTag}
                tagCounts={tagCounts}
                onSelectTag={setSelectedTag}
              />
            </CardHeader>
            <CardContent>
              {displayedRecords.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">{t.noMatchingRecords}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedRecords.map((rec, i) => (
                    <RecordItem
                      key={rec.id || i}
                      rec={rec}
                      en={en}
                      formatDate={formatDate}
                      onDelete={(id) => handleDeleteRecord(id, t.deleteConfirm)}
                    />
                  ))}
                </div>
              )}
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
