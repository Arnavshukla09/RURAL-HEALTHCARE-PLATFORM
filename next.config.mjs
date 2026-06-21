/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        // Prevent clickjacking (except Jitsi iframes which need frame-src)
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        // Prevent MIME-type sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // XSS protection fallback for older browsers
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        // Referrer control
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // HSTS — enforce HTTPS for 1 year (required for production)
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        // Permissions — allow camera/mic for Jitsi teleconsultation, restrict everything else
        { key: 'Permissions-Policy', value: 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=(self), payment=()' },
        // Content Security Policy — comprehensive, covers all services used
        { key: 'Content-Security-Policy', value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://meet.jit.si https://*.jitsi.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "frame-src https://meet.jit.si https://*.jitsi.net",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://meet.jit.si https://*.jitsi.net",
            "img-src 'self' data: blob: https://*.supabase.co https://tile.openstreetmap.org https://images.unsplash.com https://*.jitsi.net",
            "media-src 'self' https://meet.jit.si https://*.jitsi.net",
            "worker-src 'self' blob:",
          ].join('; ')
        },
      ],
    }];
  },
}
export default nextConfig
