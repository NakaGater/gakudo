import type { NextConfig } from "next";

// Phase 2-A: baseline security headers.
//
// CSP starts in Report-Only mode so we can ship the policy widely
// without breaking pages that legitimately load inline styles, fonts,
// or third-party assets we forgot. Once `/api/csp-report` (TODO,
// Phase 2-A.2) shows zero violations for a week in production, swap
// `Content-Security-Policy-Report-Only` for `Content-Security-Policy`.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

const cspDirectives = [
  "default-src 'self'",
  // Next.js needs 'unsafe-eval' in development for Fast Refresh and
  // 'unsafe-inline' for some hydration scripts. We tighten this in
  // production once nonce-based hashing lands (separate change).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind v4 emits a runtime <style> tag; next/font also injects.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: https://${supabaseHost} http://127.0.0.1:54321`,
  `connect-src 'self' https://${supabaseHost} http://127.0.0.1:54321 wss://${supabaseHost} wss://*.supabase.co`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: cspDirectives },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
