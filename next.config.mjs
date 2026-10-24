/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false, // the dev badge sits on top of the bottom action bars
  // A package-lock.json in the home folder above this repo would otherwise be taken as the workspace root.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
