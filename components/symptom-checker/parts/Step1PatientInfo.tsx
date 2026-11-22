"use client"

/**
 * components/symptom-checker/parts/Step1PatientInfo.tsx
 *
 * Patient demographics, temperature, and duration inputs.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Triage Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, ArrowRight } from "lucide-react"
import type { PatientInfoState } from "../types"

interface Step1PatientInfoProps {
  en: boolean
  patientInfo: PatientInfoState
  setPatientInfo: React.Dispatch<React.SetStateAction<PatientInfoState>>
  onNext: () => void
}

export function Step1PatientInfo({
  en,
  patientInfo,
  setPatientInfo,
  onNext,
}: Step1PatientInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-teal-600" />
          {en ? "Tell us about yourself" : "अपने बारे में बताएं"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{en ? "Age" : "उम्र"}</label>
            <input data-voice-control="ui.09c3bf8b9ba0ba8e"
              type="number"
              min="1"
              max="120"
              value={patientInfo.age}
              onChange={(e) => {
                const val = e.target.value
                if (val === "" || Number(val) > 0) {
                  setPatientInfo((p) => ({ ...p, age: val }))
                }
              }}
              placeholder={en ? "e.g. 35" : "जैसे 35"}
              className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500" aria-label={[en ? "Age" : "उम्र"].join(' ')}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{en ? "Gender" : "लिंग"}</label>
            <select data-voice-control="ui.0bdb63537eb71d2b"
              value={patientInfo.gender}
              onChange={(e) => setPatientInfo((p) => ({ ...p, gender: e.target.value }))}
              className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500 bg-white" aria-label={[en ? "Gender" : "लिंग"].join(' ')}
            >
              <option value="male">{en ? "Male" : "पुरुष"}</option>
              <option value="female">{en ? "Female" : "महिला"}</option>
              <option value="other">{en ? "Other" : "अन्य"}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium block">{en ? "Temperature" : "तापमान"}</label>
              <div className="flex gap-1 text-xs">
                <button data-voice-control="ui.ff28663a878928da"
                  type="button"
                  onClick={() => setPatientInfo((p) => ({ ...p, tempUnit: "C" }))}
                  className={`px-2 rounded ${patientInfo.tempUnit === "C" ? "bg-teal-600 text-white" : "bg-gray-200"}`}
                >
                  °C
                </button>
                <button data-voice-control="ui.75ed4c7f9e10f09f"
                  type="button"
                  onClick={() => setPatientInfo((p) => ({ ...p, tempUnit: "F" }))}
                  className={`px-2 rounded ${patientInfo.tempUnit === "F" ? "bg-teal-600 text-white" : "bg-gray-200"}`}
                >
                  °F
                </button>
              </div>
            </div>
            <input data-voice-control="ui.51657e2a3efda2c9"
              type="number"
              step="0.1"
              value={patientInfo.temperature}
              onChange={(e) => {
                const val = e.target.value
                if (val === "" || Number(val) > 0) {
                  setPatientInfo((p) => ({ ...p, temperature: val }))
                }
              }}
              placeholder={
                patientInfo.tempUnit === "F"
                  ? en ? "e.g. 101.5" : "जैसे 101.5"
                  : en ? "e.g. 38.5" : "जैसे 38.5"
              }
              className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              {en ? "How many days sick?" : "कितने दिनों से बीमार?"}
            </label>
            <select data-voice-control="ui.8dbc5283ca168b6c"
              value={patientInfo.daysSick}
              onChange={(e) => setPatientInfo((p) => ({ ...p, daysSick: e.target.value }))}
              className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500 bg-white" aria-label={[en ? "How many days sick?" : "कितने दिनों से बीमार?"].join(' ')}
            >
              {["1", "2", "3", "4-7", "7-14", "14+"].map((d) => (
                <option key={d} value={d}>
                  {d} {en ? "day(s)" : "दिन"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button data-voice-control="ui.7cebea74d56dfa48" onClick={onNext} className="gradient-primary text-white">
            {en ? "Next" : "अगला"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
