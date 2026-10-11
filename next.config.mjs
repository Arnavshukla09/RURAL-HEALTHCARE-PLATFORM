/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  // Ensure gzip/brotli compression is applied to all responses.
  // Critical for rural mobile users on 2G (607KB uncompressed → ~150KB with Brotli).
  compress: true,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        // Prevent clickjacking
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        // Prevent MIME-type sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // XSS protection fallback for older browsers
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        // Referrer control
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // HSTS
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        // Permissions
        { key: 'Permissions-Policy', value: 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=(self), payment=()' },
        // Content Security Policy in Report-Only mode (Audit M1)
        {
          key: 'Content-Security-Policy-Report-Only',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://meet.jit.si https://8x8.vc",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://*.upstash.io https://meet.jit.si https://8x8.vc https://vitals.vercel-insights.com",
            "frame-src 'self' https://meet.jit.si https://8x8.vc",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
          ].join('; '),
        },
      ],
    }];
  },
}
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
