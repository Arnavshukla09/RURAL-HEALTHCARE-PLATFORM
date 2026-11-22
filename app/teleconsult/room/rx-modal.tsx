"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Printer,
  Check,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react"

export interface RxData {
  doctorName: string
  nmcRegNo: string
  hospitalName: string
  patientName: string
  diagnosis: string
  medicines: string
  instructions: string
  followUp: string
}

interface RxModalProps {
  isOpen: boolean
  onClose: () => void
  rxData: RxData
  setRxData: React.Dispatch<React.SetStateAction<RxData>>
  en: boolean
  clinician: boolean
  recordError: string
  recordSaved: boolean
  savingRecord: boolean
  onSaveRecord: () => void
  onPrint: () => void
  onExit: () => void
}

export function RxModal({
  isOpen,
  onClose,
  rxData,
  setRxData,
  en,
  clinician,
  recordError,
  recordSaved,
  savingRecord,
  onSaveRecord,
  onPrint,
  onExit,
}: RxModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <Card className="max-w-2xl w-full bg-white text-slate-900 shadow-2xl rounded-3xl border-2 border-teal-500/50 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-teal-100" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                {clinician ? (en ? "Clinician Consultation Record" : "चिकित्सक परामर्श रिकॉर्ड") : (en ? "Patient-provided Consultation Notes" : "मरीज के परामर्श नोट")}
              </h3>
              <p className="text-xs text-teal-100">
                {en ? "Enter findings from this consultation. Saving requires server confirmation." : "इस परामर्श के निष्कर्ष दर्ज करें। सेव होने की सर्वर पुष्टि आवश्यक है।"}
              </p>
            </div>
          </div>
          <button data-voice-control="ui.5dc15754f719fa5b"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {recordError && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded-xl">{recordError}</p>}
          {recordSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                {en
                  ? "Consultation record saved to the patient's medical records."
                  : "प्रिस्क्रिप्शन मरीज के मेडिकल रिकॉर्ड में सेव हो गया!"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="font-bold text-slate-600 block">{en ? "Consulting Doctor:" : "डॉक्टर:"}</label>
              <Input data-voice-control="ui.c51c88f9104e7278"
                value={rxData.doctorName}
                readOnly
                className="h-8 text-xs bg-white mt-1" aria-label={[en ? "Consulting Doctor:" : "डॉक्टर:"].join(' ')}
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block">{en ? "NMC Registration No:" : "पंजीकरण संख्या:"}</label>
              <Input data-voice-control="ui.e865da80aceff0ee"
                value={rxData.nmcRegNo}
                readOnly
                placeholder={en ? "Not supplied by the registry" : "पंजीकरण विवरण उपलब्ध नहीं"}
                className="h-8 text-xs bg-white mt-1" aria-label={[en ? "NMC Registration No:" : "पंजीकरण संख्या:"].join(' ')}
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block">{en ? "Patient Name:" : "मरीज का नाम:"}</label>
              <Input data-voice-control="ui.c4bd6a0c207a1958"
                value={rxData.patientName}
                readOnly
                className="h-8 text-xs bg-white mt-1" aria-label={[en ? "Patient Name:" : "मरीज का नाम:"].join(' ')}
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block">{en ? "Clinical Diagnosis:" : "निदान / समस्या:"}</label>
              <Input data-voice-control="ui.f850cf56a2cae9b0"
                value={rxData.diagnosis}
                onChange={(e) => setRxData({ ...rxData, diagnosis: e.target.value })}
                className="h-8 text-xs bg-white mt-1" aria-label={[en ? "Clinical Diagnosis:" : "निदान / समस्या:"].join(' ')}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {clinician ? (en ? "Prescribed medicines and dosage:" : "दवाइयाँ और खुराक:") : (en ? "Medication notes from the consultation:" : "परामर्श की दवा संबंधी जानकारी:")}
            </label>
            <Textarea data-voice-control="ui.2db43e99d574fde6"
              value={rxData.medicines}
              onChange={(e) => setRxData({ ...rxData, medicines: e.target.value })}
              rows={3}
              className="text-xs bg-white font-mono" aria-label={[clinician ? (en ? "Prescribed medicines and dosage:" : "दवाइयाँ और खुराक:") : (en ? "Medication notes from the consultation:" : "परामर्श की दवा संबंधी जानकारी:")].join(' ')}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {en ? "Advice & Precautions:" : "सलाह व सावधानियां:"}
            </label>
            <Textarea data-voice-control="ui.9defd83df150752c"
              value={rxData.instructions}
              onChange={(e) => setRxData({ ...rxData, instructions: e.target.value })}
              rows={2}
              className="text-xs bg-white" aria-label={[en ? "Advice & Precautions:" : "सलाह व सावधानियां:"].join(' ')}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <Button data-voice-control="ui.f213ffd4ceb97f72"
              variant="outline"
              onClick={onPrint}
              className="border-teal-600 text-teal-700 hover:bg-teal-50 font-bold text-xs h-10 rounded-xl flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>{en ? "Print / Download PDF" : "प्रिंट / डाउनलोड पीडीएफ"}</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button data-voice-control="ui.30d625c54cd21538"
                onClick={onSaveRecord}
                disabled={savingRecord}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                {savingRecord ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>{en ? "Save to Patient Records" : "मेडिकल रिकॉर्ड में सेव करें"}</span>
              </Button>

              <Button data-voice-control="ui.93c78565c6d15f15"
                variant="ghost"
                onClick={onExit}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                {en ? "Close & Exit" : "बंद करें"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
