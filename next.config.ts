import type { NextConfig } from 'next'

const nextConfig: NextConfig = {

  // ── Fix: Power Automate POST redirect issue ──────────────
  skipTrailingSlashRedirect: true,
  trailingSlash: false,

  // ── Images ───────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io'
      },
      {
        protocol: 'https',
        hostname: '*.ufs.sh'
      }
    ]
  }

}

export default nextConfig
