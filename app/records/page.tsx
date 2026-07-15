"use client"
import { useApp } from "@/components/providers/AppProvider"
import { PatientRecords } from "@/components/PatientRecords"

export default function Page() {
  const { language } = useApp()
  return <PatientRecords language={language} />
}
