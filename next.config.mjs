/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
  serverExternalPackages: ['playwright', 'archiver'],
};

export default config;
