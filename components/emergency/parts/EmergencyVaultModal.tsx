"use client"

/**
 * components/emergency/parts/EmergencyVaultModal.tsx
 *
 * Personal Emergency Vault (Offline) editing dialog.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HeartPulse, Users, Mic } from "lucide-react"
import type { EmergencyProfile } from "@/lib/emergency/vault"

interface EmergencyVaultModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingProfile: EmergencyProfile
  setEditingProfile: (profile: EmergencyProfile) => void
  onSave: () => void
  language: string
  t: any
}

export function EmergencyVaultModal({
  isOpen,
  onOpenChange,
  editingProfile,
  setEditingProfile,
  onSave,
  language,
  t,
}: EmergencyVaultModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-700 flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-red-600" />
            {t.vaultTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">{t.fullName}</label>
              <Input
                value={editingProfile.fullName}
                onChange={(e) => setEditingProfile({ ...editingProfile, fullName: e.target.value })}
                placeholder="Ramesh Kumar"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">{t.age}</label>
              <Input
                value={editingProfile.age}
                onChange={(e) => setEditingProfile({ ...editingProfile, age: e.target.value })}
                placeholder="45"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">{t.bloodGroup}</label>
            <select
              className="w-full border rounded-md p-2 text-xs sm:text-sm bg-white"
              value={editingProfile.bloodGroup}
              onChange={(e) => setEditingProfile({ ...editingProfile, bloodGroup: e.target.value })}
            >
              {["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 p-3 bg-red-50/60 border border-red-200 rounded-xl">
            <span className="text-xs font-bold text-red-900 block flex items-center gap-1.5">
              <Users className="h-4 w-4 text-red-600" />
              {language === "en" ? "Emergency Contacts (Up to 3 People)" : "आपातकालीन संपर्क (अधिकतम 3 लोग)"}
            </span>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">{t.primaryContact}</label>
              <Input
                value={editingProfile.primaryEmergencyContact}
                onChange={(e) => setEditingProfile({ ...editingProfile, primaryEmergencyContact: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">{t.secondaryContact}</label>
              <Input
                value={editingProfile.secondaryEmergencyContact}
                onChange={(e) => setEditingProfile({ ...editingProfile, secondaryEmergencyContact: e.target.value })}
                placeholder="+91 91234 56789"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">{t.tertiaryContact}</label>
              <Input
                value={editingProfile.tertiaryEmergencyContact || ""}
                onChange={(e) => setEditingProfile({ ...editingProfile, tertiaryEmergencyContact: e.target.value })}
                placeholder="+91 99887 76655"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">{t.chronicConditions}</label>
            <Input
              value={editingProfile.chronicConditions}
              onChange={(e) => setEditingProfile({ ...editingProfile, chronicConditions: e.target.value })}
              placeholder="Diabetes Type 2, Hypertension, Heart Patient"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">{t.allergies}</label>
            <Input
              value={editingProfile.severeAllergies}
              onChange={(e) => setEditingProfile({ ...editingProfile, severeAllergies: e.target.value })}
              placeholder="Penicillin, Sulfa drugs, Peanuts"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">{t.medications}</label>
            <Input
              value={editingProfile.currentMedications}
              onChange={(e) => setEditingProfile({ ...editingProfile, currentMedications: e.target.value })}
              placeholder="Metformin 500mg, Telmisartan 40mg"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Mic className="h-4 w-4 text-amber-700" />
              {t.customVoiceLabel}
            </label>
            <Input
              value={editingProfile.customVoiceAlert || ""}
              onChange={(e) => setEditingProfile({ ...editingProfile, customVoiceAlert: e.target.value })}
              placeholder={t.customVoicePlaceholder}
              className="bg-white border-amber-300 text-xs sm:text-sm"
            />
            <p className="text-[11px] text-amber-800 leading-tight">
              {t.customVoiceHint}
            </p>
          </div>

          <Button onClick={onSave} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
            {language === "en" ? "Save Emergency Profile" : "आपातकालीन प्रोफाइल सुरक्षित करें"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
