import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Aumentar limite para 10MB (compatível com MAX_FILE_SIZE)
    },
  },
};

export default nextConfig;
