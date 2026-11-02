"use client"

import { useState, useEffect } from "react"
import { Download, RefreshCw, X, Share2, PlusSquare } from "lucide-react"
import { Button } from "./ui/button"

interface PwaUpdaterAndInstallerProps {
  language?: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaUpdaterAndInstaller({ language = "en" }: PwaUpdaterAndInstallerProps) {
  const [updateWaiting, setUpdateWaiting] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showIosPrompt, setShowIosPrompt] = useState(false)

  const en = language === "en"

  // 1. Service Worker update flow (Audit §2.3)
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    navigator.serviceWorker.ready.then((registration) => {
      // Check if already waiting
      if (registration.waiting) {
        setWaitingWorker(registration.waiting)
        setUpdateWaiting(true)
      }

      // Listen for updates found while browsing
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setUpdateWaiting(true)
            }
          })
        }
      })
    })

    // Reload once the new controller takes over
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  // 2. Install UX and Visit Counter (Audit §2.1)
  useEffect(() => {
    if (typeof window === "undefined") return

    // Don't show if already installed in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    if (isStandalone) return

    // Track visit count (show prompt after 2nd visit)
    let visits = 1
    try {
      visits = parseInt(localStorage.getItem("rhcp_visit_count") || "0", 10) + 1
      localStorage.setItem("rhcp_visit_count", String(visits))
    } catch {
      // Storage access may be blocked
    }

    const dismissed = sessionStorage.getItem("rhcp_install_dismissed") === "1"
    if (dismissed) return

    // Detect iOS Safari
    const ua = window.navigator.userAgent
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)

    if (isIos && isSafari && visits >= 2) {
      setShowIosPrompt(true)
    }

    // Android/Desktop Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (visits >= 2) {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
    } else {
      window.location.reload()
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowInstallBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismissBanner = () => {
    setShowInstallBanner(false)
    setShowIosPrompt(false)
    sessionStorage.setItem("rhcp_install_dismissed", "1")
  }

  return (
    <>
      {/* ── UPDATE AVAILABLE TOAST ── */}
      {updateWaiting && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-md bg-teal-900 text-white p-4 rounded-2xl shadow-2xl border border-teal-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-teal-800 flex items-center justify-center flex-shrink-0 text-teal-300">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {en ? "New version available" : "नया संस्करण उपलब्ध है"}
              </p>
              <p className="text-xs text-teal-200">
                {en ? "Update now for latest offline features" : "नवीनतम सुविधाओं के लिए अपडेट करें"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleApplyUpdate}
            className="bg-white text-teal-900 hover:bg-teal-100 font-semibold text-xs h-8 px-3 shadow"
          >
            {en ? "Reload" : "रीलोड"}
          </Button>
        </div>
      )}

      {/* ── ANDROID / DESKTOP INSTALL BANNER (after 2nd visit) ── */}
      {showInstallBanner && !updateWaiting && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-md bg-white text-gray-900 p-4 rounded-2xl shadow-2xl border border-gray-200 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0 text-white shadow-md">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {en ? "Install RuralHealth App" : "RuralHealth ऐप इंस्टॉल करें"}
              </p>
              <p className="text-xs text-gray-500">
                {en ? "Faster 2G access & offline triage" : "तेज़ 2G पहुंच और ऑफ़लाइन सुविधा"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="gradient-primary text-white font-medium text-xs h-8 px-3 shadow-sm"
            >
              {en ? "Install" : "इंस्टॉल"}
            </Button>
            <button
              onClick={handleDismissBanner}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── IOS SAFARI ADD TO HOME SCREEN HINT ── */}
      {showIosPrompt && !updateWaiting && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-sm bg-white text-gray-900 p-4 rounded-2xl shadow-2xl border border-gray-200 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                +
              </div>
              <p className="text-sm font-bold">
                {en ? "Install on iPhone" : "iPhone पर इंस्टॉल करें"}
              </p>
            </div>
            <button
              onClick={handleDismissBanner}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed flex items-center flex-wrap gap-1">
            {en ? (
              <>
                Tap <Share2 className="h-3.5 w-3.5 inline text-blue-600 mx-0.5" /> Share then select{" "}
                <strong className="inline-flex items-center gap-0.5">
                  <PlusSquare className="h-3.5 w-3.5 inline" /> Add to Home Screen
                </strong>
                .
              </>
            ) : (
              <>
                शेयर <Share2 className="h-3.5 w-3.5 inline text-blue-600 mx-0.5" /> दबाएं और फिर{" "}
                <strong className="inline-flex items-center gap-0.5">
                  <PlusSquare className="h-3.5 w-3.5 inline" /> होम स्क्रीन में जोड़ें
                </strong>{" "}
                चुनें।
              </>
            )}
          </p>
        </div>
      )}
    </>
  )
}
