"use client"

import { useState } from "react"
import { LandingPage } from "@/components/LandingPage"
import { Authentication } from "@/components/Authentication"
import { Dashboard } from "@/components/Dashboard"

export default function Page() {
  const [currentPage, setCurrentPage] = useState("landing")
  const [user, setUser] = useState<any>(null)
  const [language, setLanguage] = useState("en")

  if (currentPage === "auth") {
    return (
      <Authentication
        setUser={setUser}
        setCurrentPage={setCurrentPage}
        language={language}
      />
    )
  }

  if (currentPage === "dashboard" && user) {
    return (
      <Dashboard
        user={user}
        setCurrentPage={setCurrentPage}
        language={language}
      />
    )
  }

  return (
    <LandingPage
      setCurrentPage={setCurrentPage}
      language={language}
    />
  )
}
