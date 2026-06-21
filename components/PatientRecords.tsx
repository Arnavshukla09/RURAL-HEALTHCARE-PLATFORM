"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  FileText, Activity, Upload, Download, Calendar, Plus,
  Thermometer, Heart, Droplets, Eye, Loader2, AlertCircle,
  CheckCircle, X, File, Image, Stethoscope
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PatientRecordsProps {
  language: string
}

const RECORD_TYPES = [
  { value: 'prescription', label: 'Prescription', labelHi: 'प्रिस्क्रिप्शन', icon: '💊' },
  { value: 'lab_result', label: 'Lab Report', labelHi: 'लैब रिपोर्ट', icon: '🧪' },
  { value: 'diagnosis', label: 'Diagnosis', labelHi: 'निदान', icon: '🩺' },
  { value: 'vaccination', label: 'Vaccination', labelHi: 'टीकाकरण', icon: '💉' },
  { value: 'other', label: 'Other', labelHi: 'अन्य', icon: '📋' },
]

export function PatientRecords({ language }: PatientRecordsProps) {
  const [records, setRecords] = useState<any[]>([])
  const [healthData, setHealthData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState<'manual' | 'upload' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [formData, setFormData] = useState({ record_type: 'prescription', content: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const en = language === 'en'

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
    selectType: en ? 'Record Type' : 'रिकॉर्ड प्रकार',
    details: en ? 'Details / Notes' : 'विवरण / नोट्स',
    save: en ? 'Save Record' : 'रिकॉर्ड सेव करें',
    cancel: en ? 'Cancel' : 'रद्द करें',
    saving: en ? 'Saving...' : 'सेव हो रहा है...',
    savedOk: en ? 'Record saved successfully!' : 'रिकॉर्ड सफलतापूर्वक सेव हुआ!',
    chooseFile: en ? 'Choose file (JPG, PNG, PDF — max 5MB)' : 'फाइल चुनें (JPG, PNG, PDF — अधिकतम 5MB)',
    uploadAndSave: en ? 'Upload & Save' : 'अपलोड और सेव करें',
    vitals: en ? 'Latest Vitals' : 'नवीनतम संकेत',
    records: en ? 'Medical Records' : 'चिकित्सा रिकॉर्ड',
    loadError: en ? 'Could not load records. Please try again.' : 'रिकॉर्ड लोड नहीं हो सके। पुनः प्रयास करें।',
    loginRequired: en ? 'Please login to view records' : 'रिकॉर्ड देखने के लिए लॉगिन करें',
  }

  const typeLabels: Record<string, string> = {
    diagnosis: en ? 'Diagnosis' : 'निदान',
    prescription: en ? 'Prescription' : 'प्रिस्क्रिप्शन',
    lab_result: en ? 'Lab Report' : 'लैब रिपोर्ट',
    vaccination: en ? 'Vaccination' : 'टीकाकरण',
    other: en ? 'Other' : 'अन्य',
  }

  const typeBadgeColors: Record<string, string> = {
    diagnosis: 'bg-blue-100 text-blue-700',
    prescription: 'bg-purple-100 text-purple-700',
    lab_result: 'bg-amber-100 text-amber-700',
    vaccination: 'bg-green-100 text-green-700',
    other: 'bg-gray-100 text-gray-700',
  }

  // Fetch records via server API (handles patient auto-create)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the API route which securely resolves patient_id
        const res = await fetch('/api/medical-records')
        if (res.ok) {
          const data = await res.json()
          setRecords(data || [])
        } else if (res.status === 401) {
          setError(t.loginRequired)
        }

        // Fetch health data (vitals) — still use client for this
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: patient } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (patient?.id) {
            const { data: vitals } = await supabase
              .from('health_data')
              .select('*')
              .eq('patient_id', patient.id)
              .order('recorded_at', { ascending: false })
            setHealthData(vitals || [])
          }
        }
      } catch (err) {
        setError(t.loadError)
        console.error('Failed to fetch records:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [saveSuccess])

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError(t.loginRequired); return }

      // Upload to Supabase Storage
      const ext = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(fileName, selectedFile, { upsert: false })

      let fileUrl = ''
      if (uploadError) {
        // Storage bucket might not exist — save without file URL
        console.warn('Storage upload failed (bucket may not exist):', uploadError.message)
        // Save the record with file name in content instead
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
        // Get public URL
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
    try { return new Date(d).toLocaleDateString(en ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return d }
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

        {/* ── FIRST-TIME USER CTA ── */}
        {isFirstTime && !showAdd && (
          <Card className="border-2 border-dashed border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-teal-800 mb-2">{t.firstTimeTitle}</h2>
              <p className="text-sm text-teal-700/80 max-w-md mx-auto mb-6">{t.firstTimeDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => { setShowAdd(true); setAddMode('upload') }}
                  className="gradient-primary text-white gap-2 text-sm">
                  <Upload className="h-4 w-4" />{t.uploadFile}
                </Button>
                <Button variant="outline" onClick={() => { setShowAdd(true); setAddMode('manual') }}
                  className="gap-2 text-sm border-teal-300 text-teal-700 hover:bg-teal-50">
                  <Plus className="h-4 w-4" />{t.addManual}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── ADD BUTTON (when records exist) ── */}
        {!isFirstTime && !showAdd && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { setShowAdd(true); setAddMode('upload') }}
              className="gap-1.5 text-teal-700 border-teal-300 hover:bg-teal-50">
              <Upload className="h-4 w-4" />{en ? 'Upload' : 'अपलोड'}
            </Button>
            <Button size="sm" onClick={() => { setShowAdd(true); setAddMode('manual') }}
              className="gap-1.5 gradient-primary text-white">
              <Plus className="h-4 w-4" />{en ? 'Add Record' : 'रिकॉर्ड जोड़ें'}
            </Button>
          </div>
        )}

        {/* ── ADD FORM ── */}
        {showAdd && (
          <Card className="border-teal-200 bg-teal-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {addMode === 'upload' ? <Upload className="h-5 w-5 text-teal-600" /> : <Plus className="h-5 w-5 text-teal-600" />}
                  {addMode === 'upload' ? t.uploadFile : t.addManual}
                </CardTitle>
                <button onClick={() => { setShowAdd(false); setAddMode(null); setSelectedFile(null) }}
                  className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              {/* Mode switch */}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setAddMode('manual')}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${addMode === 'manual' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                  ✏️ {t.addManual}
                </button>
                <button onClick={() => setAddMode('upload')}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${addMode === 'upload' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
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
                    <button key={rt.value} onClick={() => setFormData(f => ({ ...f, record_type: rt.value }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                        formData.record_type === rt.value
                          ? 'border-teal-500 bg-teal-50 text-teal-800 font-medium'
                          : 'border-gray-200 bg-white hover:border-teal-300'
                      }`}>
                      <span>{rt.icon}</span>
                      <span>{en ? rt.label : rt.labelHi}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload area */}
              {addMode === 'upload' && (
                <div>
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all">
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
                <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setAddMode(null); setSelectedFile(null) }}>
                  {t.cancel}
                </Button>
                {addMode === 'upload' ? (
                  <Button size="sm" className="gradient-primary text-white gap-1.5" disabled={!selectedFile || uploading}
                    onClick={handleUploadAndSave}>
                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />{t.saving}</> : <><Upload className="h-4 w-4" />{t.uploadAndSave}</>}
                  </Button>
                ) : (
                  <Button size="sm" className="gradient-primary text-white gap-1.5" disabled={!formData.content.trim() || saving}
                    onClick={handleSaveManual}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" />{t.saving}</> : <><CheckCircle className="h-4 w-4" />{t.save}</>}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── VITALS ── */}
        {healthData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                {t.vitals}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {healthData[0]?.blood_pressure && (
                  <div className="bg-red-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Heart className="h-4 w-4 text-red-500" /><span className="text-xs font-medium text-red-700">{en ? 'BP' : 'रक्तचाप'}</span></div>
                    <p className="text-lg font-bold text-red-900">{healthData[0].blood_pressure}</p>
                  </div>
                )}
                {healthData[0]?.temperature && (
                  <div className="bg-orange-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Thermometer className="h-4 w-4 text-orange-500" /><span className="text-xs font-medium text-orange-700">{en ? 'Temp' : 'तापमान'}</span></div>
                    <p className="text-lg font-bold text-orange-900">{healthData[0].temperature}°F</p>
                  </div>
                )}
                {healthData[0]?.pulse_rate && (
                  <div className="bg-pink-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Activity className="h-4 w-4 text-pink-500" /><span className="text-xs font-medium text-pink-700">{en ? 'Pulse' : 'नाड़ी'}</span></div>
                    <p className="text-lg font-bold text-pink-900">{healthData[0].pulse_rate} bpm</p>
                  </div>
                )}
                {healthData[0]?.blood_sugar && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Droplets className="h-4 w-4 text-amber-500" /><span className="text-xs font-medium text-amber-700">{en ? 'Sugar' : 'शर्करा'}</span></div>
                    <p className="text-lg font-bold text-amber-900">{healthData[0].blood_sugar}</p>
                  </div>
                )}
                {healthData[0]?.spo2 && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Eye className="h-4 w-4 text-blue-500" /><span className="text-xs font-medium text-blue-700">SpO₂</span></div>
                    <p className="text-lg font-bold text-blue-900">{healthData[0].spo2}%</p>
                  </div>
                )}
                {healthData[0]?.weight && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><Stethoscope className="h-4 w-4 text-green-500" /><span className="text-xs font-medium text-green-700">{en ? 'Weight' : 'वजन'}</span></div>
                    <p className="text-lg font-bold text-green-900">{healthData[0].weight} kg</p>
                  </div>
                )}
              </div>
              {healthData[0]?.recorded_at && (
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {en ? 'Last recorded' : 'अंतिम रिकॉर्ड'}: {formatDate(healthData[0].recorded_at)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── RECORDS LIST ── */}
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
                  <div key={rec.id || i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs ${typeBadgeColors[rec.record_type] || typeBadgeColors.other}`}>
                          {typeLabels[rec.record_type] || rec.record_type}
                        </Badge>
                        {rec.created_at && <span className="text-xs text-muted-foreground">{formatDate(rec.created_at)}</span>}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{rec.content}</p>
                      {rec.file_url && (
                        <a href={rec.file_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mt-1">
                          <Download className="h-3 w-3" />{en ? 'View file' : 'फाइल देखें'}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
