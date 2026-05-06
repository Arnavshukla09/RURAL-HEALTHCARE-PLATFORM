/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false }, // ← set to false for production
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://meet.jit.si",
            "frame-src https://meet.jit.si",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "img-src 'self' data: https://*.supabase.co",
          ].join('; ')
        },
      ],
    }];
  },
}
export default nextConfig
