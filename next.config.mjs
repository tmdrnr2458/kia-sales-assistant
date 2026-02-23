/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.kiaofraleigh.com" },
      { protocol: "https", hostname: "*.dealer.com" },
      { protocol: "https", hostname: "*.dealereprocess.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
};

export default nextConfig;
