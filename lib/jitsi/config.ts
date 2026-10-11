// Jitsi Meet integration configuration
/**
 * Jitsi Domain Configuration:
 * - Default: "meet.jit.si" (public 8x8 Jitsi instance).
 * - Production: Set NEXT_PUBLIC_JITSI_DOMAIN to your self-hosted Jitsi instance
 *   or 8x8 JaaS (Jitsi as a Service) tenant domain (e.g., 8x8.vc/your-tenant).
 *
 * TODO (Production Security): Implement server-signed JaaS/JWT tokens so that
 * unauthorized participants cannot enter teleconsultations even if they learn
 * the room ID. See: https://developer.8x8.com/jaas/docs/api-keys-jwt
 */
export const JITSI_CONFIG = {
  domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si",
  appName: "RuralHealthcare",

  // Default configuration for Jitsi
  config: {
    startAudioOnly: false,
    disableAudioLevels: false,
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableLobbyMode: true, // ✅ C5 fix: lobby enabled so doctor must admit patient
    prejoinPageEnabled: true,
    toolbarButtons: [
      "microphone",
      "camera",
      "closedcaptions",
      "desktop",
      "fullscreen",
      "fodeviceselection",
      "hangup",
      "profile",
      "info",
      "chat",
      // "recording" removed: prevents patients/guests recording consultations
      // "livestream" removed: prevents streaming medical consultations
      "etherpad",
      "settings",
      "raisehand",
      "videoquality",
      "filmstrip",
      "invite",
      "feedback",
      "stats",
      "shortcuts",
      "tileview",
      "select-background",
      "download-profile",
    ],
  },

  interfaceConfig: {
    SHOW_JITSI_WATERMARK: true,
    SHOW_WATERMARK_FOR_GUESTS: false,
    MOBILE_APP_PROMO: true,
    DEFAULT_BACKGROUND: "#474747",
    DEFAULT_LOCAL_DISPLAY_NAME: "me",
    DEFAULT_REMOTE_DISPLAY_NAME: "Guest",
    SHOW_BRAND_WATERMARK: false,
    BRAND_WATERMARK_LINK: "",
    INITIAL_TOOLBAR_TIMEOUT: 20000,
    TOOLBAR_TIMEOUT: 5000,
    TOOLBAR_ALWAYS_VISIBLE: false,
    DEFAULT_LANGUAGE: "en",
    SHOW_DEEP_LINKING_IMAGE: true,
    LANG_DETECTION: true,
    SHOW_HELLO_WORLD_PAGE: true,
    AUTHENTICATION_ENABLE: false,
    SHOW_AXES_OVERLAY: false,
    DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
    DISABLE_FOCUS_INDICATOR: false,
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
    DISABLE_VIDEO_BACKGROUND: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
    FILM_STRIP_ONLY_VISIBLE_IF_PINNED: false,
    HIDE_INVITE_MORE_HEADER: false,
    TOOLBAR_BUTTONS: [
      "microphone",
      "camera",
      "closedcaptions",
      "desktop",
      "fullscreen",
      "fodeviceselection",
      "hangup",
      "chat",
      // "recording" removed for patient privacy
    ],
  },
}

export function generateRoomName(): string {
  // Generate a cryptographically secure, unguessable room ID
  return `rhcp_${crypto.randomUUID()}`
}

export function generateJitsiUrl(roomName: string, displayName: string): string {
  const url = new URL(`https://${JITSI_CONFIG.domain}/${roomName}`)
  url.searchParams.append("jwt", "") // Add JWT token if needed for authentication
  return url.toString()
}

