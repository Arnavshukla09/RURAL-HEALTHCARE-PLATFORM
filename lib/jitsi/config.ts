// Jitsi Meet integration configuration
export const JITSI_CONFIG = {
  // Use Jitsi's public instance by default
  // For production, consider hosting your own Jitsi Meet server
  domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si",
  appName: "RuralHealthcare",

  // Default configuration for Jitsi
  config: {
    startAudioOnly: false,
    disableAudioLevels: false,
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableLobbyMode: false,
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
      "recording",
      "livestream",
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
      "recording",
    ],
  },
}

export function generateRoomName(): string {
  // Generate a unique room name for each consultation
  return `rhcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateJitsiUrl(roomName: string, displayName: string): string {
  const url = new URL(`https://${JITSI_CONFIG.domain}/${roomName}`)
  url.searchParams.append("jwt", "") // Add JWT token if needed for authentication
  return url.toString()
}
