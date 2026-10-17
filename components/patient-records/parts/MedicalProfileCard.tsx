"use client"

/**
 * components/patient-records/parts/MedicalProfileCard.tsx
 *
 * One-time basic medical profile collection card.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Loader2, CheckCircle } from 'lucide-react'

interface MedicalProfileCardProps {
  en: boolean
  onProfileSaved: (newRecord: any) => void
  onError: (msg: string) => void
  onSuccess: (msg: string) => void
}

export function MedicalProfileCard({ en, onProfileSaved, onError, onSuccess }: MedicalProfileCardProps) {
  const [profileForm, setProfileForm] = useState({ height: '', weight: '', bloodGroup: '', chronic: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const content = `[Medical Profile] Height: ${profileForm.height}cm, Weight: ${profileForm.weight}kg, Blood Group: ${profileForm.bloodGroup}, Chronic/Allergies: ${profileForm.chronic || 'None'}`
    try {
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_type: 'other',
          content: content,
        }),
      })
      if (res.ok) {
        const [newRecord] = await res.json()
        onProfileSaved(newRecord)
        onSuccess(en ? 'Medical profile saved successfully!' : 'मेडिकल प्रोफ़ाइल सफलतापूर्वक सेव की गई!')
      } else {
        onError(en ? 'Failed to save profile' : 'प्रोफ़ाइल सेव करने में विफल')
      }
    } catch {
      onError(en ? 'Failed to save profile' : 'प्रोफ़ाइल सेव करने में विफल')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <Activity className="h-5 w-5" />
          {en ? "Complete Your Medical Profile" : "अपनी मेडिकल प्रोफ़ाइल पूरी करें"}
        </CardTitle>
        <p className="text-sm text-blue-600/80">
          {en ? "Please fill this out once to help doctors understand your basic health." : "डॉक्टरों को आपके बुनियादी स्वास्थ्य को समझने में मदद करने के लिए कृपया इसे एक बार भरें।"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{en ? "Height (cm)" : "लंबाई (cm)"}</label>
            <input
              type="number"
              value={profileForm.height}
              onChange={e => setProfileForm(p => ({ ...p, height: e.target.value }))}
              className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
              placeholder="e.g. 170"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{en ? "Weight (kg)" : "वजन (kg)"}</label>
            <input
              type="number"
              value={profileForm.weight}
              onChange={e => setProfileForm(p => ({ ...p, weight: e.target.value }))}
              className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
              placeholder="e.g. 65"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{en ? "Blood Group" : "रक्त समूह"}</label>
            <select
              value={profileForm.bloodGroup}
              onChange={e => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
              className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
            >
              <option value="">{en ? "Select" : "चुनें"}</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-4">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{en ? "Chronic Conditions / Allergies" : "पुरानी बीमारियाँ / एलर्जी"}</label>
            <input
              type="text"
              value={profileForm.chronic}
              onChange={e => setProfileForm(p => ({ ...p, chronic: e.target.value }))}
              className="w-full text-sm p-2 border rounded-lg focus:ring-blue-500"
              placeholder={en ? "e.g. Asthma, Peanut allergy (leave blank if none)" : "उदा. अस्थमा, मूंगफली से एलर्जी"}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={savingProfile || !profileForm.height || !profileForm.weight || !profileForm.bloodGroup}
            onClick={handleSaveProfile}
          >
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            {en ? "Save Profile" : "प्रोफ़ाइल सेव करें"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
