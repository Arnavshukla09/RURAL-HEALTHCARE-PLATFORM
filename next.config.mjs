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
      ],
    }];
  },
}
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
