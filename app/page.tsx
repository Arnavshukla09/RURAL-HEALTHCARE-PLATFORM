'use client'

import { useState } from 'react'
import { LandingPage } from "@/components/LandingPage"

export default function Page() {
  const [currentPage, setCurrentPage] = useState('home')
  const [language, setLanguage] = useState('en')

  return <LandingPage setCurrentPage={setCurrentPage} language={language} />
}
