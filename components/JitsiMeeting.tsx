"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

interface JitsiMeetingProps {
  roomName: string
  displayName: string
  jwt?: string | null
  domain?: string
  onLeave?: () => void
  language?: string
}

export function JitsiMeeting({
  roomName,
  displayName,
  jwt,
  domain,
  onLeave,
  language = "en",
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveDomain = domain || process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si"

  const content = {
    en: {
      loading: "Initializing video conference...",
      error: "Failed to load video conference",
      tokenRequired: "Security Policy: A cryptographically signed token (JWT) is required for teleconsultation in production. Please join via your scheduled appointment.",
      retry: "Retry",
      leave: "Leave Meeting",
    },
    hi: {
      loading: "वीडियो कॉन्फ्रेंस शुरू किया जा रहा है...",
      error: "वीडियो कॉन्फ्रेंस लोड करने में विफल",
      tokenRequired: "सुरक्षा नीति: वीडियो परामर्श के लिए अधिकृत टोकन (JWT) अनिवार्य है। कृपया अपने अपॉइंटमेंट के माध्यम से जुड़ें।",
      retry: "पुनः प्रयास",
      leave: "मीटिंग छोड़ें",
    },
  }

  const t = content[language as keyof typeof content] || content.en

  useEffect(() => {
    const initJitsi = async () => {
      try {
        setLoading(true)
        setError(null)

        // Security Gate: Enforce JWT only if using paid 8x8 JaaS tenant or explicit token configuration
        const requiresToken = process.env.NEXT_PUBLIC_REQUIRE_JITSI_JWT === "true" || effectiveDomain.includes("8x8.vc")
        if (requiresToken && !jwt) {
          setError(t.tokenRequired)
          setLoading(false)
          return
        }

        // Load Jitsi script from configured domain (or 8x8 JaaS)
        if (!(window as any).JitsiMeetExternalAPI) {
          const script = document.createElement("script")
          const isJaaS = effectiveDomain.includes("8x8.vc") || effectiveDomain.includes("jaas")
          script.src = isJaaS ? "https://8x8.vc/external_api.js" : `https://${effectiveDomain}/external_api.js`
          script.async = true
          document.body.appendChild(script)

          // Wait for script to load
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = () => reject(new Error(`Failed to load Jitsi script from ${script.src}`))
          })
        }

        if (!containerRef.current) return

        const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI

        const options: Record<string, any> = {
          roomName: roomName,
          width: "100%",
          height: "100%",
          parentNode: containerRef.current,
          configOverwrite: {
            startAudioOnly: false,
            disableAudioLevels: false,
            enableWelcomePage: false,
            enableClosePage: false,
          },
          interfaceConfigOverwrite: {
            DEFAULT_LANGUAGE: language === "hi" ? "hi" : "en",
            SHOW_JITSI_WATERMARK: false,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "hangup",
              "chat",
              "raisehand",
              "tileview",
            ],
          },
          userInfo: {
            displayName: displayName,
          },
        }

        if (jwt) {
          options.jwt = jwt
        }

        const api = new JitsiMeetExternalAPI(effectiveDomain, options)

        // Handle ready event
        api.addEventListener("videoConferenceJoined", () => {
          console.log("[v0] Joined video conference")
          setLoading(false)
        })

        // Handle error events
        api.addEventListener("onDisplayNameChange", (data: any) => {
          console.log("[v0] Display name changed:", data)
        })

        // Handle participant left
        api.addEventListener("participantLeft", (data: any) => {
          console.log("[v0] Participant left:", data)
        })

        // Cleanup on unmount
        return () => {
          try {
            api.dispose()
          } catch (e) {
            console.error("Error disposing Jitsi API:", e)
          }
        }
      } catch (err) {
        console.error("Error initializing Jitsi:", err)
        setError(language === "en" ? "Failed to load video conference" : "वीडियो कॉन्फ्रेंस लोड करने में विफल")
        setLoading(false)
      }
    }

    initJitsi()
  }, [roomName, displayName, language, jwt, domain])

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.error}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="mt-4">
            {t.retry}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full flex flex-col">
      {loading && (
        <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: loading ? "0px" : "600px" }}
      />
      {!loading && onLeave && (
        <Button variant="destructive" onClick={onLeave} className="mt-4">
          {t.leave}
        </Button>
      )}
    </div>
  )
}
