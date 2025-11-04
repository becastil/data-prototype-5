/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@medical-reporting/lib', '@medical-reporting/ui'],
  experimental: {
    optimizePackageImports: ['@medical-reporting/ui', 'lucide-react'],
  },
}

module.exports = nextConfig
