"use client"
import { useApp } from "@/components/providers/AppProvider"
import { Directory } from "@/components/Directory"

export default function Page() {
  const { language } = useApp()
  return <Directory language={language} />
}
