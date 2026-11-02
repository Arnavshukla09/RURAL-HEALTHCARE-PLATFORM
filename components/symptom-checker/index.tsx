"use client"

/**
 * components/symptom-checker/index.tsx
 *
 * Modular Symptom Checker — Guided 4-Step Clinical Assessment with Voice & AI Chat.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Triage Subsystem
 */

import { useState } from "react"
import { composeResponse } from "@/lib/symptoms/compose"
import { Step1PatientInfo } from "./parts/Step1PatientInfo"
import { Step2BodyPart } from "./parts/Step2BodyPart"
import { Step3Symptoms } from "./parts/Step3Symptoms"
import { Step4ResultChat } from "./parts/Step4ResultChat"
import { useSymptomChat } from "./hooks/useSymptomChat"
import {
  SYMPTOM_DB,
  SYMPTOM_HI,
  type SymptomCheckerProps,
  type PatientInfoState,
} from "./types"

export function SymptomChecker({ language }: SymptomCheckerProps) {
  const en = language === "en"

  // Step state
  const [step, setStep] = useState(1)
  const [patientInfo, setPatientInfo] = useState<PatientInfoState>({
    age: "",
    gender: "male",
    temperature: "",
    tempUnit: "F",
    daysSick: "1",
    intensity: "moderate",
  })
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [aiResult, setAiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    chatInput,
    setChatInput,
    chatMessages,
    chatLoading,
    translatingIdx,
    isListening,
    toggleListen,
    handleChat,
    handleToggleMessageLanguage,
    resetChat,
  } = useSymptomChat(language, selectedSymptoms)

  const symptomList = selectedBodyPart ? SYMPTOM_DB[selectedBodyPart] || [] : []

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )

  const handleAnalyze = async () => {
    setLoading(true)
    setError("")
    try {
      const composed = composeResponse(
        {
          symptoms: selectedSymptoms,
          intensity: patientInfo.intensity,
          temperature: patientInfo.temperature,
          tempUnit: patientInfo.tempUnit,
          daysSick: patientInfo.daysSick,
          age: patientInfo.age,
          gender: patientInfo.gender,
        },
        language
      )

      let data: any = {
        urgency: composed.urgency,
        specialistNeeded: composed.specialistNeeded,
        immediateActions: composed.immediateActions,
        homeCare: composed.homeCare,
        whenToGoToHospital: composed.whenToGoToHospital,
        possibleConditions: [],
      }

      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const res = await fetch("/api/symptom-analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              age: patientInfo.age || "unknown",
              gender: patientInfo.gender,
              temperature: patientInfo.temperature,
              tempUnit: patientInfo.tempUnit,
              daysSick: patientInfo.daysSick,
              intensity: patientInfo.intensity,
              bodyPart: selectedBodyPart,
              symptoms: selectedSymptoms,
              language,
            }),
          })
          if (res.ok) {
            const apiData = await res.json()
            if (!apiData.error) {
              data = {
                ...data,
                ...apiData,
                urgency:
                  composed.urgency === "emergency"
                    ? "emergency"
                    : apiData.urgency || composed.urgency,
              }
            }
          }
        } catch (fetchErr) {
          console.warn("[SymptomChecker] Supplementary API call skipped, using composed result:", fetchErr)
        }
      }

      setAiResult(data)
      setStep(4)

      const promptText = en
        ? `What home care and remedies should I follow for: ${selectedSymptoms.join(", ")} (Fever: ${patientInfo.temperature ? patientInfo.temperature + "°" + patientInfo.tempUnit : "Normal"}, ${patientInfo.daysSick} days, ${patientInfo.intensity} intensity)?`
        : `${selectedSymptoms.map((s) => SYMPTOM_HI[s] || s).join(", ")} (बुखार: ${patientInfo.temperature ? patientInfo.temperature + "°" + patientInfo.tempUnit : "सामान्य"}, ${patientInfo.daysSick} दिन, ${patientInfo.intensity} तीव्रता) के लिए क्या घरेलू उपचार और देखभाल करनी चाहिए?`

      handleChat(promptText, data)
    } catch (e: any) {
      setError(e.message || "Analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setSelectedBodyPart(null)
    setSelectedSymptoms([])
    setAiResult(null)
    setError("")
    setPatientInfo({
      age: "",
      gender: "male",
      temperature: "",
      tempUnit: "F",
      daysSick: "1",
      intensity: "moderate",
    })
    resetChat()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{en ? "Symptom Checker" : "लक्षण जांचकर्ता"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {en ? "AI-powered health assessment" : "AI-संचालित स्वास्थ्य मूल्यांकन"}
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`flex items-center ${s < 4 ? "flex-1 max-w-16" : ""}`}>
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s <= step ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded ${s < step ? "bg-teal-600" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 text-xs text-muted-foreground mt-1">
            {[
              en ? "Info" : "जानकारी",
              en ? "Body Part" : "अंग",
              en ? "Symptoms" : "लक्षण",
              en ? "AI Analysis" : "विश्लेषण",
            ].map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>

        {/* Step 1: Demographics & Vitals */}
        {step === 1 && (
          <Step1PatientInfo
            en={en}
            patientInfo={patientInfo}
            setPatientInfo={setPatientInfo}
            onNext={() => setStep(2)}
          />
        )}

        {/* Step 2: Body Part */}
        {step === 2 && (
          <Step2BodyPart
            en={en}
            selectedBodyPart={selectedBodyPart}
            setSelectedBodyPart={setSelectedBodyPart}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {/* Step 3: Symptoms */}
        {step === 3 && (
          <Step3Symptoms
            en={en}
            symptomList={symptomList}
            selectedSymptoms={selectedSymptoms}
            toggleSymptom={toggleSymptom}
            onBack={() => setStep(2)}
            onAnalyze={handleAnalyze}
            loading={loading}
            error={error}
          />
        )}

        {/* Step 4: AI Analysis & Consultation Chat */}
        {step === 4 && aiResult && (
          <Step4ResultChat
            en={en}
            language={language}
            aiResult={aiResult}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatLoading={chatLoading}
            isListening={isListening}
            toggleListen={toggleListen}
            handleChat={handleChat}
            handleToggleMessageLanguage={handleToggleMessageLanguage}
            translatingIdx={translatingIdx}
            onReset={reset}
          />
        )}
      </div>
    </div>
  )
}

export default SymptomChecker
