/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.119.38.154', 'localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ncbyndyvmojhnbwheifq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Expands body size limit for app router routes and actions
    },
  },
};

module.exports = nextConfig;
