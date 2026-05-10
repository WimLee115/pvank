/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
  serverExternalPackages: ['playwright', 'archiver', 'javascript-opentimestamps'],
};

export default config;
