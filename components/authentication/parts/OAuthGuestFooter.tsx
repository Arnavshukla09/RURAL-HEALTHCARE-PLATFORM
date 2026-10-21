"use client"

/**
 * components/authentication/parts/OAuthGuestFooter.tsx
 *
 * OAuth provider buttons and guest login trigger.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Auth Subsystem
 */

import { Button } from "@/components/ui/button"
import { Chrome } from "lucide-react"

interface OAuthGuestFooterProps {
  t: any
  onGoogleLogin: () => void
  onGuestAccess: () => void
  isLoading: boolean
}

export function OAuthGuestFooter({
  t,
  onGoogleLogin,
  onGuestAccess,
  isLoading,
}: OAuthGuestFooterProps) {
  return (
    <div className="mt-5 pt-4 border-t border-border space-y-3">
      <p className="text-xs text-center text-muted-foreground">{t.orContinueWith}</p>
      <Button
        variant="outline"
        onClick={onGoogleLogin}
        className="w-full"
        disabled={isLoading}
      >
        <Chrome className="h-4 w-4 mr-2" />
        Google
      </Button>
      <Button
        variant="ghost"
        onClick={onGuestAccess}
        className="w-full text-muted-foreground text-sm"
        disabled={isLoading}
      >
        {t.guestAccess}
      </Button>
    </div>
  )
}
