const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.api\.mastchieve\.com\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'local-api-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Type-check/lint já são validados localmente antes do deploy; desativados aqui
  // porque essa fase do `next build` esgota a RAM do hosting cPanel (OOM kill).
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // O hosting cPanel reporta o nº de CPUs da máquina física partilhada, não o
  // limite real de RAM da conta — cada worker de build abre a sua própria
  // instância V8, multiplicando o consumo de memória até estourar o limite
  // (OOM kill). Forçar build single-thread evita isso.
  experimental: {
    serverActions: { allowedOrigins: ['localhost:4300', 'mastchieve.co.mz'] },
    cpus: 1,
    workerThreads: false,
  },
  images: {
    domains: ['localhost', 'mastchieve.co.mz', 'api.mastchieve.co.mz'],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4301/api/v1/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:4301/uploads/:path*',
      },
      {
        source: '/socket.io',
        destination: 'http://localhost:4301/socket.io',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:4301/socket.io/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
