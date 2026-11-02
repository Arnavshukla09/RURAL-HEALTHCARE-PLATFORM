"use client"

/**
 * components/emergency/parts/EmergencyContactsModal.tsx
 *
 * Emergency Contacts SMS & WhatsApp dispatch dialog.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Users,
  FlaskConical,
  ShieldAlert,
  CheckSquare,
  Square,
  MessageCircle,
  MessageSquare,
  Share2,
} from "lucide-react"
import type { SavedContact } from "../types"

interface EmergencyContactsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  savedContacts: SavedContact[]
  selectedContactIds: number[]
  isTestSmsMode: boolean
  setIsTestSmsMode: (val: boolean) => void
  onToggleContactSelection: (id: number) => void
  onToggleSelectAll: () => void
  onSendNormalSms: () => void
  onSendWhatsApp: (number: string) => void
  onShareViaApps: () => void
  language: string
  t: any
}

export function EmergencyContactsModal({
  isOpen,
  onOpenChange,
  savedContacts,
  selectedContactIds,
  isTestSmsMode,
  setIsTestSmsMode,
  onToggleContactSelection,
  onToggleSelectAll,
  onSendNormalSms,
  onSendWhatsApp,
  onShareViaApps,
  language,
  t,
}: EmergencyContactsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-700 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            {t.contactModalTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs sm:text-sm">
          <p className="text-xs text-gray-600">
            {t.contactModalDesc}
          </p>

          <div className="flex items-center justify-between p-2 rounded-xl border bg-gray-50">
            <div className="flex items-center gap-2">
              {isTestSmsMode ? (
                <FlaskConical className="h-4 w-4 text-purple-600" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs font-bold ${isTestSmsMode ? "text-purple-700" : "text-red-700"}`}>
                {isTestSmsMode ? t.testModeActive : t.emergencyModeActive}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTestSmsMode(!isTestSmsMode)}
              className={`text-[11px] font-bold py-1 px-2.5 h-auto rounded-lg border ${
                isTestSmsMode
                  ? "border-red-400 text-red-700 bg-red-50 hover:bg-red-100"
                  : "border-purple-400 text-purple-700 bg-purple-50 hover:bg-purple-100"
              }`}
            >
              {isTestSmsMode
                ? language === "en"
                  ? "Switch to SOS"
                  : "एसओएस पर बदलें"
                : language === "en"
                  ? "Switch to Test"
                  : "टेस्ट पर बदलें"}
            </Button>
          </div>

          <div className="space-y-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
              <span className="text-[11px] font-bold text-amber-900">
                {language === "en" ? "Select Recipients:" : "प्राप्तकर्ता चुनें:"}
              </span>
              <button
                onClick={onToggleSelectAll}
                className="text-[11px] font-semibold text-amber-800 underline hover:text-amber-950"
              >
                {selectedContactIds.length === savedContacts.length
                  ? language === "en"
                    ? "Deselect All"
                    : "सभी हटाएं"
                  : language === "en"
                    ? "Select All (3)"
                    : "सभी चुनें (3)"}
              </button>
            </div>

            {savedContacts.map((contact) => {
              const isSelected = selectedContactIds.includes(contact.id)
              return (
                <div
                  key={contact.id}
                  onClick={() => onToggleContactSelection(contact.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                    isSelected
                      ? "bg-amber-100/90 border-amber-400 text-amber-950"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-amber-700 flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-xs block">{contact.label}</span>
                      <span className="font-mono text-[11px]">{contact.number}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSendWhatsApp(contact.number)
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-md flex items-center gap-1"
                    title="Direct WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span>{t.waDirect}</span>
                  </button>
                </div>
              )
            })}
          </div>

          <div className="space-y-2 pt-1">
            <Button
              onClick={onSendNormalSms}
              className={`w-full font-bold py-3 flex items-center justify-center gap-2 text-xs sm:text-sm rounded-xl shadow ${
                isTestSmsMode
                  ? "bg-purple-700 hover:bg-purple-800 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>
                {isTestSmsMode
                  ? `${t.sendTestSms} (${selectedContactIds.length})`
                  : `${t.sendSmsAll} (${selectedContactIds.length})`}
              </span>
            </Button>

            <Button
              onClick={onShareViaApps}
              variant="outline"
              className="w-full border-2 border-emerald-600 text-emerald-800 hover:bg-emerald-50 font-bold py-2.5 flex items-center justify-center gap-2 text-xs rounded-xl"
            >
              <Share2 className="h-4 w-4 text-emerald-600" />
              <span>{t.shareWaAll}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
