"use client"

import { useApp } from "@/components/providers/AppProvider"
import { Directory } from "@/components/Directory"

export function DirectoryClient() {
  const { language } = useApp()
  return <Directory language={language} />
}
